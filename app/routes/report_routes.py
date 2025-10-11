from flask import Blueprint, request, jsonify, Response, current_app
import io
import pandas as pd

from app.database import supabase
from app.decorators import token_required

report_bp = Blueprint('reports', __name__)

@report_bp.route('/vendors', methods=['GET'])
@token_required
def get_vendors(current_user):
    """Returns a list of unique vendors from the rings table."""
    try:
        response = supabase.rpc('get_vendors', {}).execute()
        vendors = response.data if response.data else []
        return jsonify(['all'] + vendors)
    except Exception as e:
        current_app.logger.error(f"Error fetching vendors: {e}")
        return jsonify({'error': f'Failed to fetch vendors: {str(e)}'}), 500

@report_bp.route('/daily_report', methods=['POST'])
@token_required
def get_daily_report(current_user):
    """Generates a comprehensive daily production report via RPC."""
    config = request.json
    selected_date = config.get('date')
    selected_vendor = config.get('vendor', 'all')
    
    if not selected_date:
        return jsonify({'error': 'Date is required'}), 400
    
    try:
        response = supabase.rpc('get_daily_report', {
            'p_selected_date': selected_date,
            'p_selected_vendor': selected_vendor
        }).execute()
        
        report_data = response.data[0] if response.data else {}
        return jsonify(report_data)
        
    except Exception as e:
        current_app.logger.error(f"Error generating daily report: {e}")
        return jsonify({'error': f'Failed to generate report: {str(e)}'}), 500

@report_bp.route('/export_daily_report', methods=['POST'])
@token_required
def export_daily_report(current_user):
    """Exports daily report data as CSV or Excel via RPC."""
    config = request.json
    selected_date = config.get('date')
    selected_vendor = config.get('vendor', 'all')
    export_format = config.get('format', 'csv')
    
    if not selected_date:
        return jsonify({'error': 'Date is required'}), 400
    
    try:
        response = supabase.rpc('get_daily_report_export', {
            'p_selected_date': selected_date,
            'p_selected_vendor': selected_vendor
        }).execute()

        results = response.data if response.data else []
        
        if not results:
            return Response("", mimetype="text/csv")

        df = pd.DataFrame(results)
        
        if export_format.lower() == 'csv':
            output = io.StringIO()
            df.to_csv(output, index=False)
            output.seek(0)
            filename = f"daily_report_{selected_date}_{selected_vendor}.csv"
            
            return Response(
                output.getvalue(),
                mimetype="text/csv",
                headers={"Content-Disposition": f"attachment;filename={filename}"}
            )
        
        elif export_format.lower() == 'excel':
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Daily Report', index=False)
            
            output.seek(0)
            filename = f"daily_report_{selected_date}_{selected_vendor}.xlsx"
            
            return Response(
                output.getvalue(),
                mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment;filename={filename}"}
            )
        
        else:
            return jsonify({'error': 'Invalid export format'}), 400
            
    except Exception as e:
        current_app.logger.error(f"Error exporting daily report: {e}")
        return jsonify({'error': f'Failed to export report: {str(e)}'}), 500

@report_bp.route('/rejection_trends', methods=['POST'])
@token_required
def get_rejection_trends(current_user):
    """Generates rejection trends data via RPC."""
    config = request.json
    date_from = config.get('dateFrom')
    date_to = config.get('dateTo')
    selected_vendor = config.get('vendor')
    rejection_stage_filter = config.get('rejectionStage', 'both')

    if not all([date_from, date_to, selected_vendor]):
        return jsonify({'error': 'dateFrom, dateTo, and vendor are required'}), 400

    try:
        response = supabase.rpc('get_rejection_trends', {
            'p_date_from': date_from,
            'p_date_to': date_to,
            'p_vendor': selected_vendor,
            'p_rejection_stage': rejection_stage_filter
        }).execute()

        trends_data = response.data[0] if response.data else {}
        return jsonify(trends_data)
            
    except Exception as e:
        current_app.logger.error(f"Error generating rejection trends: {e}", exc_info=True)
        return jsonify({'error': f'Failed to generate rejection trends: {str(e)}'}), 500

@report_bp.route('/rejection_trends/export', methods=['POST'])
@token_required
def export_rejection_trends(current_user):
    """Exports rejection trends data as CSV or Excel via RPC."""
    config = request.json
    date_from = config.get('dateFrom')
    date_to = config.get('dateTo')
    selected_vendor = config.get('vendor')
    export_format = config.get('format', 'csv')
    rejection_stage = config.get('rejectionStage', 'both')
    
    if not all([date_from, date_to, selected_vendor]):
        return jsonify({'error': 'dateFrom, dateTo, and vendor are required'}), 400
    
    try:
        response = supabase.rpc('get_rejection_trends_export', {
            'p_date_from': date_from,
            'p_date_to': date_to,
            'p_vendor': selected_vendor,
            'p_rejection_stage': rejection_stage
        }).execute()

        export_data = response.data if response.data else []
        
        if not export_data:
            return Response("", mimetype="text/csv")

        df = pd.DataFrame(export_data)

        if export_format.lower() == 'csv':
            output = io.StringIO()
            df.to_csv(output, index=False)
            output.seek(0)
            
            filename = f"rejection_trends_{date_from}_to_{date_to}_{selected_vendor}.csv"
            return Response(
                output.getvalue(),
                mimetype="text/csv",
                headers={"Content-Disposition": f"attachment;filename={filename}"}
            )
        
        elif export_format.lower() == 'excel':
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Rejection Trends', index=False)
            
            output.seek(0)
            filename = f"rejection_trends_{date_from}_to_{date_to}_{selected_vendor}.xlsx"
            
            return Response(
                output.getvalue(),
                mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment;filename={filename}"}
            )
        
        else:
            return jsonify({'error': 'Invalid export format'}), 400
            
    except Exception as e:
        current_app.logger.error(f"Error generating rejection trends export: {e}")
        return jsonify({'error': f'Failed to generate rejection trends export: {str(e)}'}), 500