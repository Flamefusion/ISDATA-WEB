from flask import Blueprint, jsonify, Response
from app import database
from app.decorators import token_required
import pandas as pd

inventory_bp = Blueprint('inventory', __name__)

@inventory_bp.route('/inventory_status', methods=['GET'])
@token_required
def get_inventory_status(current_user):
    """Get inventory status from the database."""
    try:
        supabase_client = database.supabase
        if supabase_client is None:
            raise Exception("Supabase client is not initialized.")
        
        response = supabase_client.rpc('get_inventory_status').execute()
        
        return jsonify(response.data)
    except Exception as e:
        return jsonify(error=str(e)), 500

@inventory_bp.route('/inventory_status/export', methods=['GET'])
@token_required
def export_inventory_status(current_user):
    """Export inventory status from the database as CSV."""
    try:
        supabase_client = database.supabase
        if supabase_client is None:
            raise Exception("Supabase client is not initialized.")
        
        response = supabase_client.rpc('get_inventory_status_export').execute()
        
        df = pd.DataFrame(response.data)
        
        csv_data = df.to_csv(index=False)
        
        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-disposition":
                     "attachment; filename=inventory_status.csv"})
    except Exception as e:
        return jsonify(error=str(e)), 500
