from flask import Blueprint, jsonify, request
from app.database import get_db_connection
from datetime import datetime, timedelta

home_bp = Blueprint('home', __name__)

@home_bp.route('/home/summary', methods=['GET'])
def get_home_summary():
    logs = []
    try:
        start_date_str = request.args.get('startDate')
        end_date_str = request.args.get('endDate')

        if start_date_str and end_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        else:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=7)

        conn = get_db_connection()
        cursor = conn.cursor()

        # Ring Lifecycle
        try:
            logs.append("Executing Ring Lifecycle query...")
            cursor.execute("""SELECT 
                COUNT(CASE WHEN vqc_status IS NOT NULL THEN 1 END) as vqc_received,
                COUNT(CASE WHEN vqc_status IN ('ACCEPTED', 'WABI SABI', 'SCRAP', 'RT CONVERSION') THEN 1 END) as vqc_closed,
                COUNT(CASE WHEN ft_status IS NOT NULL THEN 1 END) as ft_received,
                COUNT(CASE WHEN ft_status IN ('ACCEPTED', 'WABI SABI', 'SCRAP', 'RT CONVERSION') THEN 1 END) as ft_closed
                FROM rings WHERE date BETWEEN %s AND %s;""", (start_date, end_date))
            lifecycle_data = cursor.fetchone()
            if lifecycle_data:
                vqc_received, vqc_closed, ft_received, ft_closed = lifecycle_data
            else:
                vqc_received, vqc_closed, ft_received, ft_closed = 0, 0, 0, 0
            logs.append("Ring Lifecycle query successful.")
        except Exception as e:
            logs.append(f"Error in Ring Lifecycle query: {e}")
            raise

        # Ring Status Overview
        try:
            logs.append("Executing Ring Status Overview query...")
            cursor.execute("""SELECT vqc_status, COUNT(*) FROM rings WHERE date BETWEEN %s AND %s AND vqc_status IS NOT NULL GROUP BY vqc_status;""", (start_date, end_date))
            ring_status_data = cursor.fetchall()
            logs.append("Ring Status Overview query successful.")
        except Exception as e:
            logs.append(f"Error in Ring Status Overview query: {e}")
            raise

        # Rejection Reasons
        try:
            logs.append("Executing Rejection Reasons query...")
            cursor.execute("""SELECT vqc_reason, COUNT(*) as count FROM rings WHERE date BETWEEN %s AND %s AND vqc_reason IS NOT NULL AND vqc_reason != '' GROUP BY vqc_reason ORDER BY count DESC;""", (start_date, end_date))
            rejection_reason_data = cursor.fetchall()
            logs.append("Rejection Reasons query successful.")
        except Exception as e:
            logs.append(f"Error in Rejection Reasons query: {e}")
            raise

        # Rings by Size
        try:
            logs.append("Executing Rings by Size query...")
            cursor.execute("""SELECT ring_size, COUNT(*) as count FROM rings WHERE date BETWEEN %s AND %s GROUP BY ring_size ORDER BY ring_size;""", (start_date, end_date))
            ring_size_data = cursor.fetchall()
            logs.append("Rings by Size query successful.")
        except Exception as e:
            logs.append(f"Error in Rings by Size query: {e}")
            raise

        # Rings by SKU
        try:
            logs.append("Executing Rings by SKU query...")
            cursor.execute("""SELECT sku, COUNT(*) as count FROM rings WHERE date BETWEEN %s AND %s GROUP BY sku ORDER BY sku;""", (start_date, end_date))
            ring_sku_data = cursor.fetchall()
            logs.append("Rings by SKU query successful.")
        except Exception as e:
            logs.append(f"Error in Rings by SKU query: {e}")
            raise

        # Rings by PCB Batch
        try:
            logs.append("Executing Rings by PCB Batch query...")
            cursor.execute("""SELECT pcb, COUNT(*) as count FROM rings WHERE date BETWEEN %s AND %s GROUP BY pcb ORDER BY pcb;""", (start_date, end_date))
            ring_pcb_data = cursor.fetchall()
            logs.append("Rings by PCB Batch query successful.")
        except Exception as e:
            logs.append(f"Error in Rings by PCB Batch query: {e}")
            raise

        # QC Person Yield
        try:
            logs.append("Executing QC Person Yield query...")
            cursor.execute("""SELECT qc_person, COUNT(*) as total, COUNT(CASE WHEN vqc_status = 'ACCEPTED' THEN 1 END) as accepted FROM rings WHERE date BETWEEN %s AND %s AND qc_person IS NOT NULL AND qc_person != '' GROUP BY qc_person;""", (start_date, end_date))
            qc_person_yield_data = cursor.fetchall()
            logs.append("QC Person Yield query successful.")
        except Exception as e:
            logs.append(f"Error in QC Person Yield query: {e}")
            raise

        # MO Summary
        try:
            logs.append("Executing MO Summary query...")
            cursor.execute("""SELECT mo_number, 
                COUNT(CASE WHEN vqc_status = 'ACCEPTED' THEN 1 END) as accepted,
                COUNT(CASE WHEN vqc_status = 'WABI SABI' THEN 1 END) as wabi_sabi,
                COUNT(CASE WHEN vqc_status = 'SCRAP' THEN 1 END) as scrap,
                COUNT(CASE WHEN vqc_status = 'RT CONVERSION' THEN 1 END) as rt_conversion
                FROM rings WHERE date BETWEEN %s AND %s GROUP BY mo_number;""", (start_date, end_date))
            mo_summary_data = cursor.fetchall()
            logs.append("MO Summary query successful.")
        except Exception as e:
            logs.append(f"Error in MO Summary query: {e}")
            raise

        cursor.close()

        # Format data
        try:
            logs.append("Formatting data...")
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
            formatted_mo_summary = [{'name': row[0], 'accepted': row[1], 'wabi_sabi': row[2], 'scrap': row[3], 'rt_conversion': row[4]} for row in mo_summary_data]
            logs.append("Data formatting successful.")
        except Exception as e:
            logs.append(f"Error in data formatting: {e}")
            raise

        return jsonify({
            'ringLifecycleData': formatted_ring_lifecycle,
            'ringStatusData': formatted_ring_status,
            'rejectionReasonData': formatted_rejection_reason,
            'ringSizeData': formatted_ring_size,
            'ringSkuData': formatted_ring_sku,
            'ringPcbData': formatted_ring_pcb,
            'qcPersonYieldData': formatted_qc_person_yield,
            'moSummaryData': formatted_mo_summary,
        })

    except Exception as e:
        return jsonify(error=str(e), logs=logs), 500