DROP FUNCTION IF EXISTS search_rings(
    text[], text[], date, date, text[], text[], text[], text[], text[], text[], text[]
);

CREATE OR REPLACE FUNCTION search_rings(
    p_serial_numbers text[] DEFAULT NULL,
    p_mo_numbers text[] DEFAULT NULL,
    p_date_from date DEFAULT NULL,
    p_date_to date DEFAULT NULL,
    p_vendors text[] DEFAULT NULL,
    p_pcbs text[] DEFAULT NULL,
    p_qccodes text[] DEFAULT NULL,
    p_qcpersons text[] DEFAULT NULL,
    p_vqc_statuses text[] DEFAULT NULL,
    p_ft_statuses text[] DEFAULT NULL,
    p_rejection_reasons text[] DEFAULT NULL,
    p_limit integer DEFAULT NULL -- New parameter for limit
)
RETURNS SETOF rings AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM rings
    WHERE
        (p_serial_numbers IS NULL OR UPPER(serial_number) = ANY(p_serial_numbers)) AND
        (p_mo_numbers IS NULL OR UPPER(mo_number) = ANY(p_mo_numbers)) AND
        (p_date_from IS NULL OR date >= p_date_from) AND
        (p_date_to IS NULL OR date <= p_date_to) AND
        (p_vendors IS NULL OR vendor = ANY(p_vendors)) AND
        (p_pcbs IS NULL OR pcb = ANY(p_pcbs)) AND
        (p_qccodes IS NULL OR qc_code = ANY(p_qccodes)) AND
        (p_qcpersons IS NULL OR qc_person = ANY(p_qcpersons)) AND
        (p_vqc_statuses IS NULL OR vqc_status = ANY(p_vqc_statuses)) AND
        (p_ft_statuses IS NULL OR ft_status = ANY(p_ft_statuses)) AND
        (p_rejection_reasons IS NULL OR (vqc_reason = ANY(p_rejection_reasons) OR ft_reason = ANY(p_rejection_reasons)))
    ORDER BY date DESC, id DESC
    LIMIT COALESCE(p_limit, 100000); -- Apply limit if provided, otherwise default to 5000
END;
$$ LANGUAGE plpgsql;