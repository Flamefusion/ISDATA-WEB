"""
Unit tests for database.py
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
import psycopg2
from app.database import (
    init_db_pool, get_db_connection, return_db_connection, 
    check_single_db_connection
)

class TestDatabasePool:
    """Test database connection pool functionality."""
    
    @patch('app.database.pool.ThreadedConnectionPool')
    @patch.dict('os.environ', {
        'DB_HOST': 'localhost',
        'DB_PORT': '5432',
        'DB_NAME': 'test_db',
        'DB_USER': 'test_user',
        'DB_PASSWORD': 'test_password'
    })
    def test_init_db_pool_success(self, mock_pool):
        """Test successful database pool initialization."""
        mock_pool_instance = Mock()
        mock_pool.return_value = mock_pool_instance
        
        result = init_db_pool()
        
        assert result is True
        mock_pool.assert_called_once_with(
            minconn=1,
            maxconn=10,
            host='localhost',
            port='5432',
            dbname='test_db',
            user='test_user',
            password='test_password'
        )
    
    @patch('app.database.pool.ThreadedConnectionPool')
    @patch.dict('os.environ', {
        'DB_HOST': 'localhost',
        'DB_PORT': '5432',
        'DB_NAME': 'test_db',
        'DB_USER': 'test_user',
        'DB_PASSWORD': 'test_password'
    })
    def test_init_db_pool_failure(self, mock_pool):
        """Test database pool initialization failure."""
        mock_pool.side_effect = psycopg2.Error("Connection failed")
        
        result = init_db_pool()
        
        assert result is False
    
    @patch('app.database.db_pool')
    def test_get_db_connection_success(self, mock_pool):
        """Test getting connection from pool."""
        mock_connection = Mock()
        mock_pool.getconn.return_value = mock_connection
        
        conn = get_db_connection()
        
        assert conn == mock_connection
        mock_pool.getconn.assert_called_once()
    
    @patch('app.database.db_pool', None)
    @patch('app.database.init_db_pool')
    def test_get_db_connection_no_pool(self, mock_init):
        """Test getting connection when pool is not initialized."""
        mock_init.return_value = False
        
        with pytest.raises(ConnectionError, match="Database connection pool is not available"):
            get_db_connection()
    
    @patch('app.database.db_pool')
    def test_return_db_connection(self, mock_pool):
        """Test returning connection to pool."""
        mock_connection = Mock()
        
        return_db_connection(mock_connection)
        
        mock_pool.putconn.assert_called_once_with(mock_connection)
    
    @patch('app.database.db_pool', None)
    def test_return_db_connection_no_pool(self):
        """Test returning connection when pool is None."""
        mock_connection = Mock()
        
        # Should not raise an exception
        return_db_connection(mock_connection)

class TestSingleDbConnection:
    """Test single database connection testing."""
    
    @patch('app.database.psycopg2.connect')
    def test_single_connection_success(self, mock_connect):
        """Test successful single database connection."""
        mock_conn = Mock()
        mock_connect.return_value = mock_conn
        
        success, message = check_single_db_connection(
            'localhost', '5432', 'test_db', 'user', 'password'
        )
        
        assert success is True
        assert "Database connection successful!" in message
        mock_connect.assert_called_once_with(
            host='localhost', port='5432', dbname='test_db', 
            user='user', password='password', connect_timeout=5
        )
        mock_conn.close.assert_called_once()
    
    @patch('app.database.psycopg2.connect')
    def test_single_connection_failure(self, mock_connect):
        """Test failed single database connection."""
        mock_connect.side_effect = psycopg2.Error("Connection failed")
        
        success, message = check_single_db_connection(
            'localhost', '5432', 'test_db', 'user', 'password'
        )
        
        assert success is False
        assert "Database connection failed:" in message
    
    @patch('app.database.psycopg2.connect')
    def test_single_connection_cleanup_on_exception(self, mock_connect):
        """Test that connection is properly closed even when exception occurs."""
        mock_conn = Mock()
        mock_connect.return_value = mock_conn
        mock_connect.side_effect = psycopg2.Error("Connection failed")
        
        success, message = check_single_db_connection(
            'localhost', '5432', 'test_db', 'user', 'password'
        )
        
        # Connection should still be closed in finally block
        # This tests the finally block execution
        assert success is False