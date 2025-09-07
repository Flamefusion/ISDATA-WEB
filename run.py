from app import create_app
from app.database import init_db_pool
import os
import logging
from logging.handlers import RotatingFileHandler

# Create Flask app instance
app = create_app()

# Initialize database connection pool
if not os.getenv('TESTING'):
    init_db_pool()

# Configure logging
if not app.debug:
    # Create a log directory if it doesn't exist
    if not os.path.exists('logs'):
        os.mkdir('logs')
    
    # Rotating file handler
    file_handler = RotatingFileHandler('logs/app.log', maxBytes=10240, backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    
    app.logger.setLevel(logging.INFO)
    app.logger.info('Application startup')

if __name__ == '__main__':
    # Use Gunicorn's logger in production
    if 'gunicorn' in os.environ.get('SERVER_SOFTWARE', ''):
        gunicorn_logger = logging.getLogger('gunicorn.error')
        app.logger.handlers = gunicorn_logger.handlers
        app.logger.setLevel(gunicorn_logger.level)
        
    app.run(debug=False,host='0.0.0.0', port=5000)