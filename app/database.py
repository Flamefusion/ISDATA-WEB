import os
import psycopg2
from psycopg2 import pool
from urllib.parse import urlparse

# Global database connection pool
db_pool = None

def init_db_pool():
    """Initializes the database connection pool."""
    global db_pool
    if db_pool:
        db_pool.closeall()
    try:
        database_url = os.getenv('DATABASE_URL')
        if database_url:
            # Render provides a DATABASE_URL that might not be a full DSN.
            # We will parse it and build a proper DSN.
            result = urlparse(database_url)
            dsn = (
                f"postgresql://{result.user}:{result.password}@"
                f"{result.hostname}:{result.port}/{result.path[1:]}"
            )
            db_pool = pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=10,
                dsn=dsn
            )
        else:
            # Fallback to individual variables for local development
            db_pool = pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=10,
                host=os.getenv('DB_HOST'),
                port=os.getenv('DB_PORT'),
                dbname=os.getenv('DB_NAME'),
                user=os.getenv('DB_USER'),
                password=os.getenv('DB_PASSWORD')
            )
        print("Database connection pool initialized successfully.")
        return True
    except (psycopg2.Error, ValueError) as e:
        print(f"Error initializing database pool: {e}")
        db_pool = None
        return False

def get_db_connection():
    """Gets a connection from the pool."""
    if not db_pool:
        if not init_db_pool():
            raise ConnectionError("Database connection pool is not available.")
    return db_pool.getconn()

def return_db_connection(conn):
    """Returns a connection to the pool."""
    if db_pool:
        db_pool.putconn(conn)

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