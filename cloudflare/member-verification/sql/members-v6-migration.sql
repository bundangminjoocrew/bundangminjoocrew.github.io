-- v6: 명부 원본 행 추적 + 닉네임 별칭 관리
-- CREATE TABLE IF NOT EXISTS만 사용하므로 다시 실행해도 안전합니다.

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

-- 기존 legacy_nickname이 있는 행은 별칭 테이블로 1회 백필합니다.
INSERT OR IGNORE INTO member_aliases(
  id, member_id, nickname, nickname_key, kind, created_at, created_by
)
SELECT
  lower(hex(randomblob(16))),
  id,
  legacy_nickname,
  lower(replace(trim(legacy_nickname), ' ', '')),
  'legacy',
  imported_at,
  'v6-migration'
FROM existing_members
WHERE legacy_nickname IS NOT NULL
  AND trim(legacy_nickname) <> '';
