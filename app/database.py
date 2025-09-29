import os
import psycopg2
from psycopg2 import pool
from flask import session, g

def get_db_connection():
    """
    Gets a connection from the pool for the current request.
    If a connection is not available, it creates a new one and stores it in the request context 'g'.
    """
    if 'db_conn' not in g:
        db_config = session.get('db_config')
        if not db_config:
            raise ConnectionError("Database configuration not found in session. Please login.")
        
        try:
            g.db_conn = psycopg2.connect(**db_config)
        except psycopg2.Error as e:
            raise ConnectionError(f"Database connection failed: {e}") from e
            
    return g.db_conn

def close_db_connection(e=None):
    """Closes the database connection at the end of the request."""
    db_conn = g.pop('db_conn', None)
    if db_conn is not None:
        db_conn.close()

def init_app(app):
    """Register the close_db_connection function to be called when the app context is torn down."""
    app.teardown_appcontext(close_db_connection)

def check_single_db_connection(host, port, dbname, user, password):
    """Attempts to establish a single database connection with provided parameters."""
    conn = None
    try:
        conn = psycopg2.connect(
            host=host, port=port, dbname=dbname, user=user, password=password, connect_timeout=5
        )
        return True, "Database connection successful!"
    except psycopg2.Error as e:
        return False, f"Database connection failed: {e}"
    finally:
        if conn:
            conn.close()