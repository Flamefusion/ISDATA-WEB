import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

def create_app():
    """Application factory pattern."""
    # Load environment variables
    load_dotenv()
    
    # Create Flask app
    app = Flask(__name__)
    CORS(app)
    
    @app.route('/')
    def health_check():
        return {"status": "ok", "message": "Flask app is running"}
    
    @app.route('/health')
    def health():
        return {"status": "healthy"}
    # This is handled in run.py, so it can be removed from the app factory
    # if not os.getenv('TESTING'):
    #     try:
    #         from .database import init_db_pool
    #         init_db_pool()
    #     except Exception as e:
    #         print(f"Warning: Database pool initialization failed: {e}")
    
    # Error handling
    @app.errorhandler(Exception)
    def handle_exception(e):
        """Generic error handler."""
        app.logger.error(f"An error occurred: {e}", exc_info=True)
        return jsonify(error=str(e)), 500
    
    # Register blueprints
    from app.routes.db_routes import db_bp
    from app.routes.data_routes import data_bp
    from app.routes.search_routes import search_bp
    from app.routes.report_routes import report_bp
    
    app.register_blueprint(db_bp, url_prefix='/api')
    app.register_blueprint(data_bp, url_prefix='/api')
    app.register_blueprint(search_bp, url_prefix='/api')
    app.register_blueprint(report_bp, url_prefix='/api')
    
    return app