import logging
from app import create_app
from waitress import serve

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Create Flask app instance
app = create_app()

if __name__ == '__main__':
    serve(app, host='0.0.0.0', port=5000)