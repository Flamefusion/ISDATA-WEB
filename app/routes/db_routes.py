from flask import Blueprint, request, jsonify, session

from app.database import check_single_db_connection, get_db_connection

db_bp = Blueprint('db', __name__)

@db_bp.route('/', methods=['GET'])
def index():
    """Returns a simple message to indicate the blueprint is active."""
    return jsonify(message="Database blueprint is active")

@db_bp.route('/db/test', methods=['POST'])
def test_db_connection():
    """Tests the database connection using parameters from the request body."""
    config = request.json
    supabase_url = config.get('supabaseUrl')
    supabase_key = config.get('supabaseKey')

    if not all([supabase_url, supabase_key]):
        return jsonify(status='error', message='Supabase URL and Key must be provided.'), 400

    success, message = check_single_db_connection(supabase_url, supabase_key)
    if success:
        session['supabase_config'] = {'url': supabase_url, 'key': supabase_key}
        return jsonify(status='success', message=message)
    else:
        return jsonify(status='error', message=message), 500

@db_bp.route('/db/schema', methods=['POST'])
def create_schema_endpoint():
    """Endpoint to create the database schema."""
    return jsonify(status="success", message="Please use the Supabase dashboard to create the database schema.")

@db_bp.route('/db/clear', methods=['DELETE'])
def clear_database_endpoint():
    """Endpoint to clear the 'rings' table."""
    return jsonify(status="success", message="Please use the Supabase dashboard to clear the 'rings' table.")
