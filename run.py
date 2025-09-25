from app import create_app
from app.database import init_db_pool
import os
import argparse

# Create Flask app instance
app = create_app()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Run the backend server.')
    parser.add_argument('--host', required=True, help='Database host')
    parser.add_argument('--database', required=True, help='Database name')
    parser.add_argument('--user', required=True, help='Database user')
    parser.add_argument('--password', required=True, help='Database password')
    parser.add_argument('--port', default='5432', help='Database port')
    args = parser.parse_args()

    # Initialize database connection pool
    if not os.getenv('TESTING'):
        init_db_pool(
            host=args.host,
            port=args.port,
            dbname=args.database,
            user=args.user,
            password=args.password
        )
    app.run(debug=False, port=5000)