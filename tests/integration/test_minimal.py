"""
Minimal integration test to verify basic functionality.
"""
import json
import pytest
from unittest.mock import patch, Mock, MagicMock

@pytest.mark.integration
def test_minimal_db_route(client):
    """Minimal test for database route."""
    with patch('app.routes.db_routes.test_single_db_connection') as mock_test:
        mock_test.return_value = (True, "Connection successful")
        
        response = client.post('/api/db/test', 
                             json={'dbHost': 'localhost', 'dbPort': '5432', 
                                   'dbName': 'test', 'dbUser': 'user', 'dbPassword': 'pass'})
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'success'

@pytest.mark.integration 
def test_minimal_data_route(client):
    """Minimal test for data route."""
    with patch('app.routes.data_routes.get_db_connection') as mock_get_conn, \
         patch('app.routes.data_routes.return_db_connection'):
        
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        
        # Properly set up context manager
        mock_cursor.__enter__ = Mock(return_value=mock_cursor)
        mock_cursor.__exit__ = Mock(return_value=None)
        mock_conn.cursor.return_value = mock_cursor
        
        mock_cursor.description = [('id',), ('serial_number',)]
        mock_cursor.fetchall.return_value = [(1, 'ABC123')]
        
        mock_get_conn.return_value = mock_conn
        
        response = client.get('/api/data')
        assert response.status_code == 200
