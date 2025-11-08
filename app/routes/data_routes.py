from flask import Blueprint, request, jsonify, Response, current_app
import pandas as pd
import gspread
import time
import os
import json
from google.oauth2.service_account import Credentials

from app import database
from app.decorators import token_required
from app.data_handler import load_sheets_data_parallel, merge_ring_data_fast, test_sheets_connection, get_migration_history, add_migration_history

data_bp = Blueprint('data', __name__)

@data_bp.route('/migration_history', methods=['GET'])
@token_required
def migration_history(current_user):
    """Get migration history from the database."""
    try:
        history_data = get_migration_history()
        return jsonify(history_data)
    except Exception as e:
        current_app.logger.error(f"Error fetching migration history: {e}")
        return jsonify(error=str(e)), 500

@data_bp.route('/data', methods=['GET'])
@token_required
def get_data(current_user):
    """Get paginated rings data from the database."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = 200  # Fixed at 200 as requested

        supabase_client = database.supabase
        if supabase_client is None:
            raise Exception("Supabase client is not initialized.")

        # Get total count
        # The `count='exact'` parameter provides the total count
        count_response = supabase_client.from_('rings').select('id', count='exact').execute()
        total_records = count_response.count

        # Calculate range for pagination
        start_index = (page - 1) * per_page
        end_index = start_index + per_page - 1

        # Fetch paginated data
        response = supabase_client.from_('rings').select('*').order('created_at', desc=True).range(start_index, end_index).execute()
        
        return jsonify({
            'data': response.data,
            'total': total_records
        })

    except Exception as e:
        current_app.logger.error(f"Error fetching data: {e}")
        return jsonify(error=str(e)), 500

@data_bp.route('/migrate', methods=['POST'])
@token_required
def migrate(current_user):
    """Migrate data from Google Sheets to database with streaming response."""
    
    def generate():
        log_messages = []
        def log_callback(message):
            log_messages.append(message)
            yield f"data: {message}\n\n"

        # 1. Connect to Google API
        try:
            yield from log_callback("Connecting to Google API...")
            service_account_path = os.environ.get('GOOGLE_SERVICE_ACCOUNT_JSON')
            if not service_account_path or not os.path.exists(service_account_path):
                yield from log_callback(f"ERROR: GOOGLE_SERVICE_ACCOUNT_JSON path is not set or invalid: {service_account_path}")
                return

            with open(service_account_path) as f:
                service_account_info = json.load(f)
            
            scopes = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
            creds = Credentials.from_service_account_info(service_account_info, scopes=scopes)
            gc = gspread.authorize(creds)
            yield from log_callback("Google API connection successful.")

            # Construct config for data loading from environment variables
            config = {
                'vendorDataUrl': os.environ.get('VENDOR_DATA_URL'),
                'vqcDataUrl': os.environ.get('VQC_DATA_URL'),
                'ftDataUrl': os.environ.get('FT_DATA_URL'),
                'ftDataUrlOld': os.environ.get('FT_DATA_URL_OLD')
            }

        except Exception as e:
            yield from log_callback(f"ERROR: Google API connection failed: {e}")
            return

        # 2. Load and Merge Data
        # ... (The rest of the function remains the same as it uses the constructed config)
        merged_data = []
        try:
            yield from log_callback("Starting parallel data loading from Google Sheets...")
            step7_data, vqc_data, ft_data, load_logs = load_sheets_data_parallel(config, gc)
            for log_msg in load_logs:
                yield from log_callback(log_msg)

            yield from log_callback("Parallel data loading complete. Starting merge...")
            merged_data, merge_logs = merge_ring_data_fast(step7_data, vqc_data, ft_data)
            for log_msg in merge_logs:
                yield from log_callback(log_msg)
           
            yield from log_callback(f"Successfully processed {len(merged_data)} final records.")

        except Exception as e:
            yield from log_callback(f"ERROR: Failed to load or merge data: {e}")
            return

        if not merged_data:
            yield from log_callback("No data to migrate.")
            return

        # 3. Migrate Data
        try:
            yield from log_callback(f"Starting to upsert {len(merged_data)} records in batches...")
            
            for record in merged_data:
                for key, value in record.items():
                    if value == '':
                        record[key] = None
                if 'date' in record and record['date'] is not None:
                    try:
                        record['date'] = pd.to_datetime(record['date']).date().isoformat()
                    except (ValueError, TypeError):
                        record['date'] = None
            
            batch_size = 10000
            max_retries = 3
            retry_delay = 5
            total_records = len(merged_data)
            num_of_batches = (total_records + batch_size - 1) // batch_size

            for i in range(0, total_records, batch_size):
                batch = merged_data[i:i + batch_size]
                current_batch_num = i//batch_size + 1
                
                for attempt in range(max_retries):
                    try:
                        yield from log_callback(f"Upserting batch {current_batch_num}/{num_of_batches} (attempt {attempt + 1}/{max_retries})...")
                        supabase_client = database.supabase
                        if supabase_client is None:
                            raise Exception("Supabase client is not initialized.")
                        supabase_client.from_('rings').upsert(batch, on_conflict='serial_number').execute()
                        yield from log_callback(f"Batch {current_batch_num} successful.")
                        break
                    except Exception as e:
                        yield from log_callback(f"ERROR in batch {current_batch_num}: {e}")
                        if attempt < max_retries - 1:
                            yield from log_callback(f"Retrying in {retry_delay} seconds...")
                            time.sleep(retry_delay)
                        else:
                            yield from log_callback(f"Batch {current_batch_num} failed after {max_retries} attempts. Aborting migration.")
                            raise e

            yield from log_callback("All batches upserted successfully.")

            # After successful migration, add to history
            try:
                user_email = current_user.email  # Assuming email is in the token
                
                # In a real scenario, you would get these from the upsert results
                # For now, we'll use placeholders.
                # We need to determine how to get the actual inserted vs. updated counts.
                # This might require a more advanced query or processing the results from the upsert.
                # For this implementation, we'll assume all are inserts.
                updated_qty = 0  # Placeholder
                inserted_qty = total_records # Placeholder, using total records
                batches_sent = num_of_batches
                
                log = "\n".join(log_messages)
                add_migration_history(updated_qty, inserted_qty, user_email, batches_sent, log)
                yield from log_callback("Migration history recorded.")
            except Exception as e:
                yield from log_callback(f"ERROR: Failed to record migration history: {e}")

            yield from log_callback("Migration completed successfully!")

        except Exception as e:
            yield from log_callback(f"ERROR: Database migration failed: {e}")

    return Response(generate(), mimetype='text/event-stream')

@data_bp.route('/inventory_migrate', methods=['POST'])
@token_required
def inventory_migrate(current_user):
    """Migrate inventory status data from Google Sheets to database with streaming response."""
    
    def generate():
        log_messages = []
        def log_callback(message):
            log_messages.append(message)
            yield f"data: {message}\n\n"

        try:
            yield from log_callback("Connecting to Google API for Inventory Migration...")
            service_account_path = os.environ.get('GOOGLE_SERVICE_ACCOUNT_JSON')
            inventory_sheet_url = os.environ.get('INVENTORY_SHEET_URL')

            if not service_account_path or not os.path.exists(service_account_path):
                yield from log_callback(f"ERROR: GOOGLE_SERVICE_ACCOUNT_JSON path is not set or invalid: {service_account_path}")
                return
            if not inventory_sheet_url:
                yield from log_callback("ERROR: INVENTORY_SHEET_URL environment variable is not set.")
                return

            with open(service_account_path) as f:
                service_account_info = json.load(f)
            
            scopes = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
            creds = Credentials.from_service_account_info(service_account_info, scopes=scopes)
            gc = gspread.authorize(creds)
            yield from log_callback("Google API connection successful.")

            # Open the inventory spreadsheet and select the 'Master DATA (consolidated)' worksheet
            spreadsheet = gc.open_by_url(inventory_sheet_url)
            worksheet = spreadsheet.worksheet('Master DATA (consolidated)')
            yield from log_callback("Connected to Inventory Status Google Sheet.")

            # Get all values from the worksheet
            all_data = worksheet.get_all_values()
            if not all_data:
                yield from log_callback("No data found in the inventory sheet.")
                return

            # Extract box names (headers from column C onwards)
            box_names = all_data[0][2:] # Assuming first row contains headers, starting from C (index 2)
            
            # Process data: serial numbers and their corresponding box names
            inventory_data = {}
            for row_index in range(1, len(all_data)): # Start from the second row (index 1)
                row = all_data[row_index]
                for col_index in range(2, len(row)): # Start from column C (index 2)
                    serial_number = row[col_index].strip()
                    if serial_number: # Only process if serial number is not empty
                        box_name = box_names[col_index - 2] # Adjust index for box_names
                        inventory_data[serial_number] = box_name
            
            yield from log_callback(f"Processed {len(inventory_data)} unique serial numbers from inventory sheet.")

            if not inventory_data:
                yield from log_callback("No valid inventory data to migrate.")
                return

            # Fetch existing serial numbers from the database
            supabase_client = database.supabase
            if supabase_client is None:
                raise Exception("Supabase client is not initialized.")
            
            existing_rings_response = supabase_client.from_('rings').select('serial_number').execute()
            existing_serial_numbers = {item['serial_number'] for item in existing_rings_response.data}
            yield from log_callback(f"Found {len(existing_serial_numbers)} existing serial numbers in the database.")

            updates = []
            inserts = []

            for serial_number, box_name in inventory_data.items():
                if serial_number in existing_serial_numbers:
                    updates.append({
                        'serial_number': serial_number,
                        'inventory_status': box_name
                    })
                else:
                    inserts.append({
                        'serial_number': serial_number,
                        'inventory_status': box_name,
                        # Other fields are left blank/null as per requirement
                        'date': None, 'mo_number': None, 'vendor': None, 'ring_size': None,
                        'sku': None, 'pcb': None, 'qc_code': None, 'qc_person': None,
                        'vqc_status': None, 'vqc_reason': None, 'ft_status': None, 'ft_reason': None
                    })
            
            yield from log_callback(f"Prepared {len(updates)} updates and {len(inserts)} inserts.")

            # Perform updates and inserts in batches
            batch_size = 10000
            max_retries = 3
            retry_delay = 5
            num_of_update_batches = 0
            num_of_insert_batches = 0

            # Upsert updates
            if updates:
                total_updates = len(updates)
                num_of_update_batches = (total_updates + batch_size - 1) // batch_size
                yield from log_callback(f"Starting to update {total_updates} records in batches...")
                for i in range(0, total_updates, batch_size):
                    batch = updates[i:i + batch_size]
                    current_batch_num = i//batch_size + 1
                    for attempt in range(max_retries):
                        try:
                            yield from log_callback(f"Updating batch {current_batch_num}/{num_of_update_batches} (attempt {attempt + 1}/{max_retries})...")
                            supabase_client.from_('rings').upsert(batch, on_conflict='serial_number').execute()
                            yield from log_callback(f"Update batch {current_batch_num} successful.")
                            break
                        except Exception as e:
                            yield from log_callback(f"ERROR in update batch {current_batch_num}: {e}")
                            if attempt < max_retries - 1:
                                yield from log_callback(f"Retrying in {retry_delay} seconds...")
                                time.sleep(retry_delay)
                            else:
                                yield from log_callback(f"Update batch {current_batch_num} failed after {max_retries} attempts. Aborting inventory migration.")
                                raise e
                yield from log_callback("All updates completed successfully.")

            # Insert new records
            if inserts:
                total_inserts = len(inserts)
                num_of_insert_batches = (total_inserts + batch_size - 1) // batch_size
                yield from log_callback(f"Starting to insert {total_inserts} new records in batches...")
                for i in range(0, total_inserts, batch_size):
                    batch = inserts[i:i + batch_size]
                    current_batch_num = i//batch_size + 1
                    for attempt in range(max_retries):
                        try:
                            yield from log_callback(f"Inserting batch {current_batch_num}/{num_of_insert_batches} (attempt {attempt + 1}/{max_retries})...")
                            supabase_client.from_('rings').insert(batch).execute()
                            yield from log_callback(f"Insert batch {current_batch_num} successful.")
                            break
                        except Exception as e:
                            yield from log_callback(f"ERROR in insert batch {current_batch_num}: {e}")
                            if attempt < max_retries - 1:
                                yield from log_callback(f"Retrying in {retry_delay} seconds...")
                                time.sleep(retry_delay)
                            else:
                                yield from log_callback(f"Insert batch {current_batch_num} failed after {max_retries} attempts. Aborting inventory migration.")
                                raise e
                yield from log_callback("All inserts completed successfully.")

            # Record migration history
            try:
                user_email = current_user.email
                updated_qty = len(updates)
                inserted_qty = len(inserts)
                batches_sent = num_of_update_batches + num_of_insert_batches
                log = "\n".join(log_messages)
                add_migration_history(updated_qty, inserted_qty, user_email, batches_sent, log, migration_type='inventory')
                yield from log_callback("Inventory migration history recorded.")
            except Exception as e:
                yield from log_callback(f"ERROR: Failed to record inventory migration history: {e}")

            yield from log_callback("Inventory migration completed successfully!")

        except Exception as e:
            yield from log_callback(f"ERROR: Inventory migration failed: {e}")

    return Response(generate(), mimetype='text/event-stream')

@data_bp.route('/test_sheets_connection', methods=['POST'])
@token_required
def test_sheets_connection_endpoint(current_user):
    """Test connection to Google Sheets using environment variables."""
    try:
        service_account_path = os.environ.get('GOOGLE_SERVICE_ACCOUNT_JSON')
        if not service_account_path or not os.path.exists(service_account_path):
            return jsonify({'status': 'error', 'message': f"GOOGLE_SERVICE_ACCOUNT_JSON path is not set or invalid: {service_account_path}"}), 500

        with open(service_account_path) as f:
            service_account_info = json.load(f)

        config = {
            'serviceAccountContent': service_account_info,
            'vendorDataUrl': os.environ.get('VENDOR_DATA_URL'),
            'vqcDataUrl': os.environ.get('VQC_DATA_URL'),
            'ftDataUrl': os.environ.get('FT_DATA_URL')
        }
        result = test_sheets_connection(config)
        
        if result['status'] == 'success':
            return jsonify(result)
        else:
            return jsonify(result), 500
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500