"""
Test configuration and fixtures for the rings application.
"""
import os
import pytest
from unittest.mock import Mock, patch, MagicMock
from app import create_app
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from app.database import get_db_connection, return_db_connection

@pytest.fixture(scope='session')
def db_setup(postgresql_proc):
    """
    Create the test database and tables.
    """
    host = postgresql_proc.host
    port = postgresql_proc.port
    user = postgresql_proc.user
    password = postgresql_proc.password
    
    # Connect to the default 'postgres' db to create our test db
    conn = psycopg2.connect(dbname='postgres', user=user, password=password, host=host, port=port)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    cursor.execute('DROP DATABASE IF EXISTS test_rings_db;')
    cursor.execute('CREATE DATABASE test_rings_db;')
    cursor.close()
    conn.close()

    # Set environment variables for the app to use this database
    os.environ['DB_HOST'] = host
    os.environ['DB_PORT'] = str(port)
    os.environ['DB_USER'] = user
    os.environ['DB_PASSWORD'] = password or ''
    os.environ['DB_NAME'] = 'test_rings_db'

    # Now connect to the created database to create the schema
    conn = psycopg2.connect(dbname='test_rings_db', user=user, password=password, host=host, port=port)
    with conn.cursor() as cursor:
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

        optimized_indexes_sql = """
        CREATE INDEX idx_rings_composite ON rings(vendor, vqc_status, ft_status);
        CREATE INDEX idx_rings_text_search ON rings USING GIN(reason_tsvector);
        """
        cursor.execute(optimized_indexes_sql)

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
    conn.close()

    yield

    # Teardown: drop the database
    conn = psycopg2.connect(dbname='postgres', user=user, password=password, host=host, port=port)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    # Terminate all connections to the test database before dropping it
    cursor.execute(f"""
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = 'test_rings_db'
      AND pid <> pg_backend_pid();
    """
    )
    cursor.execute('DROP DATABASE test_rings_db;')
    cursor.close()
    conn.close()

@pytest.fixture(scope='session') 
def app(db_setup):
    os.environ['TESTING'] = 'true'
    app = create_app()
    app.config.update({"TESTING": True, "WTF_CSRF_ENABLED": False})
    return app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def seed_db(app):
    """Seed the database with sample data for testing."""
    with app.app_context():
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                # Clear the table first to ensure a clean state
                cursor.execute("TRUNCATE TABLE rings RESTART IDENTITY")
                
                # Insert sample data
                insert_query = """
                INSERT INTO rings (date, vendor, serial_number, vqc_status, ft_status)
                VALUES 
                    ('2024-01-15', '3DE TECH', 'ABC123', 'ACCEPTED', 'PASS'),
                    ('2024-01-15', 'IHC', 'IHC001', 'REJECTED', 'FAIL');
                """
                cursor.execute(insert_query)
            conn.commit()
        finally:
            return_db_connection(conn)
    
    yield # Test runs here

    # Teardown: Clean up the table after the test
    with app.app_context():
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("TRUNCATE TABLE rings RESTART IDENTITY")
            conn.commit()
        finally:
            return_db_connection(conn)


@pytest.fixture
def mock_db_connection():
    with patch('app.database.get_db_connection') as mock_get_conn, \
         patch('app.database.return_db_connection'):
        
        mock_conn = MagicMock()
        mock_cursor = MagicMock() 
        mock_cursor.__enter__ = Mock(return_value=mock_cursor)
        mock_cursor.__exit__ = Mock(return_value=None)
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchall.return_value = []
        mock_cursor.execute.return_value = None
        mock_cursor.description = []
        mock_cursor.rowcount = 0
        mock_get_conn.return_value = mock_conn
        
        yield mock_conn, mock_cursor

@pytest.fixture
def mock_gspread():
    with patch('gspread.authorize') as mock_auth:
        mock_gc = Mock()
        mock_sheet = Mock()
        mock_worksheet = Mock()
        mock_sheet.title = 'Test Sheet'
        mock_sheet.worksheet.return_value = mock_worksheet
        mock_gc.open_by_url.return_value = mock_sheet
        mock_auth.return_value = mock_gc
        yield mock_gc, mock_sheet, mock_worksheet

@pytest.fixture
def sample_step7_data():
    return [
        {
            'logged_timestamp': '2024-01-15',
            'UID': 'ABC123',
            '3DE MO': 'MO001',
            'SKU': 'SKU001',
            'SIZE': '8',
            'IHC': 'IHC001',
            'IHC MO': 'IHCMO001',
            'IHC SKU': 'IHCSKU001',
            'IHC SIZE': '9',
            'MAKENICA': 'MK001',
            'MK MO': 'MKMO001',
            'MAKENICA SKU': 'MKSKU001',
            'MAKENICA SIZE': '10'
        }
    ]

@pytest.fixture
def sample_vqc_data():
    return {
        '3DE TECH': [{'UID': 'ABC123', 'Status': 'ACCEPTED', 'Reason': ''}],
        'IHC': [{'Serial': 'IHC001', 'Status': 'REJECTED', 'Reason': 'BLACK GLUE'}],
        'MAKENICA': [{'Serial': 'MK001', 'Status': 'ACCEPTED', 'Reason': ''}]
    }

@pytest.fixture
def sample_ft_data():
    return [
        {'UID': 'ABC123', 'Test Result': 'PASS', 'Comments': ''},
        {'UID': 'IHC001', 'Test Result': 'FAIL', 'Comments': 'SENSOR ISSUE'}
    ]

@pytest.fixture
def google_config():
    return {
        'serviceAccountContent': {
            'type': 'service_account',
            'project_id': 'test-project', 
            'private_key_id': 'test-key-id',
            'private_key': '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n',
            'client_email': 'test@test-project.iam.gserviceaccount.com',
            'client_id': '123456789',
            'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
            'token_uri': 'https://oauth2.googleapis.com/token'
        },
        'vendorDataUrl': 'https://docs.google.com/spreadsheets/d/test-vendor/edit',
        'vqcDataUrl': 'https://docs.google.com/spreadsheets/d/test-vqc/edit', 
        'ftDataUrl': 'https://docs.google.com/spreadsheets/d/test-ft/edit'
    }

@pytest.fixture
def db_config():
    return {
        'dbHost': 'localhost',
        'dbPort': '5432', 
        'dbName': 'test_rings_db',
        'dbUser': 'test_user',
        'dbPassword': 'test_password'
    }
