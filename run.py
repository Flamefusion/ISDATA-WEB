from app import create_app
from app.database import init_db_pool

# Create Flask app instance
app = create_app()

if __name__ == '__main__':
    # Initialize database connection pool
    init_db_pool()
    app.run(debug=True)