import pandas as pd
import gspread
from google.oauth2.service_account import Credentials
from concurrent.futures import ThreadPoolExecutor, as_completed

def load_sheet_data(sheet_type, config, gc, log_callback):
    """Load data from Google Sheets based on sheet type."""
    try:
        if sheet_type == 'step7':
            sheet = gc.open_by_url(config['vendorDataUrl'])
            ws = sheet.worksheet('Working')  # Assuming worksheet name
            log_callback(f"Loading {sheet_type} data...")
            all_values = ws.get_all_values()
            if not all_values:
                return 'step7', []
            headers = [str(h).strip() if h else f"Empty_Col_{i}" for i, h in enumerate(all_values[0])]
            data = [dict(zip(headers, row)) for row in all_values[1:]]
            log_callback(f"Loaded {len(data)} records from {sheet_type}")
            return 'step7', data
        
        elif sheet_type == 'vqc':
            vqc_data = {}
            vqc_sheet = gc.open_by_url(config['vqcDataUrl'])
            log_callback("Loading VQC data...")
            # Assuming worksheet names are the vendor names
            for vendor in ['IHC', '3DE TECH', 'MAKENICA']:
                try:
                    ws = vqc_sheet.worksheet(vendor)
                    all_values = ws.get_all_values()
                    if all_values:
                        headers = [str(h).strip() if h else f"Empty_Col_{i}" for i, h in enumerate(all_values[0])]
                        vqc_data[vendor] = [dict(zip(headers, row)) for row in all_values[1:]]
                        log_callback(f"Loaded {len(vqc_data[vendor])} VQC records for {vendor}")
                except Exception as e:
                    log_callback(f"Warning: Could not load VQC sheet for '{vendor}': {e}")
            return 'vqc', vqc_data
        
        elif sheet_type == 'ft':
            sheet = gc.open_by_url(config['ftDataUrl'])
            ws = sheet.worksheet('Working')  # Assuming worksheet name
            log_callback(f"Loading {sheet_type} data...")
            all_values = ws.get_all_values()
            if not all_values:
                return 'ft', []
            headers = [str(h).strip() if h else f"Empty_Col_{i}" for i, h in enumerate(all_values[0])]
            data = [dict(zip(headers, row)) for row in all_values[1:]]
            log_callback(f"Loaded {len(data)} FT records")
            return 'ft', data

    except Exception as e:
        log_callback(f"ERROR loading {sheet_type} data: {e}")
        if sheet_type == 'vqc':
            return 'vqc', {}
        return sheet_type, []

def find_column(df, patterns):
    """Find column by matching patterns."""
    if not isinstance(patterns, list):
        patterns = [patterns]
    for pattern in patterns:
        for col in df.columns:
            if pattern.lower() == str(col).lower().strip():
                return col
    return None

