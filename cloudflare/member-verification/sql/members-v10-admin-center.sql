-- MEMBERS_DB v10: 관리자센터 운영 상태/이력
ALTER TABLE existing_members ADD COLUMN left_at TEXT;
ALTER TABLE existing_members ADD COLUMN left_by TEXT;
ALTER TABLE existing_members ADD COLUMN left_reason TEXT;

ALTER TABLE admitted_members ADD COLUMN active INTEGER NOT NULL DEFAULT 1;
ALTER TABLE admitted_members ADD COLUMN left_at TEXT;
ALTER TABLE admitted_members ADD COLUMN left_by TEXT;
ALTER TABLE admitted_members ADD COLUMN left_reason TEXT;
CREATE INDEX IF NOT EXISTS idx_admitted_members_active ON admitted_members(active, admitted_at DESC);

ALTER TABLE roster_import_issues ADD COLUMN active INTEGER NOT NULL DEFAULT 1;
ALTER TABLE roster_import_issues ADD COLUMN left_at TEXT;
ALTER TABLE roster_import_issues ADD COLUMN left_by TEXT;
ALTER TABLE roster_import_issues ADD COLUMN left_reason TEXT;
CREATE INDEX IF NOT EXISTS idx_roster_import_issues_active ON roster_import_issues(status, active, created_at);

CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT NOT NULL,
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS admin_events (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  detail TEXT,
  created_at TEXT NOT NULL,
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_admin_events_date ON admin_events(created_at DESC);
