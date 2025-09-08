import pandas as pd
import gspread
from google.oauth2.service_account import Credentials
import json
from datetime import datetime
import time

def _get_col_index(headers, patterns):
    """Find the index of a column by matching patterns."""
    for pattern in patterns:
        try:
            # Case-insensitive search
            return [h.lower() for h in headers].index(pattern.lower())
        except ValueError:
            continue
    return -1

def stream_and_merge_data(config, gc):
    """
    Streams data from Google Sheets and merges it in a memory-efficient way.
    Yields merged records one by one.
    """
    yield "data: Initializing memory-efficient migration...\n\n"

    # 1. Load VQC and FT data into memory for quick lookups
    vqc_lookup = {}
    ft_lookup = {}
    chunk_size = 5000

    try:
        yield "data: Loading VQC data in chunks...\n\n"
        vqc_sheet = gc.open_by_url(config['vqcDataUrl'])
        for vendor in ['IHC', '3DE TECH', 'MAKENICA']:
            try:
                ws = vqc_sheet.worksheet(vendor)
                row_count = ws.row_count
                headers = ws.row_values(1)
                for i in range(2, row_count + 1, chunk_size):
                    time.sleep(1) # Add a delay to avoid hitting rate limits
                    chunk = ws.get(f'A{i}:{i + chunk_size - 1}')
                    records = [dict(zip(headers, row)) for row in chunk]
                    for rec in records:
                        serial_keys = [key for key in rec.keys() if 'serial' in key.lower() or 'uid' in key.lower()]
                        if serial_keys:
                            serial = str(rec[serial_keys[0]]).strip()
                            if serial:
                                status_keys = [key for key in rec.keys() if 'status' in key.lower() or 'result' in key.lower()]
                                reason_keys = [key for key in rec.keys() if 'reason' in key.lower() or 'comment' in key.lower()]
                                vqc_lookup[serial] = {
                                    'vqc_status': rec[status_keys[0]] if status_keys else None,
                                    'vqc_reason': rec[reason_keys[0]] if reason_keys else None
                                }
                    yield f"data: Loaded {len(records)} VQC records for {vendor} in this chunk.\n\n"
            except gspread.WorksheetNotFound:
                yield f"data: WARNING: VQC worksheet for '{vendor}' not found.\n\n"

        yield "data: Loading FT data in chunks...\n\n"
        ft_sheet = gc.open_by_url(config['ftDataUrl'])
        ft_ws = ft_sheet.worksheet('Working')
        row_count = ft_ws.row_count
        headers = ft_ws.row_values(1)
        for i in range(2, row_count + 1, chunk_size):
            time.sleep(1) # Add a delay to avoid hitting rate limits
            chunk = ft_ws.get(f'A{i}:{i + chunk_size - 1}')
            ft_records = [dict(zip(headers, row)) for row in chunk]
            for rec in ft_records:
                serial_keys = [key for key in rec.keys() if 'serial' in key.lower() or 'uid' in key.lower()]
                if serial_keys:
                    serial = str(rec[serial_keys[0]]).strip()
                    if serial:
                        status_keys = [key for key in rec.keys() if 'status' in key.lower() or 'result' in key.lower()]
                        reason_keys = [key for key in rec.keys() if 'reason' in key.lower() or 'comment' in key.lower()]
                        ft_lookup[serial] = {
                            'ft_status': rec[status_keys[0]] if status_keys else None,
                            'ft_reason': rec[reason_keys[0]] if reason_keys else None
                        }
            yield f"data: Loaded {len(ft_records)} FT records in this chunk.\n\n"

    except Exception as e:
        yield f"data: ERROR: Failed to load lookup data: {e}\n\n"
        return

    # 2. Stream and process the main vendor data sheet
    try:
        yield "data: Opening main vendor data sheet for streaming...\n\n"
        vendor_sheet = gc.open_by_url(config['vendorDataUrl'])
        vendor_ws = vendor_sheet.worksheet('Working')
        
        row_count = vendor_ws.row_count
        headers = vendor_ws.row_values(1)
        
        vendor_mappings = {
            '3DE TECH': {'serial': 'UID', 'mo': '3DE MO', 'sku': 'SKU', 'size': 'SIZE'},
            'IHC': {'serial': 'IHC', 'mo': 'IHC MO', 'sku': 'IHC SKU', 'size': 'IHC SIZE'},
            'MAKENICA': {'serial': 'MAKENICA', 'mo': 'MK MO', 'sku': 'MAKENICA SKU', 'size': 'MAKENICA SIZE'}
        }
        
        date_idx = _get_col_index(headers, ['logged_timestamp', 'Timestamp', 'Date'])
        
        vendor_indices = {}
        for vendor, patterns in vendor_mappings.items():
            vendor_indices[vendor] = {
                'serial': _get_col_index(headers, [patterns['serial']]),
                'mo': _get_col_index(headers, [patterns['mo']]),
                'sku': _get_col_index(headers, [patterns['sku']]),
                'size': _get_col_index(headers, [patterns['size']])
            }

        processed_count = 0
        for i in range(2, row_count + 1, chunk_size):
            time.sleep(1) # Add a delay to avoid hitting rate limits
            chunk = vendor_ws.get(f'A{i}:{i + chunk_size - 1}')
            for row in chunk:
                serial_number, vendor_name = None, None
                for vendor, indices in vendor_indices.items():
                    s_idx = indices['serial']
                    if s_idx != -1 and len(row) > s_idx and row[s_idx].strip():
                        serial_number = row[s_idx].strip()
                        vendor_name = vendor
                        break
                
                if not serial_number:
                    continue

                indices = vendor_indices[vendor_name]
                mo_number = row[indices['mo']] if indices['mo'] != -1 and len(row) > indices['mo'] else None
                sku = row[indices['sku']] if indices['sku'] != -1 and len(row) > indices['sku'] else None
                ring_size = row[indices['size']] if indices['size'] != -1 and len(row) > indices['size'] else None
                
                date_val = row[date_idx] if date_idx != -1 and len(row) > date_idx else None
                date_obj = None
                if date_val:
                    try:
                        dt_obj = datetime.strptime(str(date_val), '%m/%d/%Y %H:%M:%S')
                        date_obj = dt_obj.date()
                    except (ValueError, TypeError):
                        pass

                vqc_info = vqc_lookup.get(serial_number, {})
                ft_info = ft_lookup.get(serial_number, {})

                yield {
                    'date': date_obj,
                    'mo_number': mo_number,
                    'vendor': vendor_name,
                    'serial_number': serial_number,
                    'ring_size': ring_size,
                    'sku': sku,
                    'vqc_status': vqc_info.get('vqc_status'),
                    'vqc_reason': vqc_info.get('vqc_reason'),
                    'ft_status': ft_info.get('ft_status'),
                    'ft_reason': ft_info.get('ft_reason'),
                }
                processed_count += 1
                if processed_count % 100 == 0:
                    yield f"data: Processed {processed_count} records...\n\n"

        yield f"data: Finished streaming. Total records processed: {processed_count}.\n\n"

    except Exception as e:
        yield f"data: ERROR: Failed during streaming and merging: {e}\n\n"
        return

