CREATE OR REPLACE FUNCTION get_migration_history_as_json()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    INTO result
    FROM (
        SELECT id, migration_time, updated_qty, inserted_qty, user_email, batches_sent, log
        FROM migration_history
        ORDER BY migration_time DESC
    ) t;
    RETURN result;
END;
$$ LANGUAGE plpgsql;
