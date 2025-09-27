
from flask import Blueprint, jsonify, request
from app.database import get_db_connection, return_db_connection
from datetime import datetime, timedelta

home_bp = Blueprint('home', __name__)

@home_bp.route('/home/summary', methods=['GET'])
def get_home_summary():
    start_date_str = request.args.get('startDate')
    end_date_str = request.args.get('endDate')

    if start_date_str and end_date_str:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
    else:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=7)

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Ring Lifecycle
        cursor.execute("""SELECT 
            COUNT(CASE WHEN vqc_status IS NOT NULL THEN 1 END) as vqc_received,
            COUNT(CASE WHEN vqc_status IN ('accepted', 'wabi sabi', 'scrap', 'rt conversion') THEN 1 END) as vqc_closed,
            COUNT(CASE WHEN ft_status IS NOT NULL THEN 1 END) as ft_received,
            COUNT(CASE WHEN ft_status IN ('passed', 'failed') THEN 1 END) as ft_closed
            FROM rings WHERE date BETWEEN %s AND %s;""", (start_date, end_date))
        lifecycle_data = cursor.fetchone()
        vqc_received, vqc_closed, ft_received, ft_closed = lifecycle_data

        # Ring Status Overview
        cursor.execute("""SELECT vqc_status, COUNT(*) FROM rings WHERE date BETWEEN %s AND %s AND vqc_status IS NOT NULL GROUP BY vqc_status;""", (start_date, end_date))
        ring_status_data = cursor.fetchall()

        # Rejection Reasons
        cursor.execute("""SELECT vqc_reason, COUNT(*) as count FROM rings WHERE date BETWEEN %s AND %s AND vqc_reason IS NOT NULL AND vqc_reason != '' GROUP BY vqc_reason ORDER BY count DESC;""", (start_date, end_date))
        rejection_reason_data = cursor.fetchall()

        # Rings by Size
        cursor.execute("""SELECT ring_size, COUNT(*) as count FROM rings WHERE date BETWEEN %s AND %s GROUP BY ring_size ORDER BY ring_size;""", (start_date, end_date))
        ring_size_data = cursor.fetchall()

        # Rings by SKU
        cursor.execute("""SELECT sku, COUNT(*) as count FROM rings WHERE date BETWEEN %s AND %s GROUP BY sku ORDER BY sku;""", (start_date, end_date))
        ring_sku_data = cursor.fetchall()

        # Rings by PCB Batch
        cursor.execute("""SELECT pcb, COUNT(*) as count FROM rings WHERE date BETWEEN %s AND %s GROUP BY pcb ORDER BY pcb;""", (start_date, end_date))
        ring_pcb_data = cursor.fetchall()

        # QC Person Yield
        cursor.execute("""SELECT qc_person, COUNT(*) as total, COUNT(CASE WHEN vqc_status = 'accepted' THEN 1 END) as accepted FROM rings WHERE date BETWEEN %s AND %s AND qc_person IS NOT NULL AND qc_person != '' GROUP BY qc_person;""", (start_date, end_date))
        qc_person_yield_data = cursor.fetchall()

        cursor.close()

        # Format data
        formatted_ring_lifecycle = {
            'vqc_received': vqc_received, 'vqc_closed': vqc_closed, 'vqc_pending': vqc_received - vqc_closed,
            'ft_received': ft_received, 'ft_closed': ft_closed, 'ft_pending': ft_received - ft_closed
        }
        total_rings = sum(row[1] for row in ring_status_data)
        formatted_ring_status = [{'name': row[0], 'value': row[1], 'percent': (row[1] / total_rings) * 100 if total_rings > 0 else 0} for row in ring_status_data]
        formatted_rejection_reason = [{'name': row[0], 'value': row[1]} for row in rejection_reason_data]
        formatted_ring_size = [{'name': row[0], 'value': row[1]} for row in ring_size_data]
        formatted_ring_sku = [{'name': row[0], 'value': row[1]} for row in ring_sku_data]
        formatted_ring_pcb = [{'name': row[0], 'value': row[1]} for row in ring_pcb_data]
        formatted_qc_person_yield = [{'name': row[0], 'yield': (row[2] / row[1]) * 100 if row[1] > 0 else 0, 'total': row[1], 'accepted': row[2]} for row in qc_person_yield_data]

        return jsonify({
            'ringLifecycleData': formatted_ring_lifecycle,
            'ringStatusData': formatted_ring_status,
            'rejectionReasonData': formatted_rejection_reason,
            'ringSizeData': formatted_ring_size,
            'ringSkuData': formatted_ring_sku,
            'ringPcbData': formatted_ring_pcb,
            'qcPersonYieldData': formatted_qc_person_yield,
        })

    except Exception as e:
        return jsonify(error=str(e)), 500
    finally:
        if conn:
            return_db_connection(conn)
