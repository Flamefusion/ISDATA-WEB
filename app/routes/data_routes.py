from flask import Blueprint, request, jsonify, Response, current_app
import io

import pandas as pd
import gspread
from google.oauth2.service_account import Credentials
from app.database import get_db_connection
from app.data_handler import load_sheets_data_parallel, merge_ring_data_fast, test_sheets_connection

data_bp = Blueprint('data', __name__)

@data_bp.route('/data', methods=['GET'])
def get_data():
    """Get all rings data from the database."""
    try:
        supabase = get_db_connection()
        response = supabase.table('rings').select("*").execute()
        return jsonify(response.data)
    except Exception as e:
        current_app.logger.error(f"Error fetching data: {e}")
        return jsonify(error=str(e)), 500

@data_bp.route('/migrate', methods=['POST'])
def migrate():
    """Migrate data from Google Sheets to database with streaming response."""
    config = request.json
    
    def generate():
        def log_callback(message):
            # This helper is still useful for streaming from the main thread
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

            # Stream the logs that were generated in the background threads
            for log_msg in load_logs:
                yield from log_callback(log_msg)

            yield from log_callback("Parallel data loading complete. Starting merge...")
            # Capture the merge logs
            merged_data, merge_logs = merge_ring_data_fast(step7_data, vqc_data, ft_data)

             # Stream the logs from the merge process
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
            supabase = get_db_connection()
            yield from log_callback(f"Upserting {len(merged_data)} records to DB...")
            
            # Convert merged_data to a list of dictionaries
            data_to_upsert = [record for record in merged_data]
            
            response = supabase.table('rings').upsert(data_to_upsert, on_conflict='serial_number').execute()
            
            yield from log_callback("Migration completed successfully!")

        except Exception as e:
            yield from log_callback(f"ERROR: High-speed migration failed: {e}")

    return Response(generate(), mimetype='text/event-stream')

@data_bp.route('/test_sheets_connection', methods=['POST'])
def test_sheets_connection_endpoint():
    """Test connection to Google Sheets."""
    config = request.json
    result = test_sheets_connection(config)
    
    if result['status'] == 'success':
        return jsonify(result)
    else:
        return jsonify(result), 400 if 'No Google Sheet URLs' in result['message'] else 500