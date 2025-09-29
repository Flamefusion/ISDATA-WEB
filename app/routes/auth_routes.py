from flask import Blueprint, request
from app.auth import auth_manager

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    return auth_manager.login(username, password)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    db_host = data.get('db_host')
    db_port = data.get('db_port')
    db_name = data.get('db_name')
    db_user = data.get('db_user')
    db_password = data.get('db_password')
    return auth_manager.register(username, password, db_host, db_port, db_name, db_user, db_password)

@auth_bp.route('/logout', methods=['POST'])
def logout():
    return auth_manager.logout()
