-- 이미 v1 스키마를 생성한 경우에만 한 번 실행하세요.
ALTER TABLE submissions ADD COLUMN onboarding_stage TEXT;
ALTER TABLE submissions ADD COLUMN contacted_at TEXT;
ALTER TABLE submissions ADD COLUMN contacted_by TEXT;
ALTER TABLE submissions ADD COLUMN admitted_at TEXT;
ALTER TABLE submissions ADD COLUMN admitted_by TEXT;

CREATE INDEX IF NOT EXISTS idx_submissions_onboarding
ON submissions(request_type, review_status, onboarding_stage, reviewed_at DESC);

CREATE TABLE IF NOT EXISTS admitted_members (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  admitted_at TEXT NOT NULL,
  admitted_by TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admitted_members_date ON admitted_members(admitted_at DESC);
