import time
import threading
import hashlib
from flask import jsonify, session

from .database import check_supabase_connection

# THIS IS A TEMPORARY AND INSECURE WAY TO STORE USER DATA
# In a real application, use a database and hashed passwords.
USER_CREDENTIALS = {
    "testuser": {
        "password": "password",
        "supabase_url": "https://<your-project-id>.supabase.co",
        "supabase_anon_key": "<your-anon-key>"
    }
}

class AuthManager:
    def __init__(self):
        self.ping_threads = {}
        self.stop_events = {}

    def _get_db_config_hash(self, supabase_config):
        """Creates a unique hash for a database configuration."""
        config_string = f"{supabase_config['supabaseUrl']}"
        return hashlib.md5(config_string.encode()).hexdigest()

    def login(self, username, password):
        user_data = USER_CREDENTIALS.get(username)
        if user_data and user_data["password"] == password:
            supabase_config = {
                "supabaseUrl": user_data["supabase_url"],
                "supabaseAnonKey": user_data["supabase_anon_key"]
            }
            
            connected, message = check_supabase_connection(**supabase_config)
            if connected:
                session['supabase_config'] = supabase_config
                self.start_pinging(supabase_config)
                return jsonify({"message": "Login successful"}), 200
            else:
                return jsonify({"message": f"Database connection failed: {message}"}), 500
        return jsonify({"message": "Invalid credentials"}), 401

    def logout(self):
        db_config = session.pop('db_config', None)
        if db_config:
            self.stop_pinging(db_config)
        return jsonify({"message": "Logout successful"}), 200

    def register(self, username, password, supabase_url, supabase_anon_key):
        if username in USER_CREDENTIALS:
            return jsonify({"message": "User already exists"}), 409

        USER_CREDENTIALS[username] = {
            "password": password, 
            "supabase_url": supabase_url,
            "supabase_anon_key": supabase_anon_key
        }
        return jsonify({"message": "User created successfully"}), 201

    def start_pinging(self, db_config):
        db_hash = self._get_db_config_hash(db_config)
        if db_hash not in self.ping_threads or not self.ping_threads[db_hash].is_alive():
            stop_event = threading.Event()
            self.stop_events[db_hash] = stop_event
            thread = threading.Thread(target=self.ping_db_periodically, args=(db_config, stop_event))
            thread.daemon = True
            thread.start()
            self.ping_threads[db_hash] = thread

    def stop_pinging(self, db_config):
        db_hash = self._get_db_config_hash(db_config)
        if db_hash in self.stop_events:
            self.stop_events[db_hash].set()
            if db_hash in self.ping_threads:
                self.ping_threads[db_hash].join()
                del self.ping_threads[db_hash]
            del self.stop_events[db_hash]

    def ping_db_periodically(self, supabase_config, stop_event):
        while not stop_event.is_set():
            try:
                from .database import get_db_connection
                db = get_db_connection()
                db.table('rings').select('id').limit(1).execute()
                print(f"Database ping successful for {supabase_config['supabaseUrl']}.")
            except Exception as e:
                print(f"Error pinging database {supabase_config['supabaseUrl']}: {e}")
            
            # Wait for 3 minutes, but check for stop event every second
            for _ in range(180):
                if stop_event.is_set():
                    break
                time.sleep(1)

auth_manager = AuthManager()