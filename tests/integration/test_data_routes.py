"""
Integration tests for data routes.
"""
import json
import pytest
from unittest.mock import patch, Mock, MagicMock
import psycopg2

@pytest.mark.integration
class TestDataRoutes:
    """Test data route endpoints."""
    
    def test_get_data_success(self, client, mock_db_connection):
        """Test successful data retrieval."""
        mock_conn, mock_cursor = mock_db_connection
        
        # Mock cursor description and data
        mock_cursor.description = [
            ('id',), ('date',), ('vendor',), ('serial_number',), 
            ('vqc_status',), ('ft_status',)
        ]
        mock_cursor.fetchall.return_value = [
            (1, '2024-01-15', '3DE TECH', 'ABC123', 'ACCEPTED', 'PASS'),
            (2, '2024-01-15', 'IHC', 'IHC001', 'REJECTED', 'FAIL')
        ]
        
        response = client.get('/api/data')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) == 2
        assert data[0]['serial_number'] == 'ABC123'
        assert data[1]['vendor'] == 'IHC'
    
    def test_get_data_database_error(self, client):
        """Test data retrieval with database error."""
        with patch('app.routes.data_routes.get_db_connection') as mock_get_conn:
            mock_get_conn.side_effect = psycopg2.Error("Connection failed")
            
            response = client.get('/api/data')
            
            assert response.status_code == 500
            data = json.loads(response.data)
            assert 'error' in data
    
    def test_test_sheets_connection_success(self, client, google_config):
        """Test successful Google Sheets connection test."""
        with patch('app.routes.data_routes.test_sheets_connection') as mock_test:
            mock_test.return_value = {
                'status': 'success',
                'message': '✓ Vendor Data: Connected to Test Sheet'
            }
            
            response = client.post('/api/test_sheets_connection',
                                 data=json.dumps(google_config),
                                 content_type='application/json')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data['status'] == 'success'
    
    def test_test_sheets_connection_failure(self, client, google_config):
        """Test failed Google Sheets connection test."""
        with patch('app.routes.data_routes.test_sheets_connection') as mock_test:
            mock_test.return_value = {
                'status': 'error',
                'message': '✗ Vendor Data: FAILED (Access denied)'
            }
            
            response = client.post('/api/test_sheets_connection',
                                 data=json.dumps(google_config),
                                 content_type='application/json')
            
            assert response.status_code == 500
            data = json.loads(response.data)
            assert data['status'] == 'error'
    
    def test_migrate_success(self, client, google_config, mock_gspread, 
                           sample_step7_data, sample_vqc_data, sample_ft_data, mock_db_connection):
        """Test successful data migration."""
        mock_gc, mock_sheet, mock_worksheet = mock_gspread
        mock_conn, mock_cursor = mock_db_connection
        
        with patch('app.routes.data_routes.Credentials.from_service_account_info'), \
             patch('app.routes.data_routes.gspread.authorize', return_value=mock_gc), \
             patch('app.routes.data_routes.load_sheets_data_parallel') as mock_load, \
             patch('app.routes.data_routes.merge_ring_data_fast') as mock_merge:
            
            # Setup mocks
            mock_load.return_value = (
                sample_step7_data, sample_vqc_data, sample_ft_data, 
                ['Loading completed']
            )
            mock_merge.return_value = (
                [{'serial_number': 'ABC123', 'vendor': '3DE TECH', 'vqc_status': 'ACCEPTED'}],
                ['Merge completed']
            )
            
            mock_cursor.rowcount = 1
            
            response = client.post('/api/migrate',
                                 data=json.dumps(google_config),
                                 content_type='application/json')
            
            assert response.status_code == 200
            # For streaming response, check that it contains expected data
            response_text = response.data.decode('utf-8')
            assert 'Google API connection successful' in response_text
            assert 'Migration completed successfully' in response_text
    
    def test_migrate_google_api_failure(self, client, google_config):
        """Test migration with Google API connection failure."""
        with patch('app.routes.data_routes.Credentials.from_service_account_info') as mock_creds:
            mock_creds.side_effect = Exception("Invalid credentials")
            
            response = client.post('/api/migrate',
                                 data=json.dumps(google_config),
                                 content_type='application/json')
            
            assert response.status_code == 200
            response_text = response.data.decode('utf-8')
            assert 'ERROR: Google API connection failed' in response_text
    
    def test_migrate_no_data(self, client, google_config, mock_gspread):
        """Test migration with no data to migrate."""
        mock_gc, mock_sheet, mock_worksheet = mock_gspread
        
        with patch('app.routes.data_routes.Credentials.from_service_account_info'), \
             patch('app.routes.data_routes.gspread.authorize', return_value=mock_gc), \
             patch('app.routes.data_routes.load_sheets_data_parallel') as mock_load, \
             patch('app.routes.data_routes.merge_ring_data_fast') as mock_merge:
            
            mock_load.return_value = ([], {}, [], ['No data found'])
            mock_merge.return_value = ([], ['No data to merge'])
            
            response = client.post('/api/migrate',
                                 data=json.dumps(google_config),
                                 content_type='application/json')
            
            assert response.status_code == 200
            response_text = response.data.decode('utf-8')
            assert 'No data to migrate' in response_text
    
    def test_migrate_database_error(self, client, google_config, mock_gspread,
                                  sample_step7_data, sample_vqc_data, sample_ft_data):
        """Test migration with database error."""
        mock_gc, mock_sheet, mock_worksheet = mock_gspread
        
        with patch('app.routes.data_routes.Credentials.from_service_account_info'), \
             patch('app.routes.data_routes.gspread.authorize', return_value=mock_gc), \
             patch('app.routes.data_routes.load_sheets_data_parallel') as mock_load, \
             patch('app.routes.data_routes.merge_ring_data_fast') as mock_merge, \
             patch('app.routes.data_routes.get_db_connection') as mock_get_conn:
            
            mock_load.return_value = (
                sample_step7_data, sample_vqc_data, sample_ft_data, 
                ['Loading completed']
            )
            mock_merge.return_value = (
                [{'serial_number': 'ABC123', 'vendor': '3DE TECH'}],
                ['Merge completed']
            )
            
            # Mock database connection to fail
            mock_conn = MagicMock()
            mock_cursor = MagicMock()
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            mock_cursor.execute.side_effect = psycopg2.Error("Database error")
            mock_get_conn.return_value = mock_conn
            
            response = client.post('/api/migrate',
                                 data=json.dumps(google_config),
                                 content_type='application/json')
            
            assert response.status_code == 200
            response_text = response.data.decode('utf-8')
            assert 'ERROR: High-speed migration failed' in response_text
            mock_conn.rollback.assert_called_once()

@pytest.mark.integration
class TestDataValidation:
    """Test data validation in migration process."""
    
    def test_migrate_with_invalid_dates(self, client, google_config, mock_gspread, mock_db_connection):
        """Test migration handling of invalid date formats."""
        mock_gc, mock_sheet, mock_worksheet = mock_gspread
        mock_conn, mock_cursor = mock_db_connection
        
        invalid_data = [{
            'date': 'invalid-date',
            'serial_number': 'ABC123',
            'vendor': '3DE TECH',
            'mo_number': 'MO001'
        }]
        
        with patch('app.routes.data_routes.Credentials.from_service_account_info'), \
             patch('app.routes.data_routes.gspread.authorize', return_value=mock_gc), \
             patch('app.routes.data_routes.load_sheets_data_parallel') as mock_load, \
             patch('app.routes.data_routes.merge_ring_data_fast') as mock_merge:
            
            mock_load.return_value = ([], {}, [], ['Loading completed'])
            mock_merge.return_value = (invalid_data, ['Merge completed'])
            
            response = client.post('/api/migrate',
                                 data=json.dumps(google_config),
                                 content_type='application/json')
            
            # Should handle invalid dates gracefully
            assert response.status_code == 200