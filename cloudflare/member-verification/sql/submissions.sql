CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  request_type TEXT NOT NULL CHECK (request_type IN ('new','reverify')),
  member_type TEXT NOT NULL CHECK (member_type IN ('rights','general')),
  chat_nickname TEXT NOT NULL,
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  phone TEXT,
  roster_member_id TEXT,
  roster_match INTEGER NOT NULL DEFAULT 0,
  proof_key TEXT,
  proof_original_name TEXT,
  proof_mime TEXT,
  proof_size INTEGER,
  proof_delete_after TEXT NOT NULL,
  proof_deleted_at TEXT,
  proof_delete_reason TEXT,
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','verified','rejected')),
  reviewed_at TEXT,
  reviewer TEXT,
  onboarding_stage TEXT CHECK (onboarding_stage IN ('wait1','wait2','admitted')),
  contacted_at TEXT,
  contacted_by TEXT,
  admitted_at TEXT,
  admitted_by TEXT,
  voided_at TEXT,
  voided_by TEXT,
  void_reason TEXT,
  consent_at TEXT NOT NULL,
  privacy_consent_at TEXT NOT NULL,
  sensitive_consent_at TEXT NOT NULL,
  material_confirmation_at TEXT NOT NULL,
  consent_version TEXT NOT NULL DEFAULT 'v3-20260809',
  submitted_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(review_status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_onboarding ON submissions(request_type, review_status, onboarding_stage, reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_proof_cleanup ON submissions(proof_delete_after, proof_key);
CREATE INDEX IF NOT EXISTS idx_submissions_roster_member ON submissions(roster_member_id);
CREATE INDEX IF NOT EXISTS idx_submissions_expires ON submissions(expires_at);

CREATE INDEX IF NOT EXISTS idx_submissions_voided ON submissions(voided_at, request_type, submitted_at DESC);
