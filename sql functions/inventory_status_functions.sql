-- Functions for Inventory Status Tab

-- Function to get inventory status summary
CREATE OR REPLACE FUNCTION get_inventory_status()
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    WITH box_details AS (
        SELECT
            inventory_status as box_name,
            COUNT(*) as quantity
        FROM rings
        WHERE inventory_status IS NOT NULL AND inventory_status != ''
        GROUP BY inventory_status
    )
    SELECT jsonb_build_object(
        'total_serial_numbers', COALESCE(SUM(quantity), 0)::bigint,
        'total_boxes', COALESCE(COUNT(box_name), 0)::bigint,
        'boxes', COALESCE(jsonb_agg(jsonb_build_object('box_name', box_name, 'quantity', quantity) ORDER BY box_name), '[]'::jsonb)
    )
    INTO result
    FROM box_details;

    RETURN COALESCE(result, jsonb_build_object(
        'total_serial_numbers', 0,
        'total_boxes', 0,
        'boxes', '[]'::jsonb
    ));
END;
$$ LANGUAGE plpgsql;

-- Function to get inventory status for export
CREATE OR REPLACE FUNCTION get_inventory_status_export()
RETURNS TABLE(
    "Box Name" text,
    "Serial Number" text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.inventory_status::text,
        r.serial_number::text
    FROM rings r
    WHERE r.inventory_status IS NOT NULL AND r.inventory_status != ''
    ORDER BY r.inventory_status, r.serial_number;
END;
$$ LANGUAGE plpgsql;
