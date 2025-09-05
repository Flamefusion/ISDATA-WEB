"""
Integration tests for search routes.
"""
import json
import pytest
from unittest.mock import patch, Mock
import psycopg2

@pytest.mark.integration
class TestSearchRoutes:
    """Test search route endpoints."""
    
    def test_search_with_serial_numbers(self, client, mock_db_connection):
        """Test search by serial numbers."""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.description = [
            ('date',), ('vendor',), ('mo_number',), ('serial_number',),
            ('vqc_status',), ('ft_status',), ('vqc_reason',), ('ft_reason',)
        ]
        mock_cursor.fetchall.return_value = [
            ('2024-01-15', '3DE TECH', 'MO001', 'ABC123', 'ACCEPTED', 'PASS', '', '')
        ]
        
        search_filters = {
            'serialNumbers': 'ABC123, DEF456'
        }
        
        response = client.post('/api/search',
                             data=json.dumps(search_filters),
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) == 1
        assert data[0]['serial_number'] == 'ABC123'
        
        # Verify SQL query was called with uppercase serial numbers
        mock_cursor.execute.assert_called_once()
        call_args = mock_cursor.execute.call_args
        assert 'UPPER(serial_number) = ANY(%s)' in call_args[0][0]
        assert ['ABC123', 'DEF456'] in call_args[0][1]
    
    def test_search_with_mo_numbers(self, client, mock_db_connection):
        """Test search by MO numbers."""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.description = [
            ('date',), ('vendor',), ('mo_number',), ('serial_number',),
            ('vqc_status',), ('ft_status',), ('vqc_reason',), ('ft_reason',)
        ]
        mock_cursor.fetchall.return_value = []
        
        search_filters = {
            'moNumbers': 'MO001, MO002'
        }
        
        response = client.post('/api/search',
                             data=json.dumps(search_filters),
                             content_type='application/json')
        
        assert response.status_code == 200
        call_args = mock_cursor.execute.call_args
        assert 'UPPER(mo_number) = ANY(%s)' in call_args[0][0]
        assert ['MO001', 'MO002'] in call_args[0][1]
    
    def test_search_with_date_range(self, client, mock_db_connection):
        """Test search with date range."""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.description = [
            ('date',), ('vendor',), ('mo_number',), ('serial_number',),
            ('vqc_status',), ('ft_status',), ('vqc_reason',), ('ft_reason',)
        ]
        mock_cursor.fetchall.return_value = []
        
        search_filters = {
            'dateFrom': '2024-01-01',
            'dateTo': '2024-01-31'
        }
        
        response = client.post('/api/search',
                             data=json.dumps(search_filters),
                             content_type='application/json')
        
        assert response.status_code == 200
        call_args = mock_cursor.execute.call_args
        assert 'date >= %s' in call_args[0][0]
        assert 'date <= %s' in call_args[0][0]
    
    def test_search_with_invalid_date(self, client, mock_db_connection):
        """Test search with invalid date format."""
        search_filters = {
            'dateFrom': 'invalid-date'
        }
        
        response = client.post('/api/search',
                             data=json.dumps(search_filters),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'Invalid dateFrom format' in data['error']
    
    def test_search_with_vendor_filter(self, client, mock_db_connection):
        """Test search with vendor filter."""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.description = [
            ('date',), ('vendor',), ('mo_number',), ('serial_number',),
            ('vqc_status',), ('ft_status',), ('vqc_reason',), ('ft_reason',)
        ]
        mock_cursor.fetchall.return_value = []
        
        search_filters = {
            'vendor': ['3DE TECH', 'IHC']
        }
        
        response = client.post('/api/search',
                             data=json.dumps(search_filters),
                             content_type='application/json')
        
        assert response.status_code == 200
        call_args = mock_cursor.execute.call_args
        assert 'vendor = ANY(%s)' in call_args[0][0]
        assert ['3DE TECH', 'IHC'] in call_args[0][1]
    
    def test_search_with_status_filters(self, client, mock_db_connection):
        """Test search with VQC and FT status filters."""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.description = [
            ('date',), ('vendor',), ('mo_number',), ('serial_number',),
            ('vqc_status',), ('ft_status',), ('vqc_reason',), ('ft_reason',)
        ]
        mock_cursor.fetchall.return_value = []
        
        search_filters = {
            'vqcStatus': ['ACCEPTED'],
            'ftStatus': ['PASS', 'FAIL']
        }
        
        response = client.post('/api/search',
                             data=json.dumps(search_filters),
                             content_type='application/json')
        
        assert response.status_code == 200
        call_args = mock_cursor.execute.call_args
        assert 'vqc_status = ANY(%s)' in call_args[0][0]
        assert 'ft_status = ANY(%s)' in call_args[0][0]
    
    def test_search_with_rejection_reason(self, client, mock_db_connection):
        """Test search with rejection reason filter."""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.description = [
            ('date',), ('vendor',), ('mo_number',), ('serial_number',),
            ('vqc_status',), ('ft_status',), ('vqc_reason',), ('ft_reason',)
        ]
        mock_cursor.fetchall.return_value = []
        
        search_filters = {
            'rejectionReason': ['BLACK GLUE', 'SENSOR ISSUE']
        }
        
        response = client.post('/api/search',
                             data=json.dumps(search_filters),
                             content_type='application/json')
        
        assert response.status_code == 200
        call_args = mock_cursor.execute.call_args
        assert 'vqc_reason = ANY(%s) OR ft_reason = ANY(%s)' in call_args[0][0]
    
    def test_search_database_error(self, client):
        """Test search with database error."""
        with patch('app.routes.search_routes.get_db_connection') as mock_get_conn:
            mock_get_conn.side_effect = psycopg2.Error("Database connection failed")
            
            response = client.post('/api/search',
                                 data=json.dumps({}),
                                 content_type='application/json')
            
            assert response.status_code == 500
            data = json.loads(response.data)
            assert 'error' in data
    
    def test_get_search_filters_success(self, client, mock_db_connection):
        """Test getting search filter options."""
        mock_conn, mock_cursor = mock_db_connection
        
        # Mock multiple cursor calls for different filter options
        mock_cursor.fetchall.side_effect = [
            [('3DE TECH',), ('IHC',), ('MAKENICA',)],  # vendors
            [('ACCEPTED',), ('REJECTED',)],  # vqc_statuses
            [('PASS',), ('FAIL',)],  # ft_statuses
            [('BLACK GLUE',), ('SENSOR ISSUE',)]  # reasons
        ]
        
        response = client.get('/api/search/filters')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert 'vendors' in data
        assert 'vqc_statuses' in data
        assert 'ft_statuses' in data
        assert 'reasons' in data
        
        assert len(data['vendors']) == 3
        assert '3DE TECH' in data['vendors']
        assert 'ACCEPTED' in data['vqc_statuses']
    
    def test_export_search_results_csv(self, client, mock_db_connection):
        """Test exporting search results as CSV."""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.description = [
            ('date',), ('vendor',), ('mo_number',), ('serial_number',),
            ('vqc_status',), ('ft_status',), ('vqc_reason',), ('ft_reason',)
        ]
        mock_cursor.fetchall.return_value = [
            ('2024-01-15', '3DE TECH', 'MO001', 'ABC123', 'ACCEPTED', 'PASS', '', '')
        ]
        
        search_filters = {
            'serialNumbers': 'ABC123'
        }
        
        response = client.post('/api/search/export',
                             data=json.dumps(search_filters),
                             content_type='application/json')
        
        assert response.status_code == 200
        assert response.headers['Content-Type'] == 'text/csv; charset=utf-8'
        assert 'attachment;filename=search_results.csv' in response.headers['Content-Disposition']
        
        # Check CSV content
        csv_content = response.data.decode('utf-8')
        assert 'date,vendor,mo_number,serial_number' in csv_content
        assert 'ABC123' in csv_content
    
    def test_export_search_results_error(self, client):
        """Test export with database error."""
        with patch('app.routes.search_routes.get_db_connection') as mock_get_conn:
            mock_get_conn.side_effect = psycopg2.Error("Database error")
            
            response = client.post('/api/search/export',
                                 data=json.dumps({}),
                                 content_type='application/json')
            
            assert response.status_code == 500
            data = json.loads(response.data)
            assert data['status'] == 'error'

@pytest.mark.integration
class TestSearchValidation:
    """Test search input validation."""
    
    def test_search_empty_serial_numbers(self, client, mock_db_connection):
        """Test search with empty serial numbers string."""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.description = [
            ('date',), ('vendor',), ('mo_number',), ('serial_number',),
            ('vqc_status',), ('ft_status',), ('vqc_reason',), ('ft_reason',)
        ]
        mock_cursor.fetchall.return_value = []
        
        search_filters = {
            'serialNumbers': '  ,  ,  '  # Only whitespace and commas
        }
        
        response = client.post('/api/search',
                             data=json.dumps(search_filters),
                             content_type='application/json')
        
        assert response.status_code == 200
        # Should not add serial number filter to query
        call_args = mock_cursor.execute.call_args
        assert 'UPPER(serial_number) = ANY(%s)' not in call_args[0][0]
    
    def test_search_result_limit(self, client, mock_db_connection):
        """Test that search results are limited to 5000 records."""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.description = [
            ('date',), ('vendor',), ('mo_number',), ('serial_number',),
            ('vqc_status',), ('ft_status',), ('vqc_reason',), ('ft_reason',)
        ]
        mock_cursor.fetchall.return_value = []
        
        response = client.post('/api/search',
                             data=json.dumps({}),
                             content_type='application/json')
        
        assert response.status_code == 200
        call_args = mock_cursor.execute.call_args
        assert 'LIMIT 5000' in call_args[0][0]