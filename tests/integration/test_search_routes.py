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
    
    def test_search_with_serial_numbers(self, client, seed_db):
        """Test search by serial numbers."""
        search_filters = {
            'serialNumbers': 'ABC123'
        }
        
        response = client.post('/api/search',
                             data=json.dumps(search_filters),
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) == 1
        assert data[0]['serial_number'] == 'ABC123'
    
    def test_search_with_mo_numbers(self, client, seed_db):
        """Test search by MO numbers."""
        search_filters = {
            'moNumbers': 'MO001'
        }
        
        response = client.post('/api/search',
                             data=json.dumps(search_filters),
                             content_type='application/json')
        
        assert response.status_code == 200
    
    def test_search_with_date_range(self, client, seed_db):
        """Test search with date range."""
        search_filters = {
            'dateFrom': '2024-01-15',
            'dateTo': '2024-01-15'
        }
        
        response = client.post('/api/search',
                             data=json.dumps(search_filters),
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) == 2
    
    def test_search_with_invalid_date(self, client):
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
    
    def test_search_with_vendor_filter(self, client, seed_db):
        """Test search with vendor filter."""
        search_filters = {
            'vendor': ['3DE TECH']
        }
        
        response = client.post('/api/search',
                             data=json.dumps(search_filters),
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) == 1
        assert data[0]['vendor'] == '3DE TECH'
    
    def test_search_with_status_filters(self, client, seed_db):
        """Test search with VQC and FT status filters."""
        search_filters = {
            'vqcStatus': ['ACCEPTED'],
            'ftStatus': ['PASS']
        }
        
        response = client.post('/api/search',
                             data=json.dumps(search_filters),
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) == 1
    
    def test_search_with_rejection_reason(self, client, seed_db):
        """Test search with rejection reason filter."""
        search_filters = {
            'rejectionReason': ['BLACK GLUE']
        }
        
        response = client.post('/api/search',
                             data=json.dumps(search_filters),
                             content_type='application/json')
        
        assert response.status_code == 200
    
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
    
    def test_get_search_filters_success(self, client, seed_db):
        """Test getting search filter options."""
        response = client.get('/api/search/filters')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert 'vendors' in data
        assert 'vqc_statuses' in data
        assert 'ft_statuses' in data
        assert 'reasons' in data
        
        assert len(data['vendors']) >= 2
        assert '3DE TECH' in data['vendors']
        assert 'IHC' in data['vendors']
    
    def test_export_search_results_csv(self, client, seed_db):
        """Test exporting search results as CSV."""
        search_filters = {
            'serialNumbers': 'ABC123'
        }
        
        response = client.post('/api/search/export',
                             data=json.dumps(search_filters),
                             content_type='application/json')
        
        assert response.status_code == 200
        assert response.headers['Content-Type'] == 'text/csv; charset=utf-8'
        
        csv_content = response.data.decode('utf-8')
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
    
    def test_search_empty_serial_numbers(self, client):
        """Test search with empty serial numbers string."""
        search_filters = {
            'serialNumbers': '  ,  ,  '
        }
        
        response = client.post('/api/search',
                             data=json.dumps(search_filters),
                             content_type='application/json')
        
        assert response.status_code == 200
    
    def test_search_result_limit(self, client, seed_db):
        """Test that search results are limited to 5000 records."""
        response = client.post('/api/search',
                             data=json.dumps({}),
                             content_type='application/json')
        
        assert response.status_code == 200