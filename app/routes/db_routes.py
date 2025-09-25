from flask import Blueprint, request, jsonify
import psycopg2
from app.database import check_single_db_connection, get_db_connection, return_db_connection, init_db_pool

db_bp = Blueprint('db', __name__)

@db_bp.route('/db/connect', methods=['POST'])
def connect_db():
    """Initializes the database connection pool using parameters from the request body."""
    config = request.json
    db_host = config.get('dbHost')
    db_port = config.get('dbPort')
    db_name = config.get('dbName')
    db_user = config.get('dbUser')
    db_password = config.get('dbPassword')

    if not all([db_host, db_port, db_name, db_user, db_password]):
        return jsonify(status='error', message='All database configuration fields must be provided.'), 400

    if init_db_pool(db_host, db_port, db_name, db_user, db_password):
        return jsonify(status='success', message='Database connection pool initialized successfully.')
    else:
        return jsonify(status='error', message='Failed to initialize database connection pool.'), 500

@db_bp.route('/db/test', methods=['POST'])
def test_db_connection():
    """Tests the database connection using parameters from the request body."""
    config = request.json
    db_host = config.get('dbHost')
    db_port = config.get('dbPort')
    db_name = config.get('dbName')
    db_user = config.get('dbUser')
    db_password = config.get('dbPassword')

    if not all([db_host, db_port, db_name, db_user, db_password]):
        return jsonify(status='error', message='All database configuration fields must be provided.'), 400

    success, message = check_single_db_connection(db_host, db_port, db_name, db_user, db_password)
    if success:
        return jsonify(status='success', message=message)
    else:
        return jsonify(status='error', message=message), 500

@db_bp.route('/db/schema', methods=['POST'])
def create_schema_endpoint():
    """Endpoint to create the database schema."""
    conn = None
    log = []
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            log.append("Dropping existing schema objects if they exist...")
            cursor.execute("DROP TABLE IF EXISTS rings;")
            cursor.execute("DROP FUNCTION IF EXISTS update_rings_tsvector_trigger CASCADE;")

            log.append("Creating the 'rings' table and base indexes...")
            create_table_sql = """
            CREATE TABLE rings (
                id SERIAL PRIMARY KEY, date DATE, mo_number VARCHAR(50), vendor VARCHAR(50),
                serial_number VARCHAR(100) UNIQUE, ring_size VARCHAR(100), sku VARCHAR(50),
                vqc_status VARCHAR(100), vqc_reason TEXT, ft_status VARCHAR(100), ft_reason TEXT,
                reason_tsvector TSVECTOR, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX idx_serial_number ON rings(serial_number);
            CREATE INDEX idx_vendor ON rings(vendor);
            CREATE INDEX idx_date_desc ON rings(date DESC);
            """
            cursor.execute(create_table_sql)

            log.append("Adding optimized composite and full-text search indexes...")
            optimized_indexes_sql = """
            CREATE INDEX idx_rings_composite ON rings(vendor, vqc_status, ft_status);
            CREATE INDEX idx_rings_text_search ON rings USING GIN(reason_tsvector);
            """
            cursor.execute(optimized_indexes_sql)

            log.append("Creating trigger function for automatic full-text search indexing...")
            tsvector_trigger_sql = """
            CREATE OR REPLACE FUNCTION update_rings_tsvector_trigger() RETURNS trigger AS $$
            BEGIN
                NEW.reason_tsvector :=
                    to_tsvector('english', COALESCE(NEW.vqc_reason, '') || ' ' || COALESCE(NEW.ft_reason, ''));
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
            ON rings FOR EACH ROW EXECUTE PROCEDURE update_rings_tsvector_trigger();
            """
            cursor.execute(tsvector_trigger_sql)

        conn.commit()
        log.append("Database schema, optimized indexes, and triggers created successfully.")
        return jsonify(status="success", logs=log)
    except psycopg2.Error as db_err:
        if conn:
            conn.rollback()
        return jsonify(status="error", message=f"Database error during schema creation: {db_err}"), 500
    finally:
        if conn:
            return_db_connection(conn)

@db_bp.route('/db/clear', methods=['DELETE'])
def clear_database_endpoint():
    """Endpoint to clear the 'rings' table."""
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("TRUNCATE TABLE rings RESTART IDENTITY")
        conn.commit()
        return jsonify(status="success", message="Database 'rings' table has been cleared.")
    except (psycopg2.Error, Exception) as e:
        if conn:
            conn.rollback()
        return jsonify(status="error", message=f"Database clearing failed: {e}"), 500
    finally:
        if conn:
            return_db_connection(conn)