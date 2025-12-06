-- Placeholder migration for settings, api keys, and audit log tables.
-- Apply via your migration tool or translate into Alembic revision.

CREATE TABLE IF NOT EXISTS bot_settings (
    id INTEGER PRIMARY KEY,
    owner_id VARCHAR NOT NULL,
    key VARCHAR NOT NULL,
    value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_bot_settings_owner_id ON bot_settings(owner_id);
CREATE INDEX IF NOT EXISTS ix_bot_settings_key ON bot_settings(key);

CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY,
    owner_id VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    encrypted_key TEXT NOT NULL,
    redacted BOOLEAN DEFAULT 1 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_api_keys_owner_id ON api_keys(owner_id);
CREATE INDEX IF NOT EXISTS ix_api_keys_name ON api_keys(name);

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY,
    actor_id VARCHAR NOT NULL,
    action VARCHAR NOT NULL,
    detail TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_audit_log_actor_id ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS ix_audit_log_action ON audit_log(action);
