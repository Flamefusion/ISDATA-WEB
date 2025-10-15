-- SQL Functions for report_routes.py

-- Function for /vendors
CREATE OR REPLACE FUNCTION get_vendors()
RETURNS jsonb AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(vendor)
        FROM (
            SELECT DISTINCT vendor
            FROM rings
            WHERE vendor IS NOT NULL AND vendor != ''
            ORDER BY vendor
        ) as distinct_vendors
    );
END;
$$ LANGUAGE plpgsql;
