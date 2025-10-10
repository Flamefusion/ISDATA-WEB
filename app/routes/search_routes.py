from flask import Blueprint, request, jsonify, Response, current_app
import csv
import io

import pandas as pd
from app.database import get_db_connection

search_bp = Blueprint('search', __name__)

@search_bp.route('/search', methods=['POST'])
def search():
    """Search rings data with various filters."""
    filters = request.json
    current_app.logger.info(f"Received search filters: {filters}")
    
    try:
        supabase = get_db_connection()
        query = supabase.table('rings').select('date, vendor, mo_number, serial_number, pcb, qc_code, qc_person, vqc_status, ft_status, vqc_reason, ft_reason')

        if filters.get('serialNumbers'):
            serial_numbers = [s.strip().upper() for s in filters['serialNumbers'].split(',') if s.strip()]
            if serial_numbers:
                query = query.in_('serial_number', [sn.lower() for sn in serial_numbers])

        if filters.get('moNumbers'):
            mo_numbers = [s.strip().upper() for s in filters['moNumbers'].split(',') if s.strip()]
            if mo_numbers:
                query = query.in_('mo_number', [mn.lower() for mn in mo_numbers])

        if filters.get('dateFrom'):
            query = query.gte('date', filters['dateFrom'])

        if filters.get('dateTo'):
            query = query.lte('date', filters['dateTo'])
        
        if filters.get('vendor') and len(filters['vendor']) > 0:
            query = query.in_('vendor', filters['vendor'])

        if filters.get('pcb') and len(filters['pcb']) > 0:
            query = query.in_('pcb', filters['pcb'])

        if filters.get('qccode') and len(filters['qccode']) > 0:
            query = query.in_('qc_code', filters['qccode'])

        if filters.get('qcperson') and len(filters['qcperson']) > 0:
            query = query.in_('qc_person', filters['qcperson'])
            
        if filters.get('vqcStatus') and len(filters['vqcStatus']) > 0:
            query = query.in_('vqc_status', filters['vqcStatus'])
            
        if filters.get('ftStatus') and len(filters['ftStatus']) > 0:
            query = query.in_('ft_status', filters['ftStatus'])
            
        if filters.get('rejectionReason') and len(filters['rejectionReason']) > 0:
            query = query.or_(f'vqc_reason.in.({",".join(map(repr, filters["rejectionReason"]))}),ft_reason.in.({",".join(map(repr, filters["rejectionReason"]))})')

        response = query.order('date', desc=True).order('id', desc=True).limit(5000).execute()
        data = response.data
        
        current_app.logger.info(f"Search completed successfully, returning {len(data)} records")
        return jsonify(data)
        
    except psycopg2.Error as db_err:
        current_app.logger.error(f"Database error during search: {db_err}")
        return jsonify({'error': f'Database error: {str(db_err)}'}), 500
    except Exception as e:
        current_app.logger.error(f"Unexpected error during search: {e}")
        return jsonify({'error': f'Search failed: {str(e)}'}), 500

@search_bp.route('/search/filters', methods=['GET'])
def get_search_filters():
    """Gets distinct values for search filters from the database."""
    options = {}
    try:
        supabase = get_db_connection()
        
        options['vendors'] = [row['vendor'] for row in supabase.table('rings').select('vendor').neq('vendor', '').neq('vendor', 'NULL').execute().data]
        options['vqc_statuses'] = [row['vqc_status'] for row in supabase.table('rings').select('vqc_status').neq('vqc_status', '').neq('vqc_status', 'NULL').execute().data]
        options['ft_statuses'] = [row['ft_status'] for row in supabase.table('rings').select('ft_status').neq('ft_status', '').neq('ft_status', 'NULL').execute().data]
        
        vqc_reasons = [row['vqc_reason'] for row in supabase.table('rings').select('vqc_reason').neq('vqc_reason', '').neq('vqc_reason', 'NULL').execute().data]
        ft_reasons = [row['ft_reason'] for row in supabase.table('rings').select('ft_reason').neq('ft_reason', '').neq('ft_reason', 'NULL').execute().data]
        options['reasons'] = sorted(list(set(vqc_reasons + ft_reasons)))

        options['pcbs'] = [row['pcb'] for row in supabase.table('rings').select('pcb').neq('pcb', '').neq('pcb', 'NULL').execute().data]
        options['qccodes'] = [row['qc_code'] for row in supabase.table('rings').select('qc_code').neq('qc_code', '').neq('qc_code', 'NULL').execute().data]
        options['qcpersons'] = [row['qc_person'] for row in supabase.table('rings').select('qc_person').neq('qc_person', '').neq('qc_person', 'NULL').execute().data]
            
        return jsonify(options)
    except Exception as e:
        current_app.logger.error(f"Database error loading filters: {e}")
        return jsonify(status="error", message=f"Database error loading filters: {e}"), 500

@search_bp.route('/search/export', methods=['POST'])
def export_search_results():
    """Exports search results to a CSV file."""
    filters = request.json
    try:
        supabase = get_db_connection()
        query = supabase.table('rings').select('date, vendor, mo_number, serial_number, pcb, qc_code, qc_person, vqc_status, ft_status, vqc_reason, ft_reason')

        if filters.get('serialNumbers'):
            serial_numbers = [s.strip().upper() for s in filters['serialNumbers'].split(',') if s.strip()]
            if serial_numbers:
                query = query.in_('serial_number', [sn.lower() for sn in serial_numbers])

        if filters.get('moNumbers'):
            mo_numbers = [s.strip().upper() for s in filters['moNumbers'].split(',') if s.strip()]
            if mo_numbers:
                query = query.in_('mo_number', [mn.lower() for mn in mo_numbers])

        if filters.get('dateFrom'):
            query = query.gte('date', filters['dateFrom'])

        if filters.get('dateTo'):
            query = query.lte('date', filters['dateTo'])
            
        if filters.get('vendor'):
            query = query.in_('vendor', filters['vendor'])

        if filters.get('pcb') and len(filters['pcb']) > 0:
            query = query.in_('pcb', filters['pcb'])

        if filters.get('qccode') and len(filters['qccode']) > 0:
            query = query.in_('qc_code', filters['qccode'])

        if filters.get('qcperson') and len(filters['qcperson']) > 0:
            query = query.in_('qc_person', filters['qcperson'])
            
        if filters.get('vqcStatus'):
            query = query.in_('vqc_status', filters['vqcStatus'])
            
        if filters.get('ftStatus'):
            query = query.in_('ft_status', filters['ftStatus'])
            
        if filters.get('rejectionReason'):
            query = query.or_(f'vqc_reason.in.({",".join(map(repr, filters["rejectionReason"]))}),ft_reason.in.({",".join(map(repr, filters["rejectionReason"]))})')

        response = query.order('date', desc=True).order('id', desc=True).execute()
        results = response.data
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers
        headers = ['date', 'vendor', 'mo_number', 'serial_number', 'pcb', 'qc_code', 'qc_person', 'vqc_status', 'ft_status', 'vqc_reason', 'ft_reason']
        writer.writerow(headers)
        
        # Write data
        for row in results:
            writer.writerow([row[h] for h in headers])
        
        output.seek(0)
        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={"Content-Disposition": "attachment;filename=search_results.csv"}
        )

    except (psycopg2.Error, Exception) as e:
        current_app.logger.error(f"Export failed: {e}")
        return jsonify(status="error", message=f"Export failed: {e}"), 500