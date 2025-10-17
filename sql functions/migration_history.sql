DROP TABLE IF EXISTS migration_history;
CREATE TABLE migration_history (
    id SERIAL PRIMARY KEY,
    migration_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_qty INTEGER,
    inserted_qty INTEGER,
    user_email TEXT,
    batches_sent INTEGER,
    log TEXT
);