CREATE OR REPLACE FUNCTION get_home_summary(p_start_date date, p_end_date date)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'ringLifecycleData', (
            SELECT json_build_object(
                'vqc_received', COUNT(CASE WHEN vqc_status IS NOT NULL THEN 1 END),
                'vqc_closed', COUNT(CASE WHEN vqc_status IN ('ACCEPTED', 'WABI SABI', 'SCRAP', 'RT CONVERSION') THEN 1 END),
                'vqc_pending', COUNT(CASE WHEN vqc_status IS NOT NULL THEN 1 END) - COUNT(CASE WHEN vqc_status IN ('ACCEPTED', 'WABI SABI', 'SCRAP', 'RT CONVERSION') THEN 1 END),
                'ft_received', COUNT(CASE WHEN ft_status IS NOT NULL THEN 1 END),
                'ft_closed', COUNT(CASE WHEN ft_status IN ('ACCEPTED', 'WABI SABI', 'SCRAP', 'RT CONVERSION') THEN 1 END),
                'ft_pending', COUNT(CASE WHEN ft_status IS NOT NULL THEN 1 END) - COUNT(CASE WHEN ft_status IN ('ACCEPTED', 'WABI SABI', 'SCRAP', 'RT CONVERSION') THEN 1 END)
            )
            FROM rings WHERE date BETWEEN p_start_date AND p_end_date
        ),
        'ringStatusData', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'name', vqc_status,
                    'value', count,
                    'percent', (count * 100.0 / total.total_rings)
                )
            ), '[]'::json)
            FROM (
                SELECT vqc_status, COUNT(*) as count
                FROM rings
                WHERE date BETWEEN p_start_date AND p_end_date AND vqc_status IS NOT NULL
                GROUP BY vqc_status
            ) as status_counts,
            (SELECT COUNT(*) as total_rings FROM rings WHERE date BETWEEN p_start_date AND p_end_date AND vqc_status IS NOT NULL) as total
            WHERE total.total_rings > 0
        ),
        'rejectionReasonData', (
            SELECT COALESCE(json_agg(json_build_object('name', vqc_reason, 'value', count)), '[]'::json)
            FROM (
                SELECT vqc_reason, COUNT(*) as count
                FROM rings
                WHERE date BETWEEN p_start_date AND p_end_date AND vqc_reason IS NOT NULL AND vqc_reason != ''
                GROUP BY vqc_reason
                ORDER BY count DESC
            ) as rejection_counts
        ),
        'ringSizeData', (
            SELECT COALESCE(json_agg(json_build_object('name', ring_size, 'value', count)), '[]'::json)
            FROM (
                SELECT ring_size, COUNT(*) as count
                FROM rings
                WHERE date BETWEEN p_start_date AND p_end_date
                GROUP BY ring_size
                ORDER BY ring_size
            ) as size_counts
        ),
        'ringSkuData', (
            SELECT COALESCE(json_agg(json_build_object('name', sku, 'value', count)), '[]'::json)
            FROM (
                SELECT sku, COUNT(*) as count
                FROM rings
                WHERE date BETWEEN p_start_date AND p_end_date
                GROUP BY sku
                ORDER BY sku
            ) as sku_counts
        ),
        'ringPcbData', (
            SELECT COALESCE(json_agg(json_build_object('name', pcb, 'value', count)), '[]'::json)
            FROM (
                SELECT pcb, COUNT(*) as count
                FROM rings
                WHERE date BETWEEN p_start_date AND p_end_date
                GROUP BY pcb
                ORDER BY pcb
            ) as pcb_counts
        ),
        'qcPersonYieldData', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'name', qc_person,
                    'total', total,
                    'accepted', accepted,
                    'yield', (accepted * 100.0 / total)
                )
            ), '[]'::json)
            FROM (
                SELECT qc_person, COUNT(*) as total, COUNT(CASE WHEN vqc_status = 'ACCEPTED' THEN 1 END) as accepted
                FROM rings
                WHERE date BETWEEN p_start_date AND p_end_date AND qc_person IS NOT NULL AND qc_person != ''
                GROUP BY qc_person
            ) as yield_counts
            WHERE total > 0
        ),
        'moSummaryData', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'name', mo_number,
                    'accepted', accepted,
                    'wabi_sabi', wabi_sabi,
                    'scrap', scrap,
                    'rt_conversion', rt_conversion
                )
            ), '[]'::json)
            FROM (
                SELECT mo_number,
                    COUNT(CASE WHEN vqc_status = 'ACCEPTED' THEN 1 END) as accepted,
                    COUNT(CASE WHEN vqc_status = 'WABI SABI' THEN 1 END) as wabi_sabi,
                    COUNT(CASE WHEN vqc_status = 'SCRAP' THEN 1 END) as scrap,
                    COUNT(CASE WHEN vqc_status = 'RT CONVERSION' THEN 1 END) as rt_conversion
                FROM rings
                WHERE date BETWEEN p_start_date AND p_end_date
                GROUP BY mo_number
            ) as mo_counts
        )
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql;