import os
from supabase import create_client, Client
from flask import session, g

def get_db_connection():
    """
    Gets a Supabase client for the current request.
    If a client is not available, it creates a new one and stores it in the request context 'g'.
    """
    if 'db_conn' not in g:
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_KEY")
        g.db_conn: Client = create_client(url, key)
            
    return g.db_conn



def check_single_db_connection(url, key):
    """Attempts to establish a single database connection with provided parameters."""
    try:
        supabase: Client = create_client(url, key)
        # Perform a simple query to check the connection
        response = supabase.table('users').select("id").limit(1).execute()
        return True, "Database connection successful!"
    except Exception as e:
        return False, f"Database connection failed: {e}"


def close_db(e=None):
    """Closes the database connection."""
    # The Supabase client doesn't have a close() method in the same way
    # a traditional DB-API 2.0 connection does. Connection pooling and
    # resource management are handled by the underlying libraries (httpx).
    # This function is here to fit the Flask application factory pattern.
    g.pop('db_conn', None)

def init_app(app):
    """Initializes the application with the database."""
    app.teardown_appcontext(close_db)