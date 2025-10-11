from flask import Blueprint, jsonify, request, current_app
from app.database import get_db_connection
from datetime import datetime, timedelta

home_bp = Blueprint('home', __name__)

@home_bp.route('/home/summary', methods=['GET'])
def get_home_summary():
    try:
        start_date_str = request.args.get('startDate')
        end_date_str = request.args.get('endDate')

        if start_date_str and end_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        else:
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=7)

        db = get_db_connection()
        
        response = db.rpc('get_home_summary', {
            'p_start_date': start_date.isoformat(),
            'p_end_date': end_date.isoformat()
        }).execute()

        summary_data = response.data[0] if response.data else {}

        return jsonify(summary_data)

    except Exception as e:
        current_app.logger.error(f"Error in get_home_summary: {e}")
        return jsonify(error=str(e)), 500
