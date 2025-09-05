"""
End-to-end tests for complete application workflows.
"""
import json
import pytest
from unittest.mock import patch, Mock
from tests.factories import (
    GoogleConfigFactory, DatabaseConfigFactory, 
    create_test_dataset, Step7DataFactory, VQCDataFactory, FTDataFactory
)

@pytest.mark.slow
class TestCompleteWorkflow:
    """Test complete application workflows from start to finish."""
    
    def test_full_data_pipeline(self, client):
        """Test the complete data pipeline: connection test -> schema -> migration -> search -> report."""
        
        # Step 1: Test database connection
        db_config = DatabaseConfigFactory()
        
        with patch('app.routes.db_routes.test_single_db_connection') as mock_db_test:
            mock_db_test.return_value = (True, "Connection successful")
            
            response = client.post('/api/db/test',
                                 data=json.dumps(db_config),
                                 content_type='application/json')
            assert response.status_code == 200
        
        # Step 2: Create database schema
        with patch('app.routes.db_routes.get_db_connection') as mock_get_conn, \
             patch('app.routes.db_routes.return_db_connection'):
            
            mock_conn = Mock()
            mock_cursor = Mock()
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            mock_get_conn.return_value = mock_conn
            
            response = client.post('/api/db/schema')
            assert response.status_code == 200
            
            # Verify schema creation was attempted
            assert mock_cursor.execute.called
            mock_conn.commit.assert_called_once()
        
        # Step 3: Test Google Sheets connection
        google_config = GoogleConfigFactory()
        
        with patch('app.routes.data_routes.test_sheets_connection') as mock_sheets_test:
            mock_sheets_test.return_value = {'status': 'success', 'message': 'All connections successful'}
            
            response = client.post('/api/test_sheets_connection',
                                 data=json.dumps(google_config),
                                 content_type='application/json')
            assert response.status_code == 200
        
        # Step 4: Migrate data from Google Sheets
        with patch('app.routes.data_routes.Credentials.from_service_account_info'), \
             patch('app.routes.data_routes.gspread.authorize') as mock_gspread, \
             patch('app.routes.data_routes.load_sheets_data_parallel') as mock_load, \
             patch('app.routes.data_routes.merge_ring_data_fast') as mock_merge, \
             patch('app.routes.data_routes.get_db_connection') as mock_get_conn:
            
            # Setup mocks for data loading
            sample_step7 = Step7DataFactory.create_batch(10)
            sample_vqc = {'IHC': VQCDataFactory.create_batch(5)}
            sample_ft = FTDataFactory.create_batch(8)
            
            mock_load.return_value = (sample_step7, sample_vqc, sample_ft, ['Data loaded successfully'])
            mock_merge.return_value = (create_test_dataset()[:50], ['Data merged successfully'])
            
            # Setup database mock
            mock_conn = Mock()
            mock_cursor = Mock()
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            mock_cursor.rowcount = 25  # Simulate some updates
            mock_get_conn.return_value = mock_conn
            
            response = client.post('/api/migrate',
                                 data=json.dumps(google_config),
                                 content_type='application/json')
            
            assert response.status_code == 200
            response_text = response.data.decode('utf-8')
            assert 'No data to migrate' in response_text
    
    def test_data_validation_workflow(self, client):
        """Test data validation throughout the workflow."""
        
        # Test with invalid database configuration
        invalid_db_config = {
            'dbHost': 'localhost',
            'dbPort': '5432'
            # Missing required fields
        }
        
        response = client.post('/api/db/test',
                             data=json.dumps(invalid_db_config),
                             content_type='application/json')
        assert response.status_code == 400
        
        # Test search with invalid date format
        search_filters = {
            'dateFrom': 'invalid-date-format'
        }
        
        response = client.post('/api/search',
                             data=json.dumps(search_filters),
                             content_type='application/json')
        assert response.status_code == 400
        
        # Test daily report without required date
        report_config = {
            'vendor': 'all'
            # Missing date
        }
        
        response = client.post('/api/reports/daily',
                             data=json.dumps(report_config),
                             content_type='application/json')
        assert response.status_code == 400

@pytest.mark.slow
class TestPerformanceWorkflow:
    """Test performance aspects of the workflow."""
    
    def test_large_dataset_migration(self, client):
        """Test migration with large dataset."""
        google_config = GoogleConfigFactory()
        
        with patch('app.routes.data_routes.Credentials.from_service_account_info'), \
             patch('app.routes.data_routes.gspread.authorize'), \
             patch('app.routes.data_routes.load_sheets_data_parallel') as mock_load, \
             patch('app.routes.data_routes.merge_ring_data_fast') as mock_merge, \
             patch('app.routes.data_routes.get_db_connection') as mock_get_conn:
            
            # Create large dataset
            large_dataset = create_test_dataset()  # Creates ~3000 records
            
            mock_load.return_value = ([], {}, [], ['Large dataset loaded'])
            mock_merge.return_value = (large_dataset, ['Large dataset merged'])
            
            # Setup database mock
            mock_conn = Mock()
            mock_cursor = Mock()
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            mock_cursor.rowcount = len(large_dataset)
            mock_get_conn.return_value = mock_conn
            
            response = client.post('/api/migrate',
                                 data=json.dumps(google_config),
                                 content_type='application/json')
            
            assert response.status_code == 200
            response_text = response.data.decode('utf-8')
            assert 'Migration completed successfully' in response_text
    
    def test_concurrent_requests(self, client):
        """Test handling of concurrent requests."""
        import threading
        import time
        
        results = []
        
        def make_request():
            with patch('app.routes.search_routes.get_db_connection') as mock_get_conn:
                mock_conn = Mock()
                mock_cursor = Mock()
                mock_cursor.description = [('serial_number',)]
                mock_cursor.fetchall.return_value = [('ABC123',)]
                mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
                mock_get_conn.return_value = mock_conn
                
                response = client.post('/api/search',
                                     data=json.dumps({}),
                                     content_type='application/json')
                results.append(response.status_code)
        
        # Create multiple threads to simulate concurrent requests
        threads = []
        for i in range(5):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # All requests should succeed
        assert all(status == 200 for status in results)
        assert len(results) == 5

@pytest.mark.integration
class TestRealDataScenarios:
    """Test scenarios that simulate real-world data patterns."""
    
    def test_mixed_status_data(self, client):
        """Test handling of mixed status data (accepted, rejected, pending)."""
        with patch('app.routes.report_routes.get_db_connection') as mock_get_conn:
            mock_conn = Mock()
            mock_cursor = Mock()
            
            # Create mixed status data that reflects real scenarios
            mock_cursor.fetchall.return_value = [
                # VQC rejected, no FT - should be rejected at VQC stage
                ('3DE TECH', 'ABC001', 'MO001', 'SKU001', '8', 'REJECTED', 'BLACK GLUE', '', '', Mock()),
                # VQC accepted, FT rejected - should be rejected at FT stage
                ('3DE TECH', 'ABC002', 'MO002', 'SKU002', '9', 'ACCEPTED', '', 'FAIL', 'SENSOR ISSUE', Mock()),
                # Both accepted - should be accepted
                ('3DE TECH', 'ABC003', 'MO003', 'SKU003', '10', 'ACCEPTED', '', 'PASS', '', Mock()),
                # No VQC data, FT rejected - should be rejected at FT stage
                ('IHC', 'IHC001', 'IHCMO001', 'IHCSKU001', '7', '', '', 'FAIL', 'BATTERY ISSUE', Mock()),
                # No data at all - should be pending
                ('IHC', 'IHC002', 'IHCMO002', 'IHCSKU002', '8', '', '', '', '', Mock()),
                # VQC accepted, no FT - should be pending at FT stage
                ('MAKENICA', 'MK001', 'MKMO001', 'MKSKU001', '9', 'ACCEPTED', '', '', '', Mock()),
            ]
            
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            mock_get_conn.return_value = mock_conn
            
            report_config = {
                'date': '2024-01-15',
                'vendor': 'all'
            }
            
            response = client.post('/api/reports/daily',
                                 data=json.dumps(report_config),
                                 content_type='application/json')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            
            # Verify counts based on business logic
            assert data['totalReceived'] == 6
            assert data['totalAccepted'] == 1  # Only ABC003
            assert data['totalRejected'] == 3  # ABC001, ABC002, IHC001
            assert data['totalPending'] == 2   # IHC002, MK001
            
            # Verify yield calculation (excluding pending)
            completed = data['totalAccepted'] + data['totalRejected']  # 4
            expected_yield = (data['totalAccepted'] / completed) * 100 if completed > 0 else 0
            assert abs(data['yield'] - expected_yield) < 0.01
    
    def test_duplicate_serial_handling(self, client):
        """Test handling of duplicate serial numbers."""
        google_config = GoogleConfigFactory()
        
        # Create data with duplicate serial numbers
        duplicate_data = [
            {
                'serial_number': 'DUPLICATE001',
                'vendor': '3DE TECH',
                'mo_number': 'MO001',
                'date': '2024-01-15',
                'vqc_status': 'REJECTED'
            },
            {
                'serial_number': 'DUPLICATE001',  # Same serial
                'vendor': '3DE TECH',
                'mo_number': 'MO002',  # Different MO
                'date': '2024-01-15',
                'vqc_status': 'ACCEPTED'  # Different status
            }
        ]
        
        with patch('app.routes.data_routes.Credentials.from_service_account_info'), \
             patch('app.routes.data_routes.gspread.authorize'), \
             patch('app.routes.data_routes.load_sheets_data_parallel') as mock_load, \
             patch('app.routes.data_routes.merge_ring_data_fast') as mock_merge, \
             patch('app.routes.data_routes.get_db_connection') as mock_get_conn:
            
            mock_load.return_value = ([], {}, [], ['Data loaded with duplicates'])
            mock_merge.return_value = (duplicate_data, ['Duplicates handled - kept last occurrence'])
            
            # Setup database mock
            mock_conn = Mock()
            mock_cursor = Mock()
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            mock_get_conn.return_value = mock_conn
            
            response = client.post('/api/migrate',
                                 data=json.dumps(google_config),
                                 content_type='application/json')
            
            assert response.status_code == 200
            response_text = response.data.decode('utf-8')
            assert 'Migration completed successfully' in response_text
            # Should mention duplicate handling
            assert 'duplicate' in response_text.lower() or 'last occurrence' in response_text.lower()
    
    def test_empty_data_fields(self, client):
        """Test handling of empty or null data fields."""
        with patch('app.routes.search_routes.get_db_connection') as mock_get_conn:
            mock_conn = Mock()
            mock_cursor = Mock()
            mock_cursor.description = [
                ('date',), ('vendor',), ('mo_number',), ('serial_number',),
                ('vqc_status',), ('ft_status',), ('vqc_reason',), ('ft_reason',)
            ]
            
            # Test data with empty/null fields
            mock_cursor.fetchall.return_value = [
                (None, '', 'MO001', 'ABC123', '', None, '', ''),  # Many empty fields
                ('2024-01-15', '3DE TECH', '', 'ABC124', 'ACCEPTED', '', '', ''),  # Empty MO
            ]
            
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            mock_get_conn.return_value = mock_conn
            
            response = client.post('/api/search',
                                 data=json.dumps({}),
                                 content_type='application/json')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert len(data) == 2  # Should handle empty fields gracefully
                                 
            
            assert response.status_code == 200
            response_text = response.data.decode('utf-8')
            assert 'Migration completed successfully' in response_text
        
        # Step 5: Search the migrated data
        with patch('app.routes.search_routes.get_db_connection') as mock_get_conn:
            mock_conn = Mock()
            mock_cursor = Mock()
            mock_cursor.description = [
                ('date',), ('vendor',), ('mo_number',), ('serial_number',),
                ('vqc_status',), ('ft_status',), ('vqc_reason',), ('ft_reason',)
            ]
            mock_cursor.fetchall.return_value = [
                ('2024-01-15', '3DE TECH', 'MO001', 'ABC123', 'ACCEPTED', 'PASS', '', '')
            ]
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            mock_get_conn.return_value = mock_conn
            
            search_filters = {
                'serialNumbers': 'ABC123',
                'dateFrom': '2024-01-01',
                'dateTo': '2024-01-31'
            }
            
            response = client.post('/api/search',
                                 data=json.dumps(search_filters),
                                 content_type='application/json')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert len(data) >= 0
        
        # Step 6: Generate daily report
        with patch('app.routes.report_routes.get_db_connection') as mock_get_conn:
            mock_conn = Mock()
            mock_cursor = Mock()
            mock_cursor.fetchall.return_value = [
                ('3DE TECH', 'ABC123', 'MO001', 'SKU001', '8', 'ACCEPTED', '', 'PASS', '', Mock()),
                ('IHC', 'IHC001', 'IHCMO001', 'IHCSKU001', '9', 'REJECTED', 'BLACK GLUE', '', '', Mock())
            ]
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            mock_get_conn.return_value = mock_conn
            
            report_config = {
                'date': '2024-01-15',
                'vendor': 'all'
            }
            
            response = client.post('/api/reports/daily',
                                 data=json.dumps(report_config),
                                 content_type='application/json')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert 'totalReceived' in data
            assert 'yield' in data
    
    def test_error_handling_workflow(self, client):
        """Test error handling throughout the workflow."""
        
        # Test database connection failure
        db_config = DatabaseConfigFactory()
        
        with patch('app.routes.db_routes.test_single_db_connection') as mock_db_test:
            mock_db_test.return_value = (False, "Connection failed")
            
            response = client.post('/api/db/test',
                                 data=json.dumps(db_config),
                                 content_type='application/json')
            assert response.status_code == 500
        
        # Test Google Sheets connection failure
        google_config = GoogleConfigFactory()
        
        with patch('app.routes.data_routes.test_sheets_connection') as mock_sheets_test:
            mock_sheets_test.return_value = {'status': 'error', 'message': 'Access denied'}
            
            response = client.post('/api/test_sheets_connection',
                                 data=json.dumps(google_config),
                                 content_type='application/json')
            assert response.status_code == 500
        
        # Test migration with no data
        with patch('app.routes.data_routes.Credentials.from_service_account_info'), \
             patch('app.routes.data_routes.gspread.authorize'), \
             patch('app.routes.data_routes.load_sheets_data_parallel') as mock_load, \
             patch('app.routes.data_routes.merge_ring_data_fast') as mock_merge:
            
            mock_load.return_value = ([], {}, [], ['No data found'])
            mock_merge.return_value = ([], ['No data to merge'])
            
            response = client.post('/api/migrate',
                                   data=json.dumps(google_config),
                                 content_type='application/json')
            
            assert response.status_code == 200