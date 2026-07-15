PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS connections (
  id TEXT PRIMARY KEY,
  hub_id TEXT NOT NULL UNIQUE,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  token_expires_at INTEGER NOT NULL,
  scopes TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'needs_configuration',
  formbricks_base_url TEXT,
  formbricks_api_key_encrypted TEXT,
  formbricks_workspace_id TEXT,
  formbricks_survey_ids TEXT NOT NULL DEFAULT '[]',
  formbricks_webhook_id TEXT,
  formbricks_webhook_secret_encrypted TEXT,
  mapping_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_connections_hub_id ON connections(hub_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);

CREATE TABLE IF NOT EXISTS sync_events (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  webhook_message_id TEXT NOT NULL,
  formbricks_response_id TEXT,
  formbricks_survey_id TEXT,
  email_preview TEXT,
  payload_hash TEXT NOT NULL,
  hubspot_contact_id TEXT,
  status TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  error_code TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE,
  UNIQUE (connection_id, webhook_message_id)
);

CREATE INDEX IF NOT EXISTS idx_sync_events_connection_created
ON sync_events(connection_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_events_status ON sync_events(status);

