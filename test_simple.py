#!/usr/bin/env python3
"""
Simple test to verify basic functionality works.
Run this to debug the main issues before running the full test suite.
"""
import os
import sys
import json
from unittest.mock import patch, Mock, MagicMock

# Add the current directory to Python path
sys.path.insert(0, os.path.abspath('.'))

def test_app_creation():
    """Test that the Flask app can be created."""
    try:
        from app import create_app
        app = create_app()
        print("✅ Flask app created successfully")
        return True
    except Exception as e:
        print(f"❌ Flask app creation failed: {e}")
        return False

def test_database_mock():
    """Test that database mocking works."""
    try:
        with patch('app.database.get_db_connection') as mock_get_conn, \
             patch('app.database.return_db_connection') as mock_return_conn:
            
            mock_conn = MagicMock()
            mock_cursor = MagicMock()
            
            # Properly mock the context manager
            mock_conn.cursor.return_value = mock_cursor
            mock_conn.cursor.return_value.__enter__ = Mock(return_value=mock_cursor)
            mock_conn.cursor.return_value.__exit__ = Mock(return_value=None)
            
            mock_get_conn.return_value = mock_conn
            
            # Test the mock works
            from app.database import get_db_connection
            conn = get_db_connection()
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchall()
            
            print("✅ Database mocking works")
            return True
    except Exception as e:
        print(f"❌ Database mocking failed: {e}")
        return False

def test_simple_route():
    """Test a simple route with mocked database."""
    try:
        from app import create_app
        
        app = create_app()
        client = app.test_client()
        
        with patch('app.database.get_db_connection') as mock_get_conn, \
             patch('app.database.return_db_connection'):
            
            mock_conn = MagicMock()
            mock_cursor = MagicMock()
            
            # Mock database response
            mock_cursor.description = [('id',), ('serial_number',)]
            mock_cursor.fetchall.return_value = [(1, 'ABC123')]
            
            # Setup context manager properly
            mock_conn.cursor.return_value.__enter__ = Mock(return_value=mock_cursor)
            mock_conn.cursor.return_value.__exit__ = Mock(return_value=None)
            
            mock_get_conn.return_value = mock_conn
            
            response = client.get('/api/data')
            
            if response.status_code == 200:
                print("✅ Simple route test passed")
                return True
            else:
                print(f"❌ Route returned {response.status_code}: {response.data.decode()}")
                return False
            
    except Exception as e:
        print(f"❌ Simple route test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_database_test_route():
    """Test the database test route."""
    try:
        from app import create_app
        
        app = create_app()
        client = app.test_client()
        
        with patch('app.routes.db_routes.test_single_db_connection') as mock_test:
            mock_test.return_value = (True, "Database connection successful!")
            
            db_config = {
                'dbHost': 'localhost',
                'dbPort': '5432',
                'dbName': 'test_rings_db',
                'dbUser': 'test_user',
                'dbPassword': 'test_password'
            }
            
            response = client.post('/api/db/test',
                                 data=json.dumps(db_config),
                                 content_type='application/json')
            
            if response.status_code == 200:
                print("✅ Database test route passed")
                return True
            else:
                print(f"❌ Database test route returned {response.status_code}: {response.data.decode()}")
                return False
                
    except Exception as e:
        print(f"❌ Database test route failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_search_route():
    """Test the search route with proper mocking."""
    try:
        from app import create_app
        
        app = create_app()
        client = app.test_client()
        
        with patch('app.routes.search_routes.get_db_connection') as mock_get_conn, \
             patch('app.routes.search_routes.return_db_connection'):
            
            mock_conn = MagicMock()
            mock_cursor = MagicMock()
            
            # Mock the cursor properly
            mock_cursor.description = [
                ('date',), ('vendor',), ('serial_number',), ('vqc_status',)
            ]
            mock_cursor.fetchall.return_value = [
                ('2024-01-15', '3DE TECH', 'ABC123', 'ACCEPTED')
            ]
            
            # Setup context manager
            mock_conn.cursor.return_value.__enter__ = Mock(return_value=mock_cursor)
            mock_conn.cursor.return_value.__exit__ = Mock(return_value=None)
            
            mock_get_conn.return_value = mock_conn
            
            search_filters = {'serialNumbers': 'ABC123'}
            
            response = client.post('/api/search',
                                 data=json.dumps(search_filters),
                                 content_type='application/json')
            
            if response.status_code == 200:
                print("✅ Search route test passed")
                return True
            else:
                print(f"❌ Search route returned {response.status_code}: {response.data.decode()}")
                return False
                
    except Exception as e:
        print(f"❌ Search route test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all simple tests."""
    print("🧪 Running simple tests to debug issues...\n")
    
    tests = [
        ("App Creation", test_app_creation),
        ("Database Mocking", test_database_mock),
        ("Simple Route", test_simple_route),
        ("Database Test Route", test_database_test_route),
        ("Search Route", test_search_route)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n📋 {test_name}:")
        if test_func():
            passed += 1
        print("-" * 50)
    
    print(f"\n🎯 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All simple tests passed! You can now run the full test suite.")
        return True
    else:
        print("❌ Some tests failed. Fix these issues before running the full suite.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)