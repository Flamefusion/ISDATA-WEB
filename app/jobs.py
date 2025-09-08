import os
import json
import time
import gspread
from google.oauth2.service_account import Credentials
from app.data_handler import stream_and_merge_data
from app.database import get_db_connection, return_db_connection
import psycopg2
import io
import pandas as pd

JOB_DIR = 'jobs'

def create_job(job_type, data):
    if not os.path.exists(JOB_DIR):
        os.makedirs(JOB_DIR)
    job_id = f"{job_type}_{int(time.time())}_{os.urandom(4).hex()}"
    job_path = os.path.join(JOB_DIR, f"{job_id}.json")
    with open(job_path, 'w') as f:
        json.dump({'status': 'pending', 'data': data}, f)
    return job_id

def process_jobs():
    if not os.path.exists(JOB_DIR):
        return

    for filename in os.listdir(JOB_DIR):
        if filename.endswith('.json'):
            job_path = os.path.join(JOB_DIR, filename)
            with open(job_path, 'r+') as f:
                job = json.load(f)
                if job['status'] == 'pending':
                    job['status'] = 'running'
                    f.seek(0)
                    json.dump(job, f)
                    f.truncate()

                    try:
                        if filename.startswith('migrate'):
                            run_migration_job(job['data'])
                        job['status'] = 'completed'
                    except Exception as e:
                        job['status'] = 'failed'
                        job['error'] = str(e)
                    
                    f.seek(0)
                    json.dump(job, f)
                    f.truncate()

def run_migration_job(config):
    # This function will contain the logic from the old migrate route
    # but adapted to run in the background.

    # 1. Connect to Google API
    scopes = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
    creds = Credentials.from_service_account_info(config.get('serviceAccountContent'), scopes=scopes)
    gc = gspread.authorize(creds)

    # 2. Stream and process data in chunks
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
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
                    # In a background job, we might log this to a file instead of yielding
                    print(item)
                    continue
                
                chunk.append(item)
                
                if len(chunk) >= chunk_size:
                    process_chunk(cursor, chunk)
                    chunk = []

            if chunk:
                process_chunk(cursor, chunk)

        conn.commit()

    except (psycopg2.Error, Exception) as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            return_db_connection(conn)

def process_chunk(cursor, chunk):
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
    
    cursor.copy_expert(f"COPY rings_temp({','.join(cols)}) FROM STDIN WITH (FORMAT text, NULL '{null_identifier}')", string_buffer)

    update_sql = """
    UPDATE rings r SET
        date = t.date, mo_number = t.mo_number, vendor = t.vendor, ring_size = t.ring_size,
        sku = t.sku, vqc_status = t.vqc_status, vqc_reason = t.vqc_reason,
        ft_status = t.ft_status, ft_reason = t.ft_reason, updated_at = CURRENT_TIMESTAMP
    FROM rings_temp t
    WHERE r.serial_number = t.serial_number;
    """
    cursor.execute(update_sql)

    insert_sql = """
    INSERT INTO rings (date, mo_number, vendor, serial_number, ring_size, sku, vqc_status, vqc_reason, ft_status, ft_reason)
    SELECT t.date, t.mo_number, t.vendor, t.serial_number, t.ring_size, t.sku, t.vqc_status, t.vqc_reason, t.ft_status, t.ft_reason
    FROM rings_temp t
    LEFT JOIN rings r ON t.serial_number = r.serial_number
    WHERE r.serial_number IS NULL;
    """
    cursor.execute(insert_sql)
    
    cursor.execute("TRUNCATE TABLE rings_temp;")
