PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS forms (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  description TEXT NOT NULL DEFAULT '',
  submit_label TEXT NOT NULL DEFAULT 'Send response',
  success_message TEXT NOT NULL DEFAULT 'Thanks — your response was received.',
  fields_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_forms_connection_updated
ON forms(connection_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_forms_slug_status
ON forms(slug, status);

CREATE TABLE IF NOT EXISTS form_submissions (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  connection_id TEXT NOT NULL,
  submission_key TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  email_preview TEXT,
  hubspot_contact_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('processing', 'success', 'failed')),
  error_code TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
  FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE,
  UNIQUE(form_id, submission_key)
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_connection_created
ON form_submissions(connection_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_form_submissions_form_created
ON form_submissions(form_id, created_at DESC);
