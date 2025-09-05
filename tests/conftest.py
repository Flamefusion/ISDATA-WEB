"""
Test configuration and fixtures for the rings application.
"""
import os
import pytest
import psycopg2
from unittest.mock import Mock, patch, MagicMock, MagicMock
from app import create_app
from app.database import init_db_pool, get_db_connection, return_db_connection
from app.routes.db_routes import create_schema_endpoint


@pytest.fixture(scope='session')
def app():
    """Create application for the tests."""
    os.environ['TESTING'] = 'true'
    app = create_app()
    app.config.update({
        "TESTING": True,
        "WTF_CSRF_ENABLED": False
    })
    return app

@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """Create test runner."""
    return app.test_cli_runner()

@pytest.fixture
def mock_db_connection():
    """Mock database connection for unit tests."""
    with patch('app.database.get_db_connection') as mock_get_conn:
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_get_conn.return_value = mock_conn
        
        with patch('app.database.return_db_connection') as mock_return_conn:
            yield mock_conn, mock_cursor

@pytest.fixture
def sample_step7_data():
    """Sample Step 7 data for testing."""
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
    """Sample VQC data for testing."""
    return {
        '3DE TECH': [
            {
                'UID': 'ABC123',
                'Status': 'ACCEPTED',
                'Reason': ''
            }
        ],
        'IHC': [
            {
                'Serial': 'IHC001',
                'Status': 'REJECTED',
                'Reason': 'BLACK GLUE'
            }
        ],
        'MAKENICA': [
            {
                'Serial': 'MK001',
                'Status': 'ACCEPTED',
                'Reason': ''
            }
        ]
    }

@pytest.fixture
def sample_ft_data():
    """Sample FT data for testing."""
    return [
        {
            'UID': 'ABC123',
            'Test Result': 'PASS',
            'Comments': ''
        },
        {
            'UID': 'IHC001',
            'Test Result': 'FAIL',
            'Comments': 'SENSOR ISSUE'
        }
    ]

@pytest.fixture
def mock_gspread():
    """Mock Google Sheets connection."""
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
def google_config():
    """Sample Google Sheets configuration."""
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
    """Sample database configuration."""
    return {
        'dbHost': 'localhost',
        'dbPort': '5432',
        'dbName': 'test_db',
        'dbUser': 'test_user',
        'dbPassword': 'test_password'
    }