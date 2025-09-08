from flask import Blueprint, request, jsonify, Response, current_app
import io
import psycopg2
import pandas as pd
import gspread
from google.oauth2.service_account import Credentials
from app.database import get_db_connection, return_db_connection
from app.data_handler import stream_and_merge_data, test_sheets_connection
from app.jobs import create_job
import os
import json

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
    """Triggers a background job to migrate data from Google Sheets to the database."""
    config = request.json
    job_id = create_job('migrate', config)
    return jsonify({'job_id': job_id, 'status': 'pending'}), 202

@data_bp.route('/jobs/<job_id>', methods=['GET'])
def get_job_status(job_id):
    """Gets the status of a background job."""
    job_path = os.path.join('jobs', f"{job_id}.json")
    if not os.path.exists(job_path):
        return jsonify({'error': 'Job not found'}), 404
    
    with open(job_path, 'r') as f:
        job = json.load(f)
        return jsonify(job)

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