def test_sheets_connection(config):
    """Test connection to Google Sheets."""
    try:
        service_account_content = config.get('serviceAccountContent')

        # If the content is a string, try to parse it as JSON
        if isinstance(service_account_content, str):
            try:
                service_account_info = json.loads(service_account_content)
            except json.JSONDecodeError:
                return {'status': 'error', 'message': 'Service account content is not valid JSON.'}
        elif isinstance(service_account_content, dict):
            service_account_info = service_account_content
        else:
            return {'status': 'error', 'message': 'Invalid or missing service account content.'}

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

        if not any(sheet_urls.values()):
            return {'status': 'error', 'message': 'No Google Sheet URLs provided for connection test.'}

        overall_status = 'success'
        results = []
        for name, url in sheet_urls.items():
            if not url:
                results.append(f"✗ {name}: No URL provided.")
                continue  # Don't mark as error if a URL is just missing
            try:
                sheet = gc.open_by_url(url)
                results.append(f"✓ {name}: Connected to '{sheet.title}'")
            except Exception as e:
                results.append(f"✗ {name}: FAILED ({e})")
                overall_status = 'error'
        
        final_message = "\n".join(results)
        if overall_status == 'error':
             return {'status': 'error', 'message': final_message}
        
        return {'status': 'success', 'message': final_message}

    except Exception as e:
        # Catch-all for other unexpected errors, like auth issues
        error_message = f"An unexpected error occurred: {e}"
        # Check if it's a gspread auth error
        if "invalid_grant" in str(e).lower():
            error_message = "Google authentication failed. Check your service account credentials."
        return {'status': 'error', 'message': error_message}