def merge_ring_data_fast(step7_data, vqc_data, ft_data, log_callback):
    """Merge ring data from different sources."""
    if not step7_data:
        return []

    log_callback("Reshaping main vendor data...")
    df_step7 = pd.DataFrame(step7_data)
    vendor_mappings = {
        '3DE TECH': {'serial': 'UID', 'mo': '3DE MO', 'sku': 'SKU', 'size': 'SIZE'},
        'IHC': {'serial': 'IHC', 'mo': 'IHC MO', 'sku': 'IHC SKU', 'size': 'IHC SIZE'},
        'MAKENICA': {'serial': 'MAKENICA', 'mo': 'MK MO', 'sku': 'MAKENICA SKU', 'size': 'MAKENICA SIZE'}
    }
    all_vendor_dfs = []
    date_col = find_column(df_step7, ['logged_timestamp', 'timestamp', 'date'])
    
    for vendor, patterns in vendor_mappings.items():
        serial_col = find_column(df_step7, patterns['serial'])
        if not serial_col:
            continue
        mo_col = find_column(df_step7, patterns['mo'])
        sku_col = find_column(df_step7, patterns['sku'])
        size_col = find_column(df_step7, patterns['size'])
        
        cols_to_keep = {
            date_col: 'date',
            serial_col: 'serial_number',
            mo_col: 'mo_number',
            sku_col: 'sku',
            size_col: 'ring_size'
        }
        cols_to_keep = {k: v for k, v in cols_to_keep.items() if k is not None and k in df_step7.columns}
        
        vendor_df = df_step7[list(cols_to_keep.keys())].copy()
        vendor_df.rename(columns=cols_to_keep, inplace=True)
        vendor_df['vendor'] = vendor
        
        if 'serial_number' in vendor_df.columns:
            vendor_df.dropna(subset=['serial_number'], inplace=True)
            vendor_df['serial_number'] = vendor_df['serial_number'].astype(str).str.strip()
            all_vendor_dfs.append(vendor_df[vendor_df['serial_number'] != ''])
        else:
            log_callback(f"WARNING: 'serial_number' column not found for vendor {vendor}. Skipping this vendor's data.")
    
    if not all_vendor_dfs:
        raise ValueError("Could not process any vendor data from Step 7.")
    
    df_main = pd.concat(all_vendor_dfs, ignore_index=True)
    log_callback(f"Reshaped into {len(df_main)} total records.")

    log_callback("Preparing VQC and FT data...")
    all_vqc_dfs = [pd.DataFrame(data).assign(vendor=vendor) for vendor, data in vqc_data.items() if data]
    if all_vqc_dfs:
        df_vqc = pd.concat(all_vqc_dfs, ignore_index=True)
        rename_map = {
            find_column(df_vqc, ['uid', 'serial']): 'serial_number',
            find_column(df_vqc, ['status', 'result']): 'vqc_status',
            find_column(df_vqc, ['reason', 'comments']): 'vqc_reason'
        }
        df_vqc.rename(columns={k: v for k, v in rename_map.items() if k}, inplace=True)
        if 'serial_number' in df_vqc.columns:
            df_vqc.dropna(subset=['serial_number'], inplace=True)
            df_vqc['serial_number'] = df_vqc['serial_number'].astype(str).str.strip()
            df_vqc = df_vqc[[col for col in ['serial_number', 'vendor', 'vqc_status', 'vqc_reason'] if col in df_vqc.columns]]
    else:
        df_vqc = pd.DataFrame(columns=['serial_number', 'vendor', 'vqc_status', 'vqc_reason'])
    
    df_ft = pd.DataFrame(ft_data)
    if not df_ft.empty:
        rename_map = {
            find_column(df_ft, ['uid', 'serial']): 'serial_number',
            find_column(df_ft, ['status', 'test result']): 'ft_status',
            find_column(df_ft, ['reason', 'comments']): 'ft_reason'
        }
        df_ft.rename(columns={k: v for k, v in rename_map.items() if k}, inplace=True)
        if 'serial_number' in df_ft.columns:
            df_ft.dropna(subset=['serial_number'], inplace=True)
            df_ft['serial_number'] = df_ft['serial_number'].astype(str).str.strip()
            df_ft = df_ft[[col for col in ['serial_number', 'ft_status', 'ft_reason'] if col in df_ft.columns]]
    else:
        df_ft = pd.DataFrame(columns=['serial_number', 'ft_status', 'ft_reason'])

    log_callback("Performing merge...")
    merged_df = pd.merge(df_main, df_vqc, on=['serial_number', 'vendor'], how='left')
    if 'serial_number' in merged_df.columns and 'serial_number' in df_ft.columns:
        merged_df = pd.merge(merged_df, df_ft, on='serial_number', how='left')
    
    merged_df.fillna('', inplace=True)
    
    initial_count = len(merged_df)
    log_callback(f"Successfully merged {initial_count} records. Checking for duplicates...")
    merged_df.drop_duplicates(subset=['serial_number'], keep='last', inplace=True)
    final_count = len(merged_df)
    duplicates_found = initial_count - final_count
    
    if duplicates_found > 0:
        log_callback(f"Removed {duplicates_found} duplicate serial number(s). Final record count: {final_count}.")
    else:
        log_callback("No duplicate serial numbers found.")

    return merged_df.to_dict('records')

def load_sheets_data_parallel(config, gc, log_callback):
    """Load data from multiple sheets in parallel."""
    step7_data, vqc_data, ft_data = [], {}, []
    
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = []
        if config.get('vendorDataUrl'):
            futures.append(executor.submit(load_sheet_data, 'step7', config, gc, lambda msg: None))
        if config.get('vqcDataUrl'):
            futures.append(executor.submit(load_sheet_data, 'vqc', config, gc, lambda msg: None))
        if config.get('ftDataUrl'):
            futures.append(executor.submit(load_sheet_data, 'ft', config, gc, lambda msg: None))

        for future in as_completed(futures):
            try:
                sheet_type, data = future.result()
                if sheet_type == 'step7':
                    step7_data = data
                elif sheet_type == 'vqc':
                    vqc_data = data
                elif sheet_type == 'ft':
                    ft_data = data
            except Exception as e:
                log_callback(f"A task failed during parallel sheet loading: {e}")
    
    return step7_data, vqc_data, ft_data

def test_sheets_connection(config):
    """Test connection to Google Sheets."""
    try:
        service_account_info = config.get('serviceAccountContent')
        if not service_account_info or not isinstance(service_account_info, dict):
            return {'status': 'error', 'message': 'Invalid or missing service account JSON content.'}

        creds = Credentials.from_service_account_info(
            service_account_info,
            scopes=['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
        )
        gc = gspread.authorize(creds)
        
        sheet_urls = {
            "Vendor Data": config.get('vendorDataUrl'),
            "VQC Data": config.get('vqcDataUrl'),
            "FT Data": config.get('ftDataUrl')
        }

        # Check if any URLs are provided
        if not any(sheet_urls.values()):
            return {'status': 'error', 'message': 'No Google Sheet URLs provided for connection test.'}

        overall_status = 'success'
        results = []
        for name, url in sheet_urls.items():
            if not url:
                results.append(f"✗ {name}: No URL provided.")
                overall_status = 'error'
                continue
            try:
                sheet = gc.open_by_url(url)
                results.append(f"✓ {name}: Connected to '{sheet.title}'")
            except Exception as e:
                results.append(f"✗ {name}: FAILED ({e})")
                overall_status = 'error'
        
        return {'status': overall_status, 'message': "\n".join(results)}
    except Exception as e:
        return {'status': 'error', 'message': str(e)}