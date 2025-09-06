"""
Integration tests for report routes.
"""
import json
import pytest
from unittest.mock import patch, Mock
from datetime import datetime
import psycopg2

@pytest.mark.integration
class TestDailyReport:
    """Test daily report functionality."""
    
    def test_daily_report_success(self, client, seed_db):
        """Test successful daily report generation."""
        report_config = {
            'date': '2024-01-15',
            'vendor': 'all'
        }
        
        response = client.post('/api/reports/daily',
                             data=json.dumps(report_config),
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert data['date'] == '2024-01-15'
        assert data['vendor'] == 'all'
        assert data['totalReceived'] == 2
        assert data['totalAccepted'] == 1
        assert data['totalRejected'] == 1
    
    def test_daily_report_specific_vendor(self, client, seed_db):
        """Test daily report for specific vendor."""
        report_config = {
            'date': '2024-01-15',
            'vendor': '3DE TECH'
        }
        
        response = client.post('/api/reports/daily',
                             data=json.dumps(report_config),
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['vendor'] == '3DE TECH'
        assert data['totalReceived'] == 1
    
    def test_daily_report_no_data(self, client):
        """Test daily report with no data."""
        report_config = {
            'date': '2024-01-16', # A date with no data
            'vendor': 'all'
        }
        
        response = client.post('/api/reports/daily',
                             data=json.dumps(report_config),
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['totalReceived'] == 0
        assert data['totalAccepted'] == 0
        assert data['yield'] == 0
    
    def test_daily_report_missing_date(self, client):
        """Test daily report without date parameter."""
        report_config = {
            'vendor': 'all'
        }
        
        response = client.post('/api/reports/daily',
                             data=json.dumps(report_config),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Date is required' in data['error']
    
    def test_daily_report_database_error(self, client):
        """Test daily report with database error."""
        with patch('app.routes.report_routes.get_db_connection') as mock_get_conn:
            mock_get_conn.side_effect = psycopg2.Error("Database error")
            
            report_config = {
                'date': '2024-01-15',
                'vendor': 'all'
            }
            
            response = client.post('/api/reports/daily',
                                 data=json.dumps(report_config),
                                 content_type='application/json')
            
            assert response.status_code == 500
            data = json.loads(response.data)
            assert 'error' in data

@pytest.mark.integration
class TestDailyReportExport:
    """Test daily report export functionality."""
    
    def test_export_daily_report_excel(self, client, seed_db):
        """Test Excel export of daily report."""
        export_config = {
            'date': '2024-01-15',
            'vendor': '3DE TECH',
            'format': 'excel'
        }
        
        response = client.post('/api/reports/export',
                             data=json.dumps(export_config),
                             content_type='application/json')
        
        assert response.status_code == 200
        assert 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' in response.headers['Content-Type']
    
    def test_export_daily_report_invalid_format(self, client):
        """Test export with invalid format."""
        export_config = {
            'date': '2024-01-15',
            'vendor': 'all',
            'format': 'pdf'  # Invalid format
        }
        
        response = client.post('/api/reports/export',
                             data=json.dumps(export_config),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Invalid export format' in data['error']

@pytest.mark.integration
class TestRejectionTrends:
    """Test rejection trends report functionality."""
    
    def test_rejection_trends_success(self, client, seed_db):
        """Test successful rejection trends report generation."""
        trends_config = {
            'dateFrom': '2024-01-15',
            'dateTo': '2024-01-15',
            'vendor': 'IHC',
            'rejectionStage': 'both'
        }
        
        response = client.post('/api/reports/rejection-trends',
                             data=json.dumps(trends_config),
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert 'dateRange' in data
        assert 'rejectionData' in data
        assert 'summary' in data
        assert data['vendor'] == 'IHC'
    
    def test_rejection_trends_vqc_only(self, client, seed_db):
        """Test rejection trends for VQC stage only."""
        trends_config = {
            'dateFrom': '2024-01-15',
            'dateTo': '2024-01-15',
            'vendor': 'IHC',
            'rejectionStage': 'vqc'
        }
        
        response = client.post('/api/reports/rejection-trends',
                             data=json.dumps(trends_config),
                             content_type='application/json')
        
        assert response.status_code == 200
    
    def test_rejection_trends_ft_only(self, client, seed_db):
        """Test rejection trends for FT stage only."""
        trends_config = {
            'dateFrom': '2024-01-15',
            'dateTo': '2024-01-15',
            'vendor': 'IHC',
            'rejectionStage': 'ft'
        }
        
        response = client.post('/api/reports/rejection-trends',
                             data=json.dumps(trends_config),
                             content_type='application/json')
        
        assert response.status_code == 200
    
    def test_rejection_trends_missing_params(self, client):
        """Test rejection trends with missing parameters."""
        trends_config = {
            'dateFrom': '2024-01-01'
            # Missing dateTo and vendor
        }
        
        response = client.post('/api/reports/rejection-trends',
                             data=json.dumps(trends_config),
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'dateFrom, dateTo, and vendor are required' in data['error']
    
    def test_rejection_trends_database_error(self, client):
        """Test rejection trends with database error."""
        with patch('app.routes.report_routes.get_db_connection') as mock_get_conn:
            mock_get_conn.side_effect = psycopg2.Error("Database error")
            
            trends_config = {
                'dateFrom': '2024-01-01',
                'dateTo': '2024-01-01',
                'vendor': 'IHC'
            }
            
            response = client.post('/api/reports/rejection-trends',
                                 data=json.dumps(trends_config),
                                 content_type='application/json')
            
            assert response.status_code == 500
            data = json.loads(response.data)
            assert 'error' in data

@pytest.mark.integration
class TestRejectionTrendsExport:
    """Test rejection trends export functionality."""
    
    def test_export_rejection_trends_csv(self, client, seed_db):
        """Test CSV export of rejection trends."""
        export_config = {
            'dateFrom': '2024-01-15',
            'dateTo': '2024-01-15',
            'vendor': 'IHC',
            'format': 'csv',
            'rejectionStage': 'both'
        }
        
        response = client.post('/api/reports/rejection-trends/export',
                             data=json.dumps(export_config),
                             content_type='application/json')
        
        assert response.status_code == 200
        assert response.headers['Content-Type'] == 'text/csv; charset=utf-8'
    
    def test_export_rejection_trends_excel(self, client, seed_db):
        """Test Excel export of rejection trends."""
        export_config = {
            'dateFrom': '2024-01-15',
            'dateTo': '2024-01-15',
            'vendor': 'IHC',
            'format': 'excel',
            'rejectionStage': 'vqc'
        }
        
        response = client.post('/api/reports/rejection-trends/export',
                             data=json.dumps(export_config),
                             content_type='application/json')
        
        assert response.status_code == 200
        assert 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' in response.headers['Content-Type']

@pytest.mark.integration
class TestReportBusinessLogic:
    """Test business logic in reports."""
    
    def test_daily_report_status_logic(self, client, seed_db):
        """Test correct status determination logic in daily report."""
        report_config = {
            'date': '2024-01-15',
            'vendor': 'all'
        }
        
        response = client.post('/api/reports/daily',
                             data=json.dumps(report_config),
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert data['totalReceived'] == 2
        assert data['totalAccepted'] == 1
        assert data['totalRejected'] == 1
        assert data['totalPending'] == 0
    
    def test_rejection_trends_categorization(self, client, seed_db):
        """Test rejection reason categorization in trends report."""
        trends_config = {
            'dateFrom': '2024-01-15',
            'dateTo': '2024-01-15',
            'vendor': 'IHC'
        }
        
        response = client.post('/api/reports/rejection-trends',
                             data=json.dumps(trends_config),
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert len(data['rejectionData']) > 0
        """Test CSV export of daily report."""
        export_config = {
            'date': '2024-01-15',
            'vendor': 'all',
            'format': 'csv'
        }
        
        response = client.post('/api/reports/export',
                             data=json.dumps(export_config),
                             content_type='application/json')
        
        assert response.status_code == 200
        assert response.headers['Content-Type'] == 'text/csv; charset=utf-8'
        
        csv_content = response.data.decode('utf-8')
        assert 'ABC123' in csv_content