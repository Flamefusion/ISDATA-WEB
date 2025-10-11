from supabase import create_client, Client
from flask import current_app

# Global Supabase client instance
supabase: Client = None

def init_supabase_client():
    """
    Initializes the global Supabase client using configuration
    from the Flask app context.
    """
    global supabase
    url = current_app.config.get("SUPABASE_URL")
    key = current_app.config.get("SUPABASE_SERVICE_KEY")
    
    if not all([url, key]):
        current_app.logger.warning("Supabase client not initialized. URL or Service Key is missing.")
        return

    try:
        supabase = create_client(url, key)
        current_app.logger.info("Supabase client initialized successfully.")
    except Exception as e:
        current_app.logger.error(f"Failed to initialize Supabase client: {e}")
