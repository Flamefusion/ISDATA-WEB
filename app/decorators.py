from functools import wraps
from flask import request, jsonify, current_app
from app.database import supabase

def token_required(f):
    """Decorator to protect routes with JWT authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            try:
                token = request.headers['Authorization'].split(" ")[1]
            except IndexError:
                return jsonify({'message': 'Bearer token malformed'}), 401

        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        try:
            # Validate the token with Supabase
            user_response = supabase.auth.get_user(token)
            current_user = user_response.user
            if not current_user:
                raise Exception("Invalid user from token")
        except Exception as e:
            current_app.logger.error(f"Token validation error: {e}")
            return jsonify({'message': 'Token is invalid or expired'}), 401
        
        # Pass the user object to the decorated function
        return f(current_user, *args, **kwargs)

    return decorated_function
