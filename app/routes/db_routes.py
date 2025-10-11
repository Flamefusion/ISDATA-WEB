from flask import Blueprint, request, jsonify, session, current_app
import traceback

from app.database import check_supabase_connection, get_db_connection, get_admin_db_connection

db_bp = Blueprint('db', __name__)

@db_bp.route('/', methods=['GET'])
def index():
    """Returns a simple message to indicate the blueprint is active."""
    return jsonify(message="Database blueprint is active")

@db_bp.route('/db/connect_supabase', methods=['POST'])
def connect_supabase():
    """Connects to Supabase using parameters from the request body."""
    config = request.json
    supabase_url = config.get('supabaseUrl')
    supabase_anon_key = config.get('supabaseAnonKey')
    supabase_service_key = config.get('supabaseServiceKey')

    if not all([supabase_url, supabase_anon_key]):
        return jsonify(status='error', message='Supabase URL and Anon Key must be provided.'), 400

    supabase_config = {
        "supabaseUrl": supabase_url,
        "supabaseAnonKey": supabase_anon_key,
        "supabaseServiceKey": supabase_service_key
    }
    success, message = check_supabase_connection(supabase_url, supabase_anon_key)
    if success:
        session['supabase_config'] = supabase_config
        return jsonify(status='success', message=message)
    else:
        return jsonify(status='error', message=message), 500

@db_bp.route('/db/schema', methods=['POST'])
def create_schema_endpoint():
    """Endpoint to create the database schema."""
    log = []
    try:
        db = get_admin_db_connection()
        log.append("Dropping existing schema objects if they exist...")
        db.rpc('exec', {'sql': 'DROP TABLE IF EXISTS rings;'}).execute()

        log.append("Creating the 'rings' table...")
        create_table_sql = """
                    CREATE TABLE rings ( 
                        id SERIAL PRIMARY KEY, date DATE, mo_number VARCHAR(50), vendor VARCHAR(50),
                        serial_number VARCHAR(100) UNIQUE, ring_size VARCHAR(100), sku VARCHAR(50),
                        pcb VARCHAR(50), qc_code VARCHAR(50), qc_person VARCHAR(100),
                        vqc_status VARCHAR(100), vqc_reason TEXT, ft_status VARCHAR(100), ft_reason TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
        """
        db.rpc('exec', {'sql': create_table_sql}).execute()
        log.append("Creating indexes...")
        index_statements = [
            "CREATE INDEX idx_serial_number ON rings(serial_number);",
            "CREATE INDEX idx_vendor ON rings(vendor);",
            "CREATE INDEX idx_date_desc ON rings(date DESC);",
            "CREATE INDEX idx_pcb ON rings(pcb);",
            "CREATE INDEX idx_qc_code ON rings(qc_code);",
            "CREATE INDEX idx_qc_person ON rings(qc_person);",
            "CREATE INDEX idx_rings_composite ON rings(vendor, vqc_status, ft_status);"
        ]
        for statement in index_statements:
            log.append(f"Executing: {statement}")
            db.rpc('exec', {'sql': statement}).execute()

        log.append("Database schema and indexes created successfully.")
        return jsonify(status="success", logs=log)
    except Exception as e:
        current_app.logger.error(f"Database error during schema creation: {e}")
        current_app.logger.error(traceback.format_exc())
        return jsonify(status="error", message=f"Database error during schema creation: {e}"), 500

@db_bp.route('/db/clear', methods=['DELETE'])
def clear_database_endpoint():
    """Endpoint to clear the 'rings' table."""
    try:
        db = get_admin_db_connection()
        db.rpc('exec', {'sql': 'TRUNCATE TABLE rings RESTART IDENTITY'}).execute()
        return jsonify(status="success", message="Database 'rings' table has been cleared.")
    except Exception as e:
        current_app.logger.error(f"Database clearing failed: {e}")
        current_app.logger.error(traceback.format_exc())
        return jsonify(status="error", message=f"Database clearing failed: {e}"), 500
