# 분당민주크루 당원 확인 백엔드

GitHub Pages의 `verify.html`은 공개 화면만 담당합니다. 제출 데이터와 인증자료는 Cloudflare Worker + D1 + R2에서 처리합니다.

## 구성

- `public/` — 공개 제출 API Worker
- `admin/` — 관리자 인증/입장 관리 Worker (Cloudflare Access 필수)
- `sql/` — D1 초기 스키마와 이전 migration

## 최초 설정

```bash
npx wrangler@latest login
npx wrangler@latest d1 create bunmink-verifications
npx wrangler@latest d1 create bunmink-members
npx wrangler@latest r2 bucket create bunmink-verification-proofs
```

출력된 D1 `database_id` 두 개를 `public/wrangler.toml`, `admin/wrangler.toml`에 각각 넣습니다.

### D1 스키마

이 디렉터리에서 실행합니다.

```bash
npx wrangler@latest d1 execute bunmink-verifications --remote --file=./sql/submissions.sql
npx wrangler@latest d1 execute bunmink-members --remote --file=./sql/members.sql
```

### Public Worker

```bash
cd public
npx wrangler@latest deploy
npx wrangler@latest secret put TURNSTILE_SECRET
```

배포 후 표시되는 `workers.dev` 주소를 저장소의 `assets/js/verify.js` 상단 `VERIFICATION_API`에 입력합니다.

### Admin Worker

```bash
cd ../admin
npx wrangler@latest deploy
```

배포 직후 Cloudflare Dashboard에서 Admin Worker의 `workers.dev` 주소에 **Cloudflare Access**를 활성화하고, 허용할 관리자 이메일만 등록합니다.

## Turnstile

Turnstile Widget hostname:

```text
bundangminjoocrew.github.io
```

Site Key는 `verify.html`의 `REPLACE_TURNSTILE_SITE_KEY`에 넣습니다. Secret Key는 GitHub에 넣지 말고 `wrangler secret put TURNSTILE_SECRET`으로만 저장합니다.

## 개인정보 보존 동작

- 당원 확인 O: 인증 원본 즉시 삭제
- 미확인/X 원본: 제출일로부터 최대 7일 내 삭제
- 신규 신청 전화번호: 실제 입장 확인 즉시 삭제
- 확인 결과/확인일/확인 담당자 등 최소 확인정보: 확인일부터 최대 2년
