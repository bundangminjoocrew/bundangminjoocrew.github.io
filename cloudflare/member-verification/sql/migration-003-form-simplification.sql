-- v2 -> v3 폼 간소화 마이그레이션
-- D1/SQLite는 기존 NOT NULL 제약 제거가 번거로우므로 기존 name/district 컬럼은 유지하고,
-- 앞으로는 chat_nickname에서 서버가 자동 파싱해 채웁니다.
ALTER TABLE submissions ADD COLUMN privacy_consent_at TEXT;
ALTER TABLE submissions ADD COLUMN sensitive_consent_at TEXT;
ALTER TABLE submissions ADD COLUMN material_confirmation_at TEXT;
ALTER TABLE submissions ADD COLUMN consent_version TEXT DEFAULT 'v3-20260809';
-- 기존 consent_at 값이 있다면 새 동의 필드의 이관 기준으로 사용할 수 있습니다.
UPDATE submissions
SET privacy_consent_at = COALESCE(privacy_consent_at, consent_at),
    sensitive_consent_at = COALESCE(sensitive_consent_at, consent_at),
    material_confirmation_at = COALESCE(material_confirmation_at, consent_at),
    consent_version = COALESCE(consent_version, 'legacy-v2')
WHERE privacy_consent_at IS NULL OR sensitive_consent_at IS NULL OR material_confirmation_at IS NULL;
