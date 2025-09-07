from flask import Blueprint, request, jsonify, Response, current_app
import io
import psycopg2
import pandas as pd
import gspread
from google.oauth2.service_account import Credentials
from app.database import get_db_connection, return_db_connection
from app.data_handler import stream_and_merge_data, test_sheets_connection

data_bp = Blueprint('data', __name__)

@data_bp.route('/data', methods=['GET'])
def get_data():
    """Get all rings data from the database."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT * FROM rings;')
        
        # Fetch column names from cursor description
        colnames = [desc[0] for desc in cur.description]
        
        # Fetch all rows and convert to list of dictionaries
        data = [dict(zip(colnames, row)) for row in cur.fetchall()]
        
        cur.close()
        return jsonify(data)
    except Exception as e:
        current_app.logger.error(f"Error fetching data: {e}")
        return jsonify(error=str(e)), 500
    finally:
        if conn:
            return_db_connection(conn)

@data_bp.route('/migrate', methods=['POST'])
def migrate():
    """Migrate data from Google Sheets to database with streaming response."""
    config = request.json
    
    def generate():
        # This helper is still useful for streaming from the main thread
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

        # 2. Stream and process data in chunks
        conn = None
        total_processed = 0
        try:
            conn = get_db_connection()
            with conn.cursor() as cursor:
                yield from log_callback("Creating temporary table for bulk data loading...")
                cursor.execute("""
                    CREATE TEMP TABLE rings_temp (
                        date DATE, mo_number VARCHAR(50), vendor VARCHAR(50), serial_number VARCHAR(100) UNIQUE,
                        ring_size VARCHAR(100), sku VARCHAR(50), vqc_status VARCHAR(100),
                        vqc_reason TEXT, ft_status VARCHAR(100), ft_reason TEXT
                    );
                """)

                data_stream = stream_and_merge_data(config, gc)
                
                chunk = []
                chunk_size = 500
                
                for item in data_stream:
                    if isinstance(item, str) and item.startswith("data:"):
                        yield item
                        continue
                    
                    chunk.append(item)
                    
                    if len(chunk) >= chunk_size:
                        yield from process_chunk(cursor, chunk)
                        total_processed += len(chunk)
                        chunk = []

                if chunk:
                    yield from process_chunk(cursor, chunk)
                    total_processed += len(chunk)

            if total_processed == 0:
                yield from log_callback("No data was migrated.")
            else:
                conn.commit()
                yield from log_callback(f"Migration completed successfully! Total records processed: {total_processed}")

        except (psycopg2.Error, Exception) as e:
            if conn:
                conn.rollback()
            yield from log_callback(f"ERROR: High-speed migration failed: {e}")
        finally:
            if conn:
                return_db_connection(conn)

    def process_chunk(cursor, chunk):
        yield from log_callback(f"Processing chunk of {len(chunk)} records...")
        
        string_buffer = io.StringIO()
        cols = ['date', 'mo_number', 'vendor', 'serial_number', 'ring_size', 'sku', 'vqc_status', 'vqc_reason', 'ft_status', 'ft_reason']
        null_identifier = '\\N'

        for record in chunk:
            row_data = []
            for col in cols:
                value = record.get(col)
                is_missing = pd.isna(value) or str(value).strip() == ''

                if col == 'date':
                    if is_missing:
                        clean_value = null_identifier
                    else:
                        try:
                            # The date is already a date object from the streamer
                            clean_value = value.isoformat()
                        except (ValueError, TypeError, AttributeError):
                            clean_value = null_identifier
                else:
                    if is_missing:
                        clean_value = ''
                    else:
                        clean_value = str(value).replace('\t', ' ').replace('\n', ' ').replace('\r', ' ')
                
                row_data.append(clean_value)
            
            string_buffer.write('\t'.join(row_data) + '\n')
        
        string_buffer.seek(0)
        
        yield from log_callback(f"Copying {len(chunk)} records to temp table...")
        cursor.copy_expert(f"COPY rings_temp({','.join(cols)}) FROM STDIN WITH (FORMAT text, NULL '{null_identifier}')", string_buffer)

        yield from log_callback("Updating existing records from temp table...")
        update_sql = """
        UPDATE rings r SET
            date = t.date, mo_number = t.mo_number, vendor = t.vendor, ring_size = t.ring_size,
            sku = t.sku, vqc_status = t.vqc_status, vqc_reason = t.vqc_reason,
            ft_status = t.ft_status, ft_reason = t.ft_reason, updated_at = CURRENT_TIMESTAMP
        FROM rings_temp t
        WHERE r.serial_number = t.serial_number;
        """
        cursor.execute(update_sql)
        yield from log_callback(f"{cursor.rowcount} existing records updated in this chunk.")

        yield from log_callback("Inserting new records from temp table...")
        insert_sql = """
        INSERT INTO rings (date, mo_number, vendor, serial_number, ring_size, sku, vqc_status, vqc_reason, ft_status, ft_reason)
        SELECT t.date, t.mo_number, t.vendor, t.serial_number, t.ring_size, t.sku, t.vqc_status, t.vqc_reason, t.ft_status, t.ft_reason
        FROM rings_temp t
        LEFT JOIN rings r ON t.serial_number = r.serial_number
        WHERE r.serial_number IS NULL;
        """
        cursor.execute(insert_sql)
        yield from log_callback(f"{cursor.rowcount} new records inserted in this chunk.")
        
        # Clear the temp table for the next chunk
        cursor.execute("TRUNCATE TABLE rings_temp;")


    return Response(generate(), mimetype='text/event-stream')

@data_bp.route('/test_sheets_connection', methods=['POST'])
def test_sheets_connection_endpoint():
    """Test connection to Google Sheets."""
    config = request.get_json(silent=True)
    if not config:
        current_app.logger.warning("Request body is empty or not valid JSON.")
        return jsonify(status='error', message='Request body must contain valid JSON.'), 400

    result = test_sheets_connection(config)
    
    if result.get('status') == 'success':
        return jsonify(result)
    else:
        message = result.get('message', '')
        if 'No Google Sheet URLs' in message or 'not valid JSON' in message or 'missing service account' in message:
            status_code = 400
        else:
            status_code = 500
        return jsonify(result), status_code