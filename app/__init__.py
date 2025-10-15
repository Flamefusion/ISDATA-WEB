import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

def create_app():
    """Application factory pattern."""
    load_dotenv()
    # Create Flask app
    app = Flask(__name__)
    secret_key = os.environ.get('SECRET_KEY')
    if not secret_key:
        app.logger.warning("SECRET_KEY not set, using a temporary random key. Sessions will not persist across restarts.")
        secret_key = os.urandom(24).hex()
    app.secret_key = secret_key

    # Load Supabase configuration
    app.config['SUPABASE_URL'] = os.environ.get('SUPABASE_URL')
    app.config['SUPABASE_SERVICE_KEY'] = os.environ.get('SUPABASE_SERVICE_KEY')
    app.config['SUPABASE_JWT_SECRET'] = os.environ.get('SUPABASE_JWT_SECRET')

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
    with app.app_context():
        database.init_supabase_client()

    for rule in app.url_map.iter_rules():
        print(rule)    
    return app