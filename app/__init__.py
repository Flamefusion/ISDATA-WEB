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
    app.secret_key = os.urandom(24)
    CORS(app, supports_credentials=True)
    
    
    
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
    from app.routes.home_routes import home_bp
    from app.routes.auth_routes import auth_bp

    app.register_blueprint(db_bp, url_prefix='/api')
    app.register_blueprint(data_bp, url_prefix='/api')
    app.register_blueprint(search_bp, url_prefix='/api')
    app.register_blueprint(report_bp, url_prefix='/api')
    app.register_blueprint(home_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api')

    from app import database
    database.init_app(app)

    for rule in app.url_map.iter_rules():
        print(rule)    
    return app