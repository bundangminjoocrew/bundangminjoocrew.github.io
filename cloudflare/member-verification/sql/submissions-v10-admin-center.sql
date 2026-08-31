-- DB v10: 신청 무효 처리(삭제 대신 이력 보존)
ALTER TABLE submissions ADD COLUMN voided_at TEXT;
ALTER TABLE submissions ADD COLUMN voided_by TEXT;
ALTER TABLE submissions ADD COLUMN void_reason TEXT;
CREATE INDEX IF NOT EXISTS idx_submissions_voided ON submissions(voided_at, request_type, submitted_at DESC);
