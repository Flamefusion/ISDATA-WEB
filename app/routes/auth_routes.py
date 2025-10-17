from flask import Blueprint, jsonify
from app.decorators import token_required
from app import database

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_me(current_user):
    """
    Returns the data for the currently authenticated user based on the JWT.
    """
    # The 'current_user' object is passed by the @token_required decorator.
    # We can fetch more details from Supabase if needed.
    supabase_client = database.supabase
    user_details = supabase_client.auth.get_user(current_user.id)
    
    full_name = ''
    if user_details and user_details.user and user_details.user.user_metadata:
        full_name = user_details.user.user_metadata.get('full_name', '')

    user_dict = {
        'id': current_user.id,
        'aud': current_user.aud,
        'role': current_user.role,
        'email': current_user.email,
        'full_name': full_name,
        'created_at': current_user.created_at.isoformat() if current_user.created_at else None,
        'last_sign_in_at': current_user.last_sign_in_at.isoformat() if current_user.last_sign_in_at else None,
    }
    return jsonify(user_dict)