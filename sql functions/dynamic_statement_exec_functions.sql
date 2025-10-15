CREATE OR REPLACE FUNCTION exec(sql TEXT)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;