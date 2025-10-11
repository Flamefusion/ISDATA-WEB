from flask import Blueprint, request, jsonify, Response, current_app, session
import pandas as pd
import gspread
import time
from google.oauth2.service_account import Credentials
from supabase import create_client

from app.database import get_db_connection
from app.data_handler import load_sheets_data_parallel, merge_ring_data_fast, test_sheets_connection

data_bp = Blueprint('data', __name__)

@data_bp.route('/data', methods=['GET'])
def get_data():
    """Get all rings data from the database."""
    try:
        db = get_db_connection()
        response = db.from_('rings').select('*').execute()
        return jsonify(response.data)
    except Exception as e:
        current_app.logger.error(f"Error fetching data: {e}")
        return jsonify(error=str(e)), 500

@data_bp.route('/migrate', methods=['POST'])
def migrate():
    """Migrate data from Google Sheets to database with streaming response."""
    config = request.json
    supabase_config = session.get('supabase_config', {})

    def generate(supa_config):
        def log_callback(message):
            yield f"data: {message}\n\n"

        # 1. Connect to Google API
        try:
            yield from log_callback("Connecting to Google API...")
            scopes = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
            creds = Credentials.from_service_account_info(config.get('serviceAccountContent'), scopes=scopes)
            gc = gspread.authorize(creds)
            yield from log_callback("Google API connection successful.")
        except Exception as e:
            yield from log_callback(f"ERROR: Google API connection failed: {e}")
            return

        # 2. Load and Merge Data
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
            url = supa_config.get("supabaseUrl")
            key = supa_config.get("supabaseServiceKey")

            if not all([url, key]):
                yield from log_callback("ERROR: Supabase URL or Service Key not configured for migration.")
                return

            db = create_client(url, key)

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
            
            batch_size = 5000
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
                        db.from_('rings').upsert(batch, on_conflict='serial_number').execute()
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

    return Response(generate(supabase_config), mimetype='text/event-stream')

@data_bp.route('/test_sheets_connection', methods=['POST'])
def test_sheets_connection_endpoint():
    """Test connection to Google Sheets."""
    config = request.json
    result = test_sheets_connection(config)
    
    if result['status'] == 'success':
        return jsonify(result)
    else:
        return jsonify(result), 400 if 'No Google Sheet URLs' in result['message'] else 500