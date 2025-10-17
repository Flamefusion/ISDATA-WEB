CREATE OR REPLACE FUNCTION get_migration_history_as_json()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    INTO result
    FROM (
        SELECT
            mh.id,
            mh.migration_time,
            mh.updated_qty,
            mh.inserted_qty,
            mh.user_email,
            mh.batches_sent,
            mh.log,
            u.raw_user_meta_data->>'full_name' as user_name
        FROM migration_history mh
        LEFT JOIN auth.users u ON mh.user_email = u.email
        ORDER BY mh.migration_time DESC
    ) t;
    RETURN result;
END;
$$ LANGUAGE plpgsql;
