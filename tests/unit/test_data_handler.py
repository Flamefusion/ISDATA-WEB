"""
Unit tests for data_handler.py
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
import pandas as pd
from app.data_handler import (
    find_column, merge_ring_data_fast, load_sheet_data,
    load_sheets_data_parallel, test_sheets_connection
)

class TestFindColumn:
    """Test the find_column utility function."""
    
    def test_find_column_exact_match(self):
        df = pd.DataFrame({'Serial Number': [1, 2], 'Name': ['A', 'B']})
        result = find_column(df, 'Serial Number')
        assert result == 'Serial Number'
    
    def test_find_column_case_insensitive(self):
        df = pd.DataFrame({'SERIAL_NUMBER': [1, 2], 'name': ['A', 'B']})
        result = find_column(df, 'serial_number')
        assert result == 'SERIAL_NUMBER'
    
    def test_find_column_with_patterns_list(self):
        df = pd.DataFrame({'UID': [1, 2], 'Name': ['A', 'B']})
        result = find_column(df, ['serial', 'uid'])
        assert result == 'UID'
    
    def test_find_column_not_found(self):
        df = pd.DataFrame({'Name': ['A', 'B'], 'Age': [1, 2]})
        result = find_column(df, 'serial')
        assert result is None

class TestMergeRingDataFast:
    """Test the merge_ring_data_fast function."""
    
    def test_merge_empty_step7_data(self):
        result, logs = merge_ring_data_fast([], {}, [])
        assert result == []
        assert "No Step 7 data provided to merge." in logs
    
    def test_merge_with_valid_data(self, sample_step7_data, sample_vqc_data, sample_ft_data):
        result, logs = merge_ring_data_fast(sample_step7_data, sample_vqc_data, sample_ft_data)
        
        assert len(result) > 0
        assert "Successfully merged" in str(logs)
        
        # Check if data structure is correct
        first_record = result[0]
        expected_keys = ['vendor', 'serial_number', 'mo_number', 'sku', 'ring_size']
        for key in expected_keys:
            assert key in first_record
    
    def test_merge_removes_duplicates(self):
        # Create test data with duplicates
        step7_data = [
            {
                'logged_timestamp': '2024-01-15',
                'UID': 'ABC123',
                '3DE MO': 'MO001',
                'SKU': 'SKU001',
                'SIZE': '8'
            },
            {
                'logged_timestamp': '2024-01-15',
                'UID': 'ABC123',  # Duplicate
                '3DE MO': 'MO002',
                'SKU': 'SKU002',
                'SIZE': '9'
            }
        ]
        
        result, logs = merge_ring_data_fast(step7_data, {}, [])
        
        # Should have only one record after deduplication
        abc123_records = [r for r in result if r['serial_number'] == 'ABC123']
        assert len(abc123_records) == 1
        
        # Should keep the last occurrence
        assert abc123_records[0]['mo_number'] == 'MO002'
    
    def test_merge_with_missing_serial_numbers(self):
        step7_data = [
            {
                'logged_timestamp': '2024-01-15',
                'UID': '',  # Empty serial number
                '3DE MO': 'MO001',
                'SKU': 'SKU001',
                'SIZE': '8'
            }
        ]
        
        result, logs = merge_ring_data_fast(step7_data, {}, [])
        assert len(result) == 0  # Should filter out empty serial numbers

class TestLoadSheetData:
    """Test loading data from Google Sheets."""
    
    @patch('app.data_handler.gspread')
    def test_load_step7_sheet_success(self, mock_gspread):
        # Setup mock
        mock_gc = Mock()
        mock_sheet = Mock()
        mock_worksheet = Mock()
        
        mock_sheet.title = 'Test Vendor Sheet'
        mock_sheet.worksheet.return_value = mock_worksheet
        mock_worksheet.get_all_values.return_value = [
            ['UID', '3DE MO', 'SKU', 'SIZE'],
            ['ABC123', 'MO001', 'SKU001', '8'],
            ['DEF456', 'MO002', 'SKU002', '9']
        ]
        mock_gc.open_by_url.return_value = mock_sheet
        
        config = {'vendorDataUrl': 'https://test.url'}
        
        sheet_type, data, logs = load_sheet_data('step7', config, mock_gc)
        
        assert sheet_type == 'step7'
        assert len(data) == 2
        assert data[0]['UID'] == 'ABC123'
        assert "Loaded 2 records from step7" in logs
    
    @patch('app.data_handler.gspread')
    def test_load_vqc_sheet_success(self, mock_gspread):
        mock_gc = Mock()
        mock_sheet = Mock()
        
        # Mock different worksheets for different vendors
        mock_ihc_ws = Mock()
        mock_ihc_ws.get_all_values.return_value = [
            ['Serial', 'Status', 'Reason'],
            ['IHC001', 'ACCEPTED', ''],
            ['IHC002', 'REJECTED', 'BLACK GLUE']
        ]
        
        mock_3de_ws = Mock()
        mock_3de_ws.get_all_values.return_value = [
            ['UID', 'Status', 'Reason'],
            ['3DE001', 'ACCEPTED', '']
        ]
        
        mock_makenica_ws = Mock()
        mock_makenica_ws.get_all_values.return_value = [
            ['Serial', 'Status', 'Reason'],
            ['MK001', 'REJECTED', 'SENSOR ISSUE']
        ]
        
        def mock_worksheet(name):
            if name == 'IHC':
                return mock_ihc_ws
            elif name == '3DE TECH':
                return mock_3de_ws
            elif name == 'MAKENICA':
                return mock_makenica_ws
            raise Exception(f"Worksheet {name} not found")
        
        mock_sheet.worksheet.side_effect = mock_worksheet
        mock_gc.open_by_url.return_value = mock_sheet
        
        config = {'vqcDataUrl': 'https://test.url'}
        
        sheet_type, data, logs = load_sheet_data('vqc', config, mock_gc)
        
        assert sheet_type == 'vqc'
        assert 'IHC' in data
        assert '3DE TECH' in data
        assert 'MAKENICA' in data
        assert len(data['IHC']) == 2
        assert len(data['3DE TECH']) == 1
        assert len(data['MAKENICA']) == 1
    
    def test_load_sheet_data_exception_handling(self):
        mock_gc = Mock()
        mock_gc.open_by_url.side_effect = Exception("Connection failed")
        
        config = {'vendorDataUrl': 'https://test.url'}
        
        sheet_type, data, logs = load_sheet_data('step7', config, mock_gc)
        
        assert sheet_type == 'step7'
        assert data == []
        assert any('ERROR loading step7 data' in log for log in logs)

class TestLoadSheetsDataParallel:
    """Test parallel loading of sheets data."""
    
    @patch('app.data_handler.load_sheet_data')
    def test_parallel_loading_success(self, mock_load_sheet):
        # Mock the load_sheet_data function to return test data
        def side_effect(sheet_type, config, gc):
            if sheet_type == 'step7':
                return 'step7', [{'UID': 'ABC123'}], ['Step7 loaded']
            elif sheet_type == 'vqc':
                return 'vqc', {'IHC': [{'Serial': 'IHC001'}]}, ['VQC loaded']
            elif sheet_type == 'ft':
                return 'ft', [{'UID': 'ABC123'}], ['FT loaded']
        
        mock_load_sheet.side_effect = side_effect
        
        config = {
            'vendorDataUrl': 'https://test-vendor.url',
            'vqcDataUrl': 'https://test-vqc.url',
            'ftDataUrl': 'https://test-ft.url'
        }
        mock_gc = Mock()
        
        step7_data, vqc_data, ft_data, all_logs = load_sheets_data_parallel(config, mock_gc)
        
        assert len(step7_data) == 1
        assert 'IHC' in vqc_data
        assert len(ft_data) == 1
        assert len(all_logs) == 3  # Should have logs from all three sheets

class TestSheetsConnection:
    """Test Google Sheets connection testing."""
    
    @patch('app.data_handler.Credentials.from_service_account_info')
    @patch('app.data_handler.gspread.authorize')
    def test_sheets_connection_success(self, mock_auth, mock_creds, google_config):
        # Setup mocks
        mock_gc = Mock()
        mock_sheet = Mock()
        mock_sheet.title = 'Test Sheet'
        mock_gc.open_by_url.return_value = mock_sheet
        mock_auth.return_value = mock_gc
        
        result = test_sheets_connection(google_config)
        
        assert result['status'] == 'success'
        assert 'Connected to' in result['message']
    
    @patch('app.data_handler.Credentials.from_service_account_info')
    @patch('app.data_handler.gspread.authorize')
    def test_sheets_connection_failure(self, mock_auth, mock_creds, google_config):
        # Setup mock to fail
        mock_gc = Mock()
        mock_gc.open_by_url.side_effect = Exception("Access denied")
        mock_auth.return_value = mock_gc
        
        result = test_sheets_connection(google_config)
        
        assert result['status'] == 'error'
        assert 'FAILED' in result['message']
    
    def test_sheets_connection_no_urls(self):
        config = {'serviceAccountContent': {}}
        
        result = test_sheets_connection(config)
        
        assert result['status'] == 'error'
        assert result['status'] == 'error'
    
    def test_sheets_connection_invalid_service_account(self):
        config = {
            'serviceAccountContent': None,
            'vendorDataUrl': 'https://test.url'
        }
        
        result = test_sheets_connection(config)
        
        assert result['status'] == 'error'
        assert 'Invalid or missing service account' in result['message']