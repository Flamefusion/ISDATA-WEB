from flask import Blueprint, request, jsonify, Response, current_app
import io
import pandas as pd

from app import database
from app.decorators import token_required

search_bp = Blueprint('search', __name__)

def _prepare_filters(filters):
    """Helper to format filters for the RPC call."""
    params = {
        'p_date_from': filters.get('dateFrom'),
        'p_date_to': filters.get('dateTo'),
        'p_vendors': filters.get('vendor'),
        'p_pcbs': filters.get('pcb'),
        'p_qccodes': filters.get('qccode'),
        'p_qcpersons': filters.get('qcperson'),
        'p_vqc_statuses': filters.get('vqcStatus'),
        'p_ft_statuses': filters.get('ftStatus'),
        'p_rejection_reasons': filters.get('rejectionReason')
    }
    
    if filters.get('serialNumbers'):
        params['p_serial_numbers'] = [s.strip().upper() for s in filters['serialNumbers'].split(',') if s.strip()]
    
    if filters.get('moNumbers'):
        params['p_mo_numbers'] = [s.strip().upper() for s in filters['moNumbers'].split(',') if s.strip()]
    
    return {k: v for k, v in params.items() if v}

@search_bp.route('/search', methods=['POST'])
@token_required
def search(current_user):
    """Search rings data with various filters via RPC."""
    filters = request.json
    current_app.logger.info(f"Received search filters: {filters}")
    
    try:
        supabase_client = database.supabase
        if supabase_client is None:
            raise Exception("Supabase client is not initialized.")
        params = _prepare_filters(filters)
        response = supabase_client.rpc('search_rings', params).execute()
        current_app.logger.info(f"Search completed successfully, returning {len(response.data)} records")
        return jsonify(response.data)
        
    except Exception as e:
        current_app.logger.error(f"Unexpected error during search: {e}")
        return jsonify({'error': f'Search failed: {str(e)}'}), 500

@search_bp.route('/search/filters', methods=['GET'])
@token_required
def get_search_filters(current_user):
    """Gets distinct values for search filters from the database via RPC."""
    try:
        supabase_client = database.supabase
        if supabase_client is None:
            raise Exception("Supabase client is not initialized.")
        response = supabase_client.rpc('get_search_filters', {}).execute()
        
        # The RPC function returns a list with a single JSON object
        if response.data and isinstance(response.data, list) and len(response.data) > 0:
            return jsonify(response.data[0])
        # Handle cases where it might unexpectedly return the object directly
        elif response.data and isinstance(response.data, dict):
            return jsonify(response.data)
        else:
            return jsonify({})

    except Exception as e:
        error_details = f"Type: {type(e).__name__}, Args: {e.args}"
        current_app.logger.error(f"Database error loading filters: {error_details}")
        return jsonify({'error': f'Database error loading filters: {error_details}'}), 500

@search_bp.route('/search/export', methods=['POST'])
@token_required
def export_search_results(current_user):
    """Exports search results to a CSV file via RPC."""
    filters = request.json
    try:
        supabase_client = database.supabase
        if supabase_client is None:
            raise Exception("Supabase client is not initialized.")
        params = _prepare_filters(filters)
        response = supabase_client.rpc('search_rings', params).execute()
        results = response.data

        if not results:
            return Response("", mimetype="text/csv")

        df = pd.DataFrame(results)
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        
        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={"Content-Disposition": "attachment;filename=search_results.csv"}
        )

    except Exception as e:
        current_app.logger.error(f"Export failed: {e}")
        return jsonify(status="error", message=f"Export failed: {e}"), 500