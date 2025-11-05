CREATE OR REPLACE FUNCTION get_all_search_filters()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'vendors', (SELECT json_agg(DISTINCT vendor) FROM rings WHERE vendor IS NOT NULL),
        'pcbs', (SELECT json_agg(DISTINCT pcb) FROM rings WHERE pcb IS NOT NULL),
        'qccodes', (SELECT json_agg(DISTINCT qc_code) FROM rings WHERE qc_code IS NOT NULL),
        'qcpersons', (SELECT json_agg(DISTINCT qc_person) FROM rings WHERE qc_person IS NOT NULL),
        'vqc_statuses', (SELECT json_agg(DISTINCT vqc_status) FROM rings WHERE vqc_status IS NOT NULL),
        'ft_statuses', (SELECT json_agg(DISTINCT ft_status) FROM rings WHERE ft_status IS NOT NULL),
        'inventory_statuses', (SELECT json_agg(DISTINCT inventory_status) FROM rings WHERE inventory_status IS NOT NULL),
        'reasons', (
            SELECT json_agg(DISTINCT reason)
            FROM (
                SELECT vqc_reason AS reason FROM rings WHERE vqc_reason IS NOT NULL
                UNION
                SELECT ft_reason AS reason FROM rings WHERE ft_reason IS NOT NULL
            ) AS reasons
        )
    )
    INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql;
