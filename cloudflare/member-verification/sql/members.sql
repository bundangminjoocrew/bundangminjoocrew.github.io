CREATE TABLE IF NOT EXISTS existing_members (
  id TEXT PRIMARY KEY,
  nickname_key TEXT NOT NULL UNIQUE,
  display_nickname TEXT NOT NULL,
  name TEXT,
  district TEXT,
  legacy_nickname TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  imported_at TEXT NOT NULL,
  reverified_at TEXT,
  reverified_submission_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_existing_members_active ON existing_members(active);
CREATE INDEX IF NOT EXISTS idx_existing_members_reverified ON existing_members(reverified_at);

CREATE TABLE IF NOT EXISTS admitted_members (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL UNIQUE,
  display_nickname TEXT NOT NULL,
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  admitted_at TEXT NOT NULL,
  admitted_by TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_admitted_members_date ON admitted_members(admitted_at DESC);

CREATE TABLE IF NOT EXISTS roster_import_issues (
  id TEXT PRIMARY KEY,
  issue_key TEXT NOT NULL UNIQUE,
  original_nickname TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','resolved')),
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  resolved_by TEXT,
  resolved_member_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_roster_import_issues_status ON roster_import_issues(status, created_at);
