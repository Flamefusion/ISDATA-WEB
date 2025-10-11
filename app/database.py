import os
from supabase import create_client, Client
from flask import session, g

def get_db_connection():
    """
    Gets a Supabase client for the current request.
    If a client is not available, it creates a new one and stores it in the request context 'g'.
    """
    if 'db_conn' not in g:
        supabase_config = session.get('supabase_config')
        if not supabase_config:
            raise ConnectionError("Supabase configuration not found in session. Please login.")
        
        try:
            url: str = supabase_config.get("supabaseUrl")
            key: str = supabase_config.get("supabaseAnonKey")
            g.db_conn: Client = create_client(url, key)
        except Exception as e:
            raise ConnectionError(f"Supabase connection failed: {e}") from e
            
    return g.db_conn

def close_db_connection(e=None):
    """This function is no longer needed with Supabase, but we keep it for compatibility with the app context teardown."""
    pass

def init_app(app):
    """Register the close_db_connection function to be called when the app context is torn down."""
    app.teardown_appcontext(close_db_connection)

def check_supabase_connection(url, key):

    """Attempts to establish a single Supabase connection with provided parameters."""

    try:

        create_client(url, key)

        return True, "Supabase connection successful!"

    except Exception as e:

        return False, f"Supabase connection failed: {e}"

def get_admin_db_connection():
    """
    Gets a Supabase client with the service role key for admin tasks.
    If a client is not available, it creates a new one and stores it in the request context 'g'.
    """
    if 'admin_db_conn' not in g:
        supabase_config = session.get('supabase_config')
        if not supabase_config or not supabase_config.get('supabaseServiceKey'):
            raise ConnectionError("Supabase Service Key not found in session. Please configure it.")
        
        try:
            url: str = supabase_config.get("supabaseUrl")
            key: str = supabase_config.get("supabaseServiceKey")
            g.admin_db_conn: Client = create_client(url, key)
        except Exception as e:
            raise ConnectionError(f"Supabase admin connection failed: {e}") from e
            
    return g.admin_db_conn