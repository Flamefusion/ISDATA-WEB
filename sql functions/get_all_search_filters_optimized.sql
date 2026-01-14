CREATE OR REPLACE FUNCTION get_all_search_filters_optimized()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'vendors', vendors,
        'pcbs', pcbs,
        'qccodes', qccodes,
        'qcpersons', qcpersons,
        'vqc_statuses', vqc_statuses,
        'ft_statuses', ft_statuses,
        'inventory_statuses', inventory_statuses,
        'reasons', reasons
    )
    INTO result
    FROM (
        SELECT
            json_agg(DISTINCT vendor) FILTER (WHERE vendor IS NOT NULL) as vendors,
            json_agg(DISTINCT pcb) FILTER (WHERE pcb IS NOT NULL) as pcbs,
            json_agg(DISTINCT qc_code) FILTER (WHERE qc_code IS NOT NULL) as qccodes,
            json_agg(DISTINCT qc_person) FILTER (WHERE qc_person IS NOT NULL) as qcpersons,
            json_agg(DISTINCT vqc_status) FILTER (WHERE vqc_status IS NOT NULL) as vqc_statuses,
            json_agg(DISTINCT ft_status) FILTER (WHERE ft_status IS NOT NULL) as ft_statuses,
            json_agg(DISTINCT inventory_status) FILTER (WHERE inventory_status IS NOT NULL) as inventory_statuses
        FROM rings
    ) AS aggregated_data,
    (
        SELECT json_agg(DISTINCT reason) as reasons
        FROM (
            SELECT vqc_reason AS reason FROM rings WHERE vqc_reason IS NOT NULL
            UNION
            SELECT ft_reason AS reason FROM rings WHERE ft_reason IS NOT NULL
        ) AS reasons_sub
    ) AS reasons_data;

    RETURN result;
END;
$$ LANGUAGE plpgsql;
