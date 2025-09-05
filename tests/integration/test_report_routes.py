"""
Integration tests for report routes.
"""
import json
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime
import psycopg2

@pytest.mark.integration
class TestDailyReport:
    """Test daily report functionality."""
    
    def test_daily_report_success(self, client, monkeypatch):
        """Test successful daily report generation."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

        def mock_get_conn():
            return mock_conn

        monkeypatch.setattr("app.routes.report_routes.get_db_connection", mock_get_conn)

        # Mock sample data with different statuses
        mock_cursor.fetchall.return_value = [
            ('3DE TECH', 'ABC123', 'MO001', 'SKU001', '8', 'ACCEPTED', '', 'PASS', '', datetime(2024, 1, 15, 10, 0)),
            ('IHC', 'IHC001', 'IHCMO001', 'IHCSKU001', '9', 'REJECTED', 'BLACK GLUE', '', '', datetime(2024, 1, 15, 11, 0)),
            ('MAKENICA', 'MK001', 'MKMO001', 'MKSKU001', '10', 'ACCEPTED', '', 'FAIL', 'SENSOR ISSUE', datetime(2024, 1, 15, 12, 0))
        ]
        
        report_config = {
            'date': '2024-01-15',
            'vendor': 'all'
        }
        
        response = client.post('/api/reports/daily',
                             data=json.dumps(report_config),
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        # Verify report structure
        assert data['date'] == '2024-01-15'
        assert data['vendor'] == 'all'
        assert data['totalReceived'] == 3
        assert 'totalAccepted' in data
        assert 'totalRejected' in data
        assert 'yield' in data
        assert 'vqcBreakdown' in data
        assert 'ftBreakdown' in data
        assert 'hourlyData' in data
        assert 'vendorBreakdown' in data
    
    def test_daily_report_specific_vendor(self, client, mock_db_connection):
        """Test daily report for specific vendor."""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.fetchall.return_value = [
            ('3DE TECH', 'ABC123', 'MO001', 'SKU001', '8', 'ACCEPTED', '', 'PASS', '', datetime(2024, 1, 15, 10, 0))
        ]
        
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
        assert len(data['vendorBreakdown']) == 0  # No breakdown for single vendor
    
    def test_daily_report_no_data(self, client, mock_db_connection):
        """Test daily report with no data."""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.fetchall.return_value = []
        
        report_config = {
            'date': '2024-01-15',
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
    
    def test_export_daily_report_excel(self, client, monkeypatch):
        """Test Excel export of daily report."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

        def mock_get_conn():
            return mock_conn

        monkeypatch.setattr("app.routes.report_routes.get_db_connection", mock_get_conn)

        mock_cursor.fetchall.return_value = [
            ('2024-01-15', '3DE TECH', 'ABC123', 'MO001', 'SKU001', '8', 'ACCEPTED', '', 'PASS', '', 'Accepted', datetime(2024, 1, 15, 10, 0))
        ]
        
        export_config = {
            'date': '2024-01-15',
            'vendor': '3DE TECH',
            'format': 'excel'
        }
        
        with patch('pandas.DataFrame.to_excel') as mock_to_excel:
            response = client.post('/api/reports/export',
                                 data=json.dumps(export_config),
                                 content_type='application/json')
            
            assert response.status_code == 200
            assert 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' in response.headers['Content-Type']
            mock_to_excel.assert_called_once()
    
    def test_export_daily_report_invalid_format(self, client, mock_db_connection):
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
    
    def test_rejection_trends_success(self, client, mock_db_connection):
        """Test successful rejection trends report generation."""
        mock_conn, mock_cursor = mock_db_connection
        
        # Mock date range generation
        mock_cursor.fetchall.side_effect = [
            # Date range query
            [(datetime(2024, 1, 1).date(),), (datetime(2024, 1, 2).date(),)],
            # Rejection data query
            [
                (datetime(2024, 1, 1).date(), 'IHC', 'BLACK GLUE', '', 'REJECTED', ''),
                (datetime(2024, 1, 2).date(), 'IHC', '', 'SENSOR ISSUE', '', 'FAIL')
            ]
        ]
        
        trends_config = {
            'dateFrom': '2024-01-01',
            'dateTo': '2024-01-02',
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
        assert len(data['dateRange']) == 2
    
    def test_rejection_trends_vqc_only(self, client, monkeypatch):
        """Test rejection trends for VQC stage only."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

        def mock_get_conn():
            return mock_conn

        monkeypatch.setattr("app.routes.report_routes.get_db_connection", mock_get_conn)
        
        mock_cursor.fetchall.side_effect = [
            [(datetime(2024, 1, 1).date(),)],
            [(datetime(2024, 1, 1).date(), 'IHC', 'BLACK GLUE', '', 'REJECTED', '')]
        ]
        
        trends_config = {
            'dateFrom': '2024-01-01',
            'dateTo': '2024-01-01',
            'vendor': 'IHC',
            'rejectionStage': 'vqc'
        }
        
        response = client.post('/api/reports/rejection-trends',
                             data=json.dumps(trends_config),
                             content_type='application/json')
        
        assert response.status_code == 200
        # Verify VQC-specific query was executed
        call_args = mock_cursor.execute.call_args_list[1][0]
        assert 'vqc_status IS NOT NULL' in call_args[0]
        assert 'ft_status IS NOT NULL' not in call_args[0]
    
    def test_rejection_trends_ft_only(self, client, monkeypatch):
        """Test rejection trends for FT stage only."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

        def mock_get_conn():
            return mock_conn

        monkeypatch.setattr("app.routes.report_routes.get_db_connection", mock_get_conn)
        
        mock_cursor.fetchall.side_effect = [
            [(datetime(2024, 1, 1).date(),)],
            [(datetime(2024, 1, 1).date(), 'IHC', '', 'SENSOR ISSUE', '', 'FAIL')]
        ]
        
        trends_config = {
            'dateFrom': '2024-01-01',
            'dateTo': '2024-01-01',
            'vendor': 'IHC',
            'rejectionStage': 'ft'
        }
        
        response = client.post('/api/reports/rejection-trends',
                             data=json.dumps(trends_config),
                             content_type='application/json')
        
        assert response.status_code == 200
        # Verify FT-specific query was executed
        call_args = mock_cursor.execute.call_args_list[1][0]
        assert 'ft_status IS NOT NULL' in call_args[0]
    
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
    
    def test_export_rejection_trends_csv(self, client, monkeypatch):
        """Test CSV export of rejection trends."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

        def mock_get_conn():
            return mock_conn

        monkeypatch.setattr("app.routes.report_routes.get_db_connection", mock_get_conn)
        
        mock_cursor.fetchall.side_effect = [
            [(datetime(2024, 1, 1).date(),)],
            [(datetime(2024, 1, 1).date(), 'IHC', 'BLACK GLUE', '', 'REJECTED', '')]
        ]
        
        export_config = {
            'dateFrom': '2024-01-01',
            'dateTo': '2024-01-01',
            'vendor': 'IHC',
            'format': 'csv',
            'rejectionStage': 'both'
        }
        
        response = client.post('/api/reports/rejection-trends/export',
                             data=json.dumps(export_config),
                             content_type='application/json')
        
        assert response.status_code == 200
        assert response.headers['Content-Type'] == 'text/csv; charset=utf-8'
        assert 'rejection_trends_2024-01-01_to_2024-01-01_IHC.csv' in response.headers['Content-Disposition']
    
    def test_export_rejection_trends_excel(self, client, monkeypatch):
        """Test Excel export of rejection trends."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

        def mock_get_conn():
            return mock_conn

        monkeypatch.setattr("app.routes.report_routes.get_db_connection", mock_get_conn)
        
        mock_cursor.fetchall.side_effect = [
            [(datetime(2024, 1, 1).date(),)],
            [(datetime(2024, 1, 1).date(), 'IHC', 'BLACK GLUE', '', 'REJECTED', '')]
        ]
        
        export_config = {
            'dateFrom': '2024-01-01',
            'dateTo': '2024-01-01',
            'vendor': 'IHC',
            'format': 'excel',
            'rejectionStage': 'vqc'
        }
        
        with patch('pandas.DataFrame.to_excel') as mock_to_excel:
            response = client.post('/api/reports/rejection-trends/export',
                                 data=json.dumps(export_config),
                                 content_type='application/json')
            
            assert response.status_code == 200
            assert 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' in response.headers['Content-Type']
            mock_to_excel.assert_called_once()

@pytest.mark.integration
class TestReportBusinessLogic:
    """Test business logic in reports."""
    
    def test_daily_report_status_logic(self, client, monkeypatch):
        """Test correct status determination logic in daily report."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

        def mock_get_conn():
            return mock_conn

        monkeypatch.setattr("app.routes.report_routes.get_db_connection", mock_get_conn)
        
        # Test different status combinations
        mock_cursor.fetchall.return_value = [
            # VQC rejected - should be final rejection
            ('IHC', 'IHC001', 'MO001', 'SKU001', '8', 'REJECTED', 'BLACK GLUE', 'PASS', '', datetime(2024, 1, 15, 10, 0)),
            # VQC accepted, FT rejected - should be final rejection with FT reason
            ('IHC', 'IHC002', 'MO002', 'SKU002', '9', 'ACCEPTED', '', 'FAIL', 'SENSOR ISSUE', datetime(2024, 1, 15, 11, 0)),
            # Both accepted - should be accepted
            ('IHC', 'IHC003', 'MO003', 'SKU003', '10', 'ACCEPTED', '', 'PASS', '', datetime(2024, 1, 15, 12, 0)),
            # No VQC, FT rejected - FT is final
            ('IHC', 'IHC004', 'MO004', 'SKU004', '7', '', '', 'FAIL', 'BATTERY ISSUE', datetime(2024, 1, 15, 13, 0)),
            # No data - pending
            ('IHC', 'IHC005', 'MO005', 'SKU005', '6', '', '', '', '', datetime(2024, 1, 15, 14, 0))
        ]
        
        report_config = {
            'date': '2024-01-15',
            'vendor': 'IHC'
        }
        
        response = client.post('/api/reports/daily',
                             data=json.dumps(report_config),
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        # Should have 1 accepted (IHC003), 3 rejected (IHC001, IHC002, IHC004), 1 pending (IHC005)
        assert data['totalReceived'] == 5
        assert data['totalAccepted'] == 1
        assert data['totalRejected'] == 3
        assert data['totalPending'] == 1
    
    def test_rejection_trends_categorization(self, client, monkeypatch):
        """Test rejection reason categorization in trends report."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

        def mock_get_conn():
            return mock_conn

        monkeypatch.setattr("app.routes.report_routes.get_db_connection", mock_get_conn)
        
        mock_cursor.fetchall.side_effect = [
            [(datetime(2024, 1, 1).date(),)],
            [
                (datetime(2024, 1, 1).date(), 'IHC', 'BLACK GLUE', '', 'REJECTED', ''),  # Assembly
                (datetime(2024, 1, 1).date(), 'IHC', 'MICRO BUBBLES', '', 'REJECTED', ''),  # Casting
                (datetime(2024, 1, 1).date(), 'IHC', '', 'SENSOR ISSUE', '', 'FAIL'),  # Functional
            ]
        ]
        
        trends_config = {
            'dateFrom': '2024-01-01',
            'dateTo': '2024-01-01',
            'vendor': 'IHC'
        }
        
        response = client.post('/api/reports/rejection-trends',
                             data=json.dumps(trends_config),
                             content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        # Should categorize rejections correctly
        assembly_data = [item for item in data['rejectionData'] if item['stage'] == 'ASSEMBLY']
        casting_data = [item for item in data['rejectionData'] if item['stage'] == 'CASTING']
        functional_data = [item for item in data['rejectionData'] if item['stage'] == 'FUNCTIONAL']
        
        assert len(assembly_data) > 0
        assert len(casting_data) > 0
        assert len(functional_data) > 0
        """Test CSV export of daily report."""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.fetchall.return_value = [
            ('2024-01-15', '3DE TECH', 'ABC123', 'MO001', 'SKU001', '8', 'ACCEPTED', '', 'PASS', '', 'Accepted', datetime(2024, 1, 15, 10, 0))
        ]
        
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
        assert 'daily_report_2024-01-15_all.csv' in response.headers['Content-Disposition']
        
        csv_content = response.data.decode('utf-8')
        assert 'Date,Vendor,Serial Number' in csv_content
        assert 'ABC123' in csv_content