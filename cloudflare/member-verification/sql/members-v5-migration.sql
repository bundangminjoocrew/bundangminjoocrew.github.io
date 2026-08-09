-- v4에서 이미 bunmink-members DB를 만든 경우 한 번만 실행합니다.
ALTER TABLE existing_members ADD COLUMN legacy_nickname TEXT;

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
