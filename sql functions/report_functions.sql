-- This file contains the corrected and improved SQL functions for daily reports.
-- You can run this entire file in your Supabase SQL Editor to update the functions.

-- Corrected Function for /daily_report
CREATE OR REPLACE FUNCTION get_daily_report(p_selected_date date, p_selected_vendor text)
RETURNS jsonb AS $$
BEGIN
    RETURN (
        WITH rings_on_date AS (
            SELECT *
            FROM rings
            WHERE date = p_selected_date
              AND (p_selected_vendor = 'all' OR vendor = p_selected_vendor)
        ),
        processed_rings AS (
            SELECT
                vendor,
                vqc_status,
                vqc_reason,
                ft_status,
                ft_reason,
                created_at,
                CASE
                    WHEN (vqc_status IS NULL OR vqc_status = '') AND (ft_status IS NULL OR ft_status = '') THEN 'Pending'
                    WHEN (vqc_status IS NULL OR vqc_status = '') AND (ft_status IS NOT NULL AND ft_status != '') THEN
                        CASE WHEN UPPER(ft_status) IN ('ACCEPTED', 'PASS') THEN 'Accepted' ELSE 'Rejected' END
                    WHEN (vqc_status IS NOT NULL AND vqc_status != '') AND (ft_status IS NULL OR ft_status = '') THEN
                        CASE WHEN UPPER(vqc_status) IN ('ACCEPTED', 'PASS') THEN 'Accepted' ELSE 'Rejected' END
                    ELSE
                        CASE WHEN UPPER(ft_status) IN ('ACCEPTED', 'PASS') THEN 'Accepted' ELSE 'Rejected' END
                END as final_status,
                CASE
                    WHEN (vqc_status IS NULL OR vqc_status = '') AND (ft_status IS NOT NULL AND ft_status != '' AND UPPER(ft_status) NOT IN ('ACCEPTED', 'PASS')) THEN ft_reason
                    WHEN (vqc_status IS NOT NULL AND vqc_status != '' AND UPPER(vqc_status) NOT IN ('ACCEPTED', 'PASS')) AND (ft_status IS NULL OR ft_status = '') THEN vqc_reason
                    WHEN (ft_status IS NOT NULL AND ft_status != '' AND UPPER(ft_status) NOT IN ('ACCEPTED', 'PASS')) THEN ft_reason
                    ELSE ''
                END as final_reason,
                CASE
                    WHEN (vqc_status IS NULL OR vqc_status = '') THEN 'VQC'
                    WHEN (vqc_status IS NOT NULL AND vqc_status != '') AND (ft_status IS NULL OR ft_status = '') THEN 'VQC'
                    ELSE 'FT'
                END as stage
            FROM rings_on_date
        ),
        vendor_stats AS (
            SELECT
                vendor,
                COUNT(*) as received,
                COUNT(*) FILTER (WHERE final_status = 'Accepted') as accepted,
                COUNT(*) FILTER (WHERE final_status = 'Rejected') as rejected,
                COUNT(*) FILTER (WHERE final_status = 'Pending') as pending
            FROM processed_rings
            GROUP BY vendor
        ),
        overall_totals AS (
            SELECT
                COUNT(*) as total_received,
                COUNT(*) FILTER (WHERE final_status = 'Accepted') as total_accepted,
                COUNT(*) FILTER (WHERE final_status = 'Rejected') as total_rejected,
                COUNT(*) FILTER (WHERE final_status = 'Pending') as total_pending
            FROM processed_rings
        ),
        vqc_reasons AS (
            SELECT vqc_reason as reason, COUNT(*) as count
            FROM processed_rings
            WHERE stage = 'VQC' AND final_status = 'Rejected' AND vqc_reason IS NOT NULL AND vqc_reason != ''
            GROUP BY vqc_reason
        ),
        ft_reasons AS (
            SELECT ft_reason as reason, COUNT(*) as count
            FROM processed_rings
            WHERE stage = 'FT' AND final_status = 'Rejected' AND ft_reason IS NOT NULL AND ft_reason != ''
            GROUP BY ft_reason
        ),
        vqc_reasons_with_total AS (
            SELECT *, SUM(count) OVER () as total_count FROM vqc_reasons
        ),
        ft_reasons_with_total AS (
            SELECT *, SUM(count) OVER () as total_count FROM ft_reasons
        ),
        hourly_stats AS (
            SELECT
                EXTRACT(HOUR FROM created_at) as hour,
                COUNT(*) as received,
                COUNT(*) FILTER (WHERE final_status = 'Accepted') as accepted,
                COUNT(*) FILTER (WHERE final_status = 'Rejected') as rejected,
                COUNT(*) FILTER (WHERE final_status = 'Pending') as pending
            FROM processed_rings
            GROUP BY 1
        )
        SELECT jsonb_build_object(
            'date', p_selected_date,
            'vendor', p_selected_vendor,
            'totalReceived', COALESCE((SELECT total_received FROM overall_totals), 0),
            'totalAccepted', COALESCE((SELECT total_accepted FROM overall_totals), 0),
            'totalRejected', COALESCE((SELECT total_rejected FROM overall_totals), 0),
            'totalPending', COALESCE((SELECT total_pending FROM overall_totals), 0),
            'yield', COALESCE((SELECT CASE WHEN (total_accepted + total_rejected) > 0 THEN (total_accepted * 100.0 / (total_accepted + total_rejected)) ELSE 0 END FROM overall_totals), 0),
            'vqcBreakdown', jsonb_build_object(
                'accepted', COALESCE((SELECT COUNT(*) FROM rings_on_date WHERE vqc_status IS NOT NULL AND UPPER(vqc_status) IN ('ACCEPTED', 'PASS')), 0),
                'rejected', COALESCE((SELECT COUNT(*) FROM rings_on_date WHERE vqc_status IS NOT NULL AND UPPER(vqc_status) NOT IN ('ACCEPTED', 'PASS', '')), 0),
                'pending', COALESCE((SELECT COUNT(*) FROM rings_on_date WHERE vqc_status IS NULL OR vqc_status = ''), 0),
                'rejectionReasons', COALESCE((SELECT jsonb_agg(jsonb_build_object('reason', reason, 'count', count, 'percentage', count * 100.0 / total_count)) FROM vqc_reasons_with_total), '[]'::jsonb)
            ),
            'ftBreakdown', jsonb_build_object(
                'accepted', COALESCE((SELECT COUNT(*) FROM rings_on_date WHERE ft_status IS NOT NULL AND UPPER(ft_status) IN ('ACCEPTED', 'PASS')), 0),
                'rejected', COALESCE((SELECT COUNT(*) FROM rings_on_date WHERE ft_status IS NOT NULL AND UPPER(ft_status) NOT IN ('ACCEPTED', 'PASS', '')), 0),
                'pending', COALESCE((SELECT COUNT(*) FROM rings_on_date WHERE ft_status IS NULL OR ft_status = ''), 0),
                'rejectionReasons', COALESCE((SELECT jsonb_agg(jsonb_build_object('reason', reason, 'count', count, 'percentage', count * 100.0 / total_count)) FROM ft_reasons_with_total), '[]'::jsonb)
            ),
            'hourlyData', COALESCE((
                SELECT jsonb_agg(
                    jsonb_build_object('hour', to_char(hour::int, 'FM00') || ':00', 'received', received, 'accepted', accepted, 'rejected', rejected, 'pending', pending)
                    ORDER BY hour
                )
                FROM hourly_stats
            ), '[]'::jsonb),
            'vendorBreakdown', COALESCE((
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'vendor', vendor,
                        'totalReceived', received,
                        'totalAccepted', accepted,
                        'totalRejected', rejected,
                        'totalPending', pending,
                        'yield', CASE WHEN (accepted + rejected) > 0 THEN ROUND((accepted * 100.0 / (accepted + rejected))::numeric, 2) ELSE 0 END
                    )
                )
                FROM vendor_stats
            ), '[]'::jsonb)
        )
    );
END;
$$ LANGUAGE plpgsql;


-- Improved Function for /export_daily_report
CREATE OR REPLACE FUNCTION get_daily_report_export(p_selected_date date, p_selected_vendor text)
RETURNS TABLE(
    "Date" date,
    "Vendor" text,
    "Serial Number" text,
    "MO Number" text,
    "SKU" text,
    "Ring Size" text,
    "VQC Status" text,
    "VQC Reason" text,
    "FT Status" text,
    "FT Reason" text,
    "Overall Status" text,
    "Created At" timestamp
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.date,
        r.vendor,
        r.serial_number,
        r.mo_number,
        r.sku,
        r.ring_size,
        r.vqc_status,
        r.vqc_reason,
        r.ft_status,
        r.ft_reason,
        CASE
            WHEN (r.vqc_status IS NULL OR r.vqc_status = '') AND (r.ft_status IS NULL OR r.ft_status = '') THEN 'Pending'
            WHEN (r.vqc_status IS NULL OR r.vqc_status = '') AND (r.ft_status IS NOT NULL AND r.ft_status != '') THEN
                CASE WHEN UPPER(r.ft_status) IN ('ACCEPTED', 'PASS') THEN 'Accepted' ELSE 'Rejected' END
            WHEN (r.vqc_status IS NOT NULL AND r.vqc_status != '') AND (r.ft_status IS NULL OR r.ft_status = '') THEN
                CASE WHEN UPPER(r.vqc_status) IN ('ACCEPTED', 'PASS') THEN 'Accepted' ELSE 'Rejected' END
            ELSE
                CASE WHEN UPPER(r.ft_status) IN ('ACCEPTED', 'PASS') THEN 'Accepted' ELSE 'Rejected' END
        END as overall_status,
        r.created_at
    FROM rings r
    WHERE r.date = p_selected_date
      AND (p_selected_vendor = 'all' OR r.vendor = p_selected_vendor)
    ORDER BY r.created_at, r.vendor, r.serial_number;
END;
$$ LANGUAGE plpgsql;
