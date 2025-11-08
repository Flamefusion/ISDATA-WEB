DROP FUNCTION IF EXISTS search_rings(
    text[], text[], date, date, text[], text[], text[], text[], text[], text[], text[], text[], integer
);

CREATE OR REPLACE FUNCTION search_rings(
    p_serial_numbers jsonb DEFAULT NULL,
    p_mo_numbers jsonb DEFAULT NULL,
    p_date_from date DEFAULT NULL,
    p_date_to date DEFAULT NULL,
    p_vendors text[] DEFAULT NULL,
    p_pcbs text[] DEFAULT NULL,
    p_qccodes text[] DEFAULT NULL,
    p_qcpersons text[] DEFAULT NULL,
    p_vqc_statuses text[] DEFAULT NULL,
    p_ft_statuses text[] DEFAULT NULL,
    p_rejection_reasons text[] DEFAULT NULL,
    p_inventory_statuses text[] DEFAULT NULL,
    p_limit integer DEFAULT NULL
)
RETURNS SETOF rings AS $$
DECLARE
    v_serial_numbers text[];
    v_mo_numbers text[];
BEGIN
    -- Convert jsonb arrays to text arrays
    IF p_serial_numbers IS NOT NULL THEN
        SELECT array_agg(upper(elem::text)) INTO v_serial_numbers FROM jsonb_array_elements_text(p_serial_numbers) elem;
    END IF;
    IF p_mo_numbers IS NOT NULL THEN
        SELECT array_agg(upper(elem::text)) INTO v_mo_numbers FROM jsonb_array_elements_text(p_mo_numbers) elem;
    END IF;

    RETURN QUERY
    SELECT * FROM rings
    WHERE
        (v_serial_numbers IS NULL OR UPPER(serial_number) = ANY(v_serial_numbers)) AND
        (v_mo_numbers IS NULL OR UPPER(mo_number) = ANY(v_mo_numbers)) AND
        (p_date_from IS NULL OR date >= p_date_from) AND
        (p_date_to IS NULL OR date <= p_date_to) AND
        (p_vendors IS NULL OR vendor = ANY(p_vendors)) AND
        (p_pcbs IS NULL OR pcb = ANY(p_pcbs)) AND
        (p_qccodes IS NULL OR qc_code = ANY(p_qccodes)) AND
        (p_qcpersons IS NULL OR qc_person = ANY(p_qcpersons)) AND
        (p_vqc_statuses IS NULL OR vqc_status = ANY(p_vqc_statuses)) AND
        (p_ft_statuses IS NULL OR ft_status = ANY(p_ft_statuses)) AND
        (p_inventory_statuses IS NULL OR inventory_status = ANY(p_inventory_statuses)) AND
        (p_rejection_reasons IS NULL OR (vqc_reason = ANY(p_rejection_reasons) OR ft_reason = ANY(p_rejection_reasons)))
    ORDER BY date DESC
    LIMIT COALESCE(p_limit, 100000);
END;
$$ LANGUAGE plpgsql;