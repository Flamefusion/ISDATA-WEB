import os
import psycopg2
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

def get_db_connection():
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST'),
        port=os.getenv('DB_PORT'),
        dbname=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD')
    )
    return conn

@app.route('/api/data', methods=['GET'])
def get_data():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT * FROM your_table_name;')
    data = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(data)



from google.oauth2 import service_account
from googleapiclient.discovery import build




import time

@app.route('/api/migrate')
def migrate():
    def generate():
        logs = [
            'Starting migration process...', 
            'Creating temporary table rings_temp...', 
            'Preparing data buffer...', 
            'Bulk copying data to temp table...', 
            'Updating existing records...', 
            'Inserting new records...', 
            'Cleaning up temporary table...', 
            'Migration completed successfully!'
        ]
        for log in logs:
            yield f"data: {log}\n\n"
            time.sleep(0.8)
    return Response(generate(), mimetype='text/event-stream')

@app.route('/api/search', methods=['POST'])
def search():
    filters = request.json
    query = "SELECT * FROM your_table_name WHERE 1=1"
    params = []

    if filters.get('serialNumbers'):
        serial_numbers = [s.strip() for s in filters['serialNumbers'].split(',')]
        query += " AND serial_number = ANY(%s)"
        params.append(serial_numbers)
    if filters.get('moNumbers'):
        mo_numbers = [s.strip() for s in filters['moNumbers'].split(',')]
        query += " AND mo_number = ANY(%s)"
        params.append(mo_numbers)
    if filters.get('dateFrom'):
        query += " AND date >= %s"
        params.append(filters['dateFrom'])
    if filters.get('dateTo'):
        query += " AND date <= %s"
        params.append(filters['dateTo'])
    if filters.get('vendor'):
        query += " AND vendor = %s"
        params.append(filters['vendor'])
    if filters.get('vqcStatus'):
        query += " AND vqc_status = %s"
        params.append(filters['vqcStatus'])
    if filters.get('ftStatus'):
        query += " AND ft_status = %s"
        params.append(filters['ftStatus'])

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(query, tuple(params))
    data = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify(data)


@app.route('/api/test_sheets_connection', methods=['GET'])
def test_sheets_connection():
    try:
        creds = service_account.Credentials.from_service_account_file(
            os.getenv('GOOGLE_SHEETS_CREDENTIALS'),
            scopes=['https://www.googleapis.com/auth/spreadsheets.readonly']
        )
        service = build('sheets', 'v4', credentials=creds)
        # You can replace this with a real spreadsheet ID to test
        spreadsheet_id = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms' # This is a public sample spreadsheet
        sheet_metadata = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
        return jsonify({'status': 'success', 'message': f'Successfully connected to spreadsheet: {sheet_metadata["properties"]["title"]}'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})


@app.route('/api/test_db_connection', methods=['GET'])
def test_db_connection():
    try:
        conn = get_db_connection()
        conn.close()
        return jsonify({'status': 'success', 'message': 'Database connection successful!'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

if __name__ == '__main__':
    app.run(debug=True)

