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
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').isoformat()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').isoformat()
        else:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=7)
            end_date = end_date.isoformat()
            start_date = start_date.isoformat()

        supabase = get_db_connection()

        # Ring Lifecycle
        try:
            logs.append("Executing Ring Lifecycle query...")
            vqc_received_res = supabase.table('rings').select('serial_number', count='exact').filter('vqc_status', 'not.is', 'NULL').filter('date', 'gte', start_date).filter('date', 'lte', end_date).execute()
            vqc_closed_res = supabase.table('rings').select('serial_number', count='exact').in_('vqc_status', ['ACCEPTED', 'WABI SABI', 'SCRAP', 'RT CONVERSION']).filter('date', 'gte', start_date).filter('date', 'lte', end_date).execute()
            ft_received_res = supabase.table('rings').select('serial_number', count='exact').filter('ft_status', 'not.is', 'NULL').filter('date', 'gte', start_date).filter('date', 'lte', end_date).execute()
            ft_closed_res = supabase.table('rings').select('serial_number', count='exact').in_('ft_status', ['ACCEPTED', 'WABI SABI', 'SCRAP', 'RT CONVERSION']).filter('date', 'gte', start_date).filter('date', 'lte', end_date).execute()
            
            vqc_received = vqc_received_res.count
            vqc_closed = vqc_closed_res.count
            ft_received = ft_received_res.count
            ft_closed = ft_closed_res.count
            logs.append("Ring Lifecycle query successful.")
        except Exception as e:
            logs.append(f"Error in Ring Lifecycle query: {e}")
            raise

        # Ring Status Overview
        try:
            logs.append("Executing Ring Status Overview query...")
            ring_status_data_res = supabase.table('rings').select('vqc_status', count='exact').filter('date', 'gte', start_date).filter('date', 'lte', end_date).filter('vqc_status', 'not.is', 'NULL').group('vqc_status').execute()
            ring_status_data = ring_status_data_res.data
            logs.append("Ring Status Overview query successful.")
        except Exception as e:
            logs.append(f"Error in Ring Status Overview query: {e}")
            raise

        # Rejection Reasons
        try:
            logs.append("Executing Rejection Reasons query...")
            rejection_reason_data_res = supabase.table('rings').select('vqc_reason', count='exact').filter('date', 'gte', start_date).filter('date', 'lte', end_date).filter('vqc_reason', 'not.is', 'NULL').filter('vqc_reason', 'neq', '').group('vqc_reason').order('count', desc=True).execute()
            rejection_reason_data = rejection_reason_data_res.data
            logs.append("Rejection Reasons query successful.")
        except Exception as e:
            logs.append(f"Error in Rejection Reasons query: {e}")
            raise

        # Rings by Size
        try:
            logs.append("Executing Rings by Size query...")
            ring_size_data_res = supabase.table('rings').select('ring_size', count='exact').filter('date', 'gte', start_date).filter('date', 'lte', end_date).group('ring_size').order('ring_size').execute()
            ring_size_data = ring_size_data_res.data
            logs.append("Rings by Size query successful.")
        except Exception as e:
            logs.append(f"Error in Rings by Size query: {e}")
            raise

        # Rings by SKU
        try:
            logs.append("Executing Rings by SKU query...")
            ring_sku_data_res = supabase.table('rings').select('sku', count='exact').filter('date', 'gte', start_date).filter('date', 'lte', end_date).group('sku').order('sku').execute()
            ring_sku_data = ring_sku_data_res.data
            logs.append("Rings by SKU query successful.")
        except Exception as e:
            logs.append(f"Error in Rings by SKU query: {e}")
            raise

        # Rings by PCB Batch
        try:
            logs.append("Executing Rings by PCB Batch query...")
            ring_pcb_data_res = supabase.table('rings').select('pcb', count='exact').filter('date', 'gte', start_date).filter('date', 'lte', end_date).group('pcb').order('pcb').execute()
            ring_pcb_data = ring_pcb_data_res.data
            logs.append("Rings by PCB Batch query successful.")
        except Exception as e:
            logs.append(f"Error in Rings by PCB Batch query: {e}")
            raise

        # QC Person Yield
        try:
            logs.append("Executing QC Person Yield query...")
            qc_person_total_res = supabase.table('rings').select('qc_person', count='exact').filter('date', 'gte', start_date).filter('date', 'lte', end_date).filter('qc_person', 'not.is', 'NULL').filter('qc_person', 'neq', '').group('qc_person').execute()
            qc_person_accepted_res = supabase.table('rings').select('qc_person', count='exact').filter('date', 'gte', start_date).filter('date', 'lte', end_date).filter('qc_person', 'not.is', 'NULL').filter('qc_person', 'neq', '').eq('vqc_status', 'ACCEPTED').group('qc_person').execute()
            
            qc_person_yield_data = []
            for total_row in qc_person_total_res.data:
                accepted_row = next((item for item in qc_person_accepted_res.data if item['qc_person'] == total_row['qc_person']), None)
                accepted_count = accepted_row['count'] if accepted_row else 0
                qc_person_yield_data.append({'qc_person': total_row['qc_person'], 'total': total_row['count'], 'accepted': accepted_count})
            logs.append("QC Person Yield query successful.")
        except Exception as e:
            logs.append(f"Error in QC Person Yield query: {e}")
            raise

        # MO Summary
        try:
            logs.append("Executing MO Summary query...")
            mo_summary_res = supabase.table('rings').select('mo_number', 'vqc_status', count='exact').filter('date', 'gte', start_date).filter('date', 'lte', end_date).group('mo_number', 'vqc_status').execute()
            
            mo_summary_data = {}
            for row in mo_summary_res.data:
                if row['mo_number'] not in mo_summary_data:
                    mo_summary_data[row['mo_number']] = {'accepted': 0, 'wabi_sabi': 0, 'scrap': 0, 'rt_conversion': 0}
                if row['vqc_status'] == 'ACCEPTED':
                    mo_summary_data[row['mo_number']]['accepted'] = row['count']
                elif row['vqc_status'] == 'WABI SABI':
                    mo_summary_data[row['mo_number']]['wabi_sabi'] = row['count']
                elif row['vqc_status'] == 'SCRAP':
                    mo_summary_data[row['mo_number']]['scrap'] = row['count']
                elif row['vqc_status'] == 'RT CONVERSION':
                    mo_summary_data[row['mo_number']]['rt_conversion'] = row['count']
            logs.append("MO Summary query successful.")
        except Exception as e:
            logs.append(f"Error in MO Summary query: {e}")
            raise

        # Format data
        try:
            logs.append("Formatting data...")
            formatted_ring_lifecycle = {
                'vqc_received': vqc_received, 'vqc_closed': vqc_closed, 'vqc_pending': vqc_received - vqc_closed,
                'ft_received': ft_received, 'ft_closed': ft_closed, 'ft_pending': ft_received - ft_closed
            }
            total_rings = sum(row['count'] for row in ring_status_data)
            formatted_ring_status = [{'name': row['vqc_status'], 'value': row['count'], 'percent': (row['count'] / total_rings) * 100 if total_rings > 0 else 0} for row in ring_status_data]
            formatted_rejection_reason = [{'name': row['vqc_reason'], 'value': row['count']} for row in rejection_reason_data]
            formatted_ring_size = [{'name': row['ring_size'], 'value': row['count']} for row in ring_size_data]
            formatted_ring_sku = [{'name': row['sku'], 'value': row['count']} for row in ring_sku_data]
            formatted_ring_pcb = [{'name': row['pcb'], 'value': row['count']} for row in ring_pcb_data]
            formatted_qc_person_yield = [{'name': row['qc_person'], 'yield': (row['accepted'] / row['total']) * 100 if row['total'] > 0 else 0, 'total': row['total'], 'accepted': row['accepted']} for row in qc_person_yield_data]
            formatted_mo_summary = [{'name': mo, 'accepted': data['accepted'], 'wabi_sabi': data['wabi_sabi'], 'scrap': data['scrap'], 'rt_conversion': data['rt_conversion']} for mo, data in mo_summary_data.items()]
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