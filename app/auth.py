import time
import threading
import hashlib
from flask import jsonify, session
import psycopg2
from .database import check_single_db_connection

# THIS IS A TEMPORARY AND INSECURE WAY TO STORE USER DATA
# In a real application, use a database and hashed passwords.
USER_CREDENTIALS = {
    "testuser": {
        "password": "password",
        "db_host": "localhost",
        "db_port": "5432",
        "db_name": "fqc_rings",
        "db_user": "flamefusion",
        "db_password": "0702"
    }
}

class AuthManager:
    def __init__(self):
        self.ping_threads = {}
        self.stop_events = {}

    def _get_db_config_hash(self, db_config):
        """Creates a unique hash for a database configuration."""
        config_string = f"{db_config['host']}:{db_config['port']}:{db_config['dbname']}:{db_config['user']}"
        return hashlib.md5(config_string.encode()).hexdigest()

    def login(self, username, password):
        user_data = USER_CREDENTIALS.get(username)
        if user_data and user_data["password"] == password:
            db_config = {
                "host": user_data["db_host"],
                "port": user_data["db_port"],
                "dbname": user_data["db_name"],
                "user": user_data["db_user"],
                "password": user_data["db_password"]
            }
            
            connected, message = check_single_db_connection(**db_config)
            if connected:
                session['db_config'] = db_config
                self.start_pinging(db_config)
                return jsonify({"message": "Login successful"}), 200
            else:
                return jsonify({"message": f"Database connection failed: {message}"}), 500
        return jsonify({"message": "Invalid credentials"}), 401

    def logout(self):
        db_config = session.pop('db_config', None)
        if db_config:
            self.stop_pinging(db_config)
        return jsonify({"message": "Logout successful"}), 200

    def register(self, username, password, db_host, db_port, db_name, db_user, db_password):
        if username in USER_CREDENTIALS:
            return jsonify({"message": "User already exists"}), 409

        USER_CREDENTIALS[username] = {
            "password": password, 
            "db_host": db_host,
            "db_port": db_port,
            "db_name": db_name,
            "db_user": db_user,
            "db_password": db_password
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

    def ping_db_periodically(self, db_config, stop_event):
        while not stop_event.is_set():
            try:
                conn = psycopg2.connect(**db_config)
                with conn.cursor() as cursor:
                    cursor.execute("SELECT 1")
                conn.close()
                print(f"Database ping successful for {db_config['dbname']}.")
            except Exception as e:
                print(f"Error pinging database {db_config['dbname']}: {e}")
            
            # Wait for 3 minutes, but check for stop event every second
            for _ in range(180):
                if stop_event.is_set():
                    break
                time.sleep(1)

auth_manager = AuthManager()