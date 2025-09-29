from flask import Blueprint, request, jsonify, Response, current_app
import csv
import io
import psycopg2
import pandas as pd
from app.database import get_db_connection

search_bp = Blueprint('search', __name__)

@search_bp.route('/search', methods=['POST'])
def search():
    """Search rings data with various filters."""
    filters = request.json
    current_app.logger.info(f"Received search filters: {filters}")
    
    query = "SELECT date, vendor, mo_number, serial_number, pcb, qc_code, qc_person, vqc_status, ft_status, vqc_reason, ft_reason FROM rings WHERE 1=1"
    params = []

    try:
        # Use UPPER for case-insensitive comparison
        if filters.get('serialNumbers'):
            serial_numbers = [s.strip().upper() for s in filters['serialNumbers'].split(',') if s.strip()]
            if serial_numbers:
                query += " AND UPPER(serial_number) = ANY(%s)"
                params.append(serial_numbers)

        if filters.get('moNumbers'):
            mo_numbers = [s.strip().upper() for s in filters['moNumbers'].split(',') if s.strip()]
            if mo_numbers:
                query += " AND UPPER(mo_number) = ANY(%s)"
                params.append(mo_numbers)

        # Improved date filtering with better error handling
        if filters.get('dateFrom'):
            date_from_str = filters['dateFrom']
            current_app.logger.info(f"Processing dateFrom: {date_from_str}")
            try:
                if isinstance(date_from_str, str):
                    from_date = pd.to_datetime(date_from_str).date()
                    query += " AND date >= %s"
                    params.append(from_date)
                    current_app.logger.info(f"Successfully parsed dateFrom: {from_date}")
                else:
                    current_app.logger.warning(f"dateFrom is not a string: {type(date_from_str)}")
            except Exception as e:
                current_app.logger.error(f"Failed to parse dateFrom '{date_from_str}': {e}")
                return jsonify({'error': f'Invalid dateFrom format: {date_from_str}'}), 400

        if filters.get('dateTo'):
            date_to_str = filters['dateTo']
            current_app.logger.info(f"Processing dateTo: {date_to_str}")
            try:
                if isinstance(date_to_str, str):
                    to_date = pd.to_datetime(date_to_str).date()
                    query += " AND date <= %s"
                    params.append(to_date)
                    current_app.logger.info(f"Successfully parsed dateTo: {to_date}")
                else:
                    current_app.logger.warning(f"dateTo is not a string: {type(date_to_str)}")
            except Exception as e:
                current_app.logger.error(f"Failed to parse dateTo '{date_to_str}': {e}")
                return jsonify({'error': f'Invalid dateTo format: {date_to_str}'}), 400
        
        # Handle multi-select filters
        if filters.get('vendor') and len(filters['vendor']) > 0:
            query += " AND vendor = ANY(%s)"
            params.append(filters['vendor'])

        if filters.get('pcb') and len(filters['pcb']) > 0:
            query += " AND pcb = ANY(%s)"
            params.append(filters['pcb'])

        if filters.get('qccode') and len(filters['qccode']) > 0:
            query += " AND qc_code = ANY(%s)"
            params.append(filters['qccode'])

        if filters.get('qcperson') and len(filters['qcperson']) > 0:
            query += " AND qc_person = ANY(%s)"
            params.append(filters['qcperson'])
            
        if filters.get('vqcStatus') and len(filters['vqcStatus']) > 0:
            query += " AND vqc_status = ANY(%s)"
            params.append(filters['vqcStatus'])
            
        if filters.get('ftStatus') and len(filters['ftStatus']) > 0:
            query += " AND ft_status = ANY(%s)"
            params.append(filters['ftStatus'])
            
        if filters.get('rejectionReason') and len(filters['rejectionReason']) > 0:
            query += " AND (vqc_reason = ANY(%s) OR ft_reason = ANY(%s))"
            params.extend([filters['rejectionReason'], filters['rejectionReason']])

        query += " ORDER BY date DESC, id DESC LIMIT 5000;"
        
        current_app.logger.info(f"Final query: {query}")
        current_app.logger.info(f"Query parameters: {params}")

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(query, tuple(params))
        
        colnames = [desc[0] for desc in cur.description]
        data = [dict(zip(colnames, row)) for row in cur.fetchall()]
        
        cur.close()
        
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
    conn = None
    options = {}
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT DISTINCT vendor FROM rings WHERE vendor IS NOT NULL AND vendor != '' ORDER BY vendor;")
            options['vendors'] = [row[0] for row in cursor.fetchall()]
            
            cursor.execute("SELECT DISTINCT vqc_status FROM rings WHERE vqc_status IS NOT NULL AND vqc_status != '' ORDER BY vqc_status;")
            options['vqc_statuses'] = [row[0] for row in cursor.fetchall()]
            
            cursor.execute("SELECT DISTINCT ft_status FROM rings WHERE ft_status IS NOT NULL AND ft_status != '' ORDER BY ft_status;")
            options['ft_statuses'] = [row[0] for row in cursor.fetchall()]
            
            reason_query = """
            SELECT DISTINCT reason FROM (
                SELECT vqc_reason AS reason FROM rings WHERE vqc_reason IS NOT NULL AND vqc_reason != '' 
                UNION ALL 
                SELECT ft_reason FROM rings WHERE ft_reason IS NOT NULL AND ft_reason != ''
            ) AS reasons ORDER BY 1;
            """
            cursor.execute(reason_query)
            options['reasons'] = [row[0] for row in cursor.fetchall()]

            cursor.execute("SELECT DISTINCT pcb FROM rings WHERE pcb IS NOT NULL AND pcb != '' ORDER BY pcb;")
            options['pcbs'] = [row[0] for row in cursor.fetchall()]

            cursor.execute("SELECT DISTINCT qc_code FROM rings WHERE qc_code IS NOT NULL AND qc_code != '' ORDER BY qc_code;")
            options['qccodes'] = [row[0] for row in cursor.fetchall()]

            cursor.execute("SELECT DISTINCT qc_person FROM rings WHERE qc_person IS NOT NULL AND qc_person != '' ORDER BY qc_person;")
            options['qcpersons'] = [row[0] for row in cursor.fetchall()]
            
        return jsonify(options)
    except psycopg2.Error as db_err:
        current_app.logger.error(f"Database error loading filters: {db_err}")
        return jsonify(status="error", message=f"Database error loading filters: {db_err}"), 500

@search_bp.route('/search/export', methods=['POST'])
def export_search_results():
    """Exports search results to a CSV file."""
    filters = request.json
    conn = None
    try:
        base_query = "SELECT date, vendor, mo_number, serial_number, pcb, qc_code, qc_person, vqc_status, ft_status, vqc_reason, ft_reason FROM rings"
        where_clauses, params = [], []

        if filters.get('serialNumbers'):
            serial_numbers = [s.strip().upper() for s in filters['serialNumbers'].split(',') if s.strip()]
            if serial_numbers:
                where_clauses.append("UPPER(serial_number) = ANY(%s)")
                params.append(serial_numbers)
                
        if filters.get('moNumbers'):
            mo_numbers = [s.strip().upper() for s in filters['moNumbers'].split(',') if s.strip()]
            if mo_numbers:
                where_clauses.append("UPPER(mo_number) = ANY(%s)")
                params.append(mo_numbers)
                
        if filters.get('dateFrom'):
            where_clauses.append("date >= %s")
            params.append(filters['dateFrom'])
            
        if filters.get('dateTo'):
            where_clauses.append("date <= %s")
            params.append(filters['dateTo'])
            
        if filters.get('vendor'):
            where_clauses.append("vendor = ANY(%s)")
            params.append(filters['vendor'])

        if filters.get('pcb') and len(filters['pcb']) > 0:
            where_clauses.append("pcb = ANY(%s)")
            params.append(filters['pcb'])

        if filters.get('qccode') and len(filters['qccode']) > 0:
            where_clauses.append("qc_code = ANY(%s)")
            params.append(filters['qccode'])

        if filters.get('qcperson') and len(filters['qcperson']) > 0:
            where_clauses.append("qc_person = ANY(%s)")
            params.append(filters['qcperson'])
            
        if filters.get('vqcStatus'):
            where_clauses.append("vqc_status = ANY(%s)")
            params.append(filters['vqcStatus'])
            
        if filters.get('ftStatus'):
            where_clauses.append("ft_status = ANY(%s)")
            params.append(filters['ftStatus'])
            
        if filters.get('rejectionReason'):
            where_clauses.append("(vqc_reason = ANY(%s) OR ft_reason = ANY(%s))")
            params.extend([filters['rejectionReason'], filters['rejectionReason']])

        if where_clauses:
            base_query += " WHERE " + " AND ".join(where_clauses)
        
        base_query += " ORDER BY date DESC, id DESC;"

        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(base_query, tuple(params))
            results = cursor.fetchall()
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write headers
            headers = [desc[0] for desc in cursor.description]
            writer.writerow(headers)
            
            # Write data
            for row in results:
                writer.writerow(row)
            
            output.seek(0)
            return Response(
                output.getvalue(),
                mimetype="text/csv",
                headers={"Content-Disposition": "attachment;filename=search_results.csv"}
            )

    except (psycopg2.Error, Exception) as e:
        current_app.logger.error(f"Export failed: {e}")
        return jsonify(status="error", message=f"Export failed: {e}"), 500