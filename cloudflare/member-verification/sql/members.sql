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

CREATE TABLE IF NOT EXISTS member_aliases (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  nickname_key TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL DEFAULT 'legacy'
    CHECK (kind IN ('legacy','current','historical','source','submitted')),
  created_at TEXT NOT NULL,
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_member_aliases_member ON member_aliases(member_id);
CREATE INDEX IF NOT EXISTS idx_member_aliases_key ON member_aliases(nickname_key);

CREATE TABLE IF NOT EXISTS roster_import_entries (
  id TEXT PRIMARY KEY,
  source_key TEXT NOT NULL UNIQUE,
  original_nickname TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('identified','pending')),
  member_id TEXT,
  imported_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_roster_import_entries_status ON roster_import_entries(status);
CREATE INDEX IF NOT EXISTS idx_roster_import_entries_member ON roster_import_entries(member_id);
