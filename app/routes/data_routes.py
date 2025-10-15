from flask import Blueprint, request, jsonify, Response, current_app
import pandas as pd
import gspread
import time
import os
import json
from google.oauth2.service_account import Credentials

from app import database
from app.decorators import token_required
from app.data_handler import load_sheets_data_parallel, merge_ring_data_fast, test_sheets_connection

data_bp = Blueprint('data', __name__)

@data_bp.route('/data', methods=['GET'])
@token_required
def get_data(current_user):
    """Get all rings data from the database."""
    try:
        supabase_client = database.supabase
        if supabase_client is None:
            raise Exception("Supabase client is not initialized.")
        response = supabase_client.from_('rings').select('*').execute()
        return jsonify(response.data)
    except Exception as e:
        current_app.logger.error(f"Error fetching data: {e}")
        return jsonify(error=str(e)), 500

@data_bp.route('/migrate', methods=['POST'])
@token_required
def migrate(current_user):
    """Migrate data from Google Sheets to database with streaming response."""
    
    def generate():
        def log_callback(message):
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
                'ftDataUrl': os.environ.get('FT_DATA_URL')
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
            yield from log_callback("Migration completed successfully!")

        except Exception as e:
            yield from log_callback(f"ERROR: Database migration failed: {e}")

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