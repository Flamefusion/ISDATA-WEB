"""
Integration tests for database routes.
"""
import json
import pytest
from unittest.mock import patch, Mock,MagicMock
import psycopg2

@pytest.mark.integration
class TestDatabaseRoutes:
    """Test database route endpoints."""
    
    def test_db_test_success(self, client, db_config):
        """Test successful database connection test."""
        with patch('app.routes.db_routes.check_single_db_connection') as mock_test:
            mock_test.return_value = (True, "Database connection successful!")
            
            response = client.post('/api/db/test', 
                                 data=json.dumps(db_config),
                                 content_type='application/json')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data['status'] == 'success'
            assert 'successful' in data['message']
            
            mock_test.assert_called_once_with(
                'localhost', '5432', 'test_db', 'test_user', 'test_password'
            )
    
    def test_db_test_failure(self, client, db_config):
        """Test failed database connection test."""
        with patch('app.routes.db_routes.check_single_db_connection') as mock_test:
            mock_test.return_value = (False, "Connection failed")
            
            response = client.post('/api/db/test',
                                 data=json.dumps(db_config),
                                 content_type='application/json')
            
            assert response.status_code == 500
            data = json.loads(response.data)
            assert data['status'] == 'error'
    
    def test_db_test_missing_fields(self, client):
        """Test database test with missing configuration fields."""
        incomplete_config = {
            'dbHost': 'localhost',
            'dbPort': '5432'
            # Missing dbName, dbUser, dbPassword
        }
        
        response = client.post('/api/db/test',
                             data=json.dumps(incomplete_config),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert data['status'] == 'error'
        assert 'All database configuration fields must be provided' in data['message']
    
    def test_create_schema_success(self, client, monkeypatch):
        """Test successful schema creation."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

        def mock_get_conn():
            return mock_conn

        monkeypatch.setattr("app.routes.db_routes.get_db_connection", mock_get_conn)

        response = client.post('/api/db/schema')

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'success'

        # Verify that schema creation SQL was executed
        assert mock_cursor.execute.call_count >= 4  # Multiple SQL statements
        mock_conn.commit.assert_called_once()
    
    def test_create_schema_database_error(self, client):
        """Test schema creation with database error."""
        with patch('app.routes.db_routes.get_db_connection') as mock_get_conn:
            mock_conn = MagicMock()
            mock_cursor = MagicMock()
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            mock_cursor.execute.side_effect = psycopg2.Error("Schema creation failed")
            mock_get_conn.return_value = mock_conn
            
            with patch('app.routes.db_routes.return_db_connection'):
                response = client.post('/api/db/schema')
            
            assert response.status_code == 500
            data = json.loads(response.data)
            assert data['status'] == 'error'
            assert 'Database error during schema creation' in data['message']
            mock_conn.rollback.assert_called_once()
    
    def test_clear_database_success(self, client, monkeypatch):
        """Test successful database clearing."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

        def mock_get_conn():
            return mock_conn

        monkeypatch.setattr("app.routes.db_routes.get_db_connection", mock_get_conn)

        response = client.delete('/api/db/clear')

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'success'
        assert 'cleared' in data['message']

        mock_cursor.execute.assert_called_with("TRUNCATE TABLE rings RESTART IDENTITY")
        mock_conn.commit.assert_called_once()
    
    def test_clear_database_error(self, client):
        """Test database clearing with error."""
        with patch('app.routes.db_routes.get_db_connection') as mock_get_conn:
            mock_conn = MagicMock()
            mock_cursor = MagicMock()
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            mock_cursor.execute.side_effect = psycopg2.Error("Clear failed")
            mock_get_conn.return_value = mock_conn
            
            with patch('app.routes.db_routes.return_db_connection'):
                response = client.delete('/api/db/clear')
            
            assert response.status_code == 500
            data = json.loads(response.data)
            assert data['status'] == 'error'
            mock_conn.rollback.assert_called_once()