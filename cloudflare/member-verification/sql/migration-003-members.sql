-- bunmink-members DB용 v3 마이그레이션
ALTER TABLE admitted_members ADD COLUMN display_nickname TEXT;
UPDATE admitted_members SET display_nickname = name || '/' || district WHERE display_nickname IS NULL;
