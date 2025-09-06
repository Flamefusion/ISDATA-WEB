"""
Integration tests for database routes.
"""
import json
import pytest
from unittest.mock import patch, Mock, MagicMock
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
                'localhost', '5432', 'test_rings_db', 'test_user', 'test_password'
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
    
    def test_create_schema_success(self, client):
        """Test successful schema creation."""
        # The db_setup fixture already creates the schema, so this test 
        # verifies that the endpoint can run without errors on an existing schema.
        response = client.post('/api/db/schema')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'success'
    
    def test_create_schema_database_error(self, client):
        """Test schema creation with database error."""
        with patch('app.routes.db_routes.get_db_connection') as mock_get_conn:
            mock_get_conn.side_effect = psycopg2.Error("Schema creation failed")
            
            response = client.post('/api/db/schema')
            
            assert response.status_code == 500
            data = json.loads(response.data)
            assert data['status'] == 'error'
            assert 'Database error during schema creation' in data['message']
    
    def test_clear_database_success(self, client, seed_db):
        """Test successful database clearing."""
        # First, verify data exists from seed_db
        response = client.get('/api/data')
        assert len(json.loads(response.data)) > 0

        # Now, clear the database
        response = client.delete('/api/db/clear')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'success'
        assert 'cleared' in data['message']

        # Verify the database is empty
        response = client.get('/api/data')
        assert len(json.loads(response.data)) == 0
    
    def test_clear_database_error(self, client):
        """Test database clearing with error."""
        with patch('app.routes.db_routes.get_db_connection') as mock_get_conn:
            mock_get_conn.side_effect = psycopg2.Error("Clear failed")
            
            response = client.delete('/api/db/clear')
            
            assert response.status_code == 500
            data = json.loads(response.data)
            assert data['status'] == 'error'