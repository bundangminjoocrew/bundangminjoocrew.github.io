# 전당대회 데이터 자동 갱신

## 구조

- `data/convention-config.json`
  - 후보, 가중치, 일정, 지역 ID 등 정적 설정
  - 득표수는 넣지 않음
- `data/convention-sources.json`
  - 더불어민주당 공식 결과 공지 URL 목록
- `data/convention-data.json`
  - GitHub Actions가 생성하는 실제 프런트용 데이터
- `scripts/rebuild-convention-data.py`
  - 모든 공식 결과 공지를 다시 읽어 `convention-data.json`을 처음부터 재생성
- `.github/workflows/update-convention-results.yml`
  - 수동 실행용 GitHub Actions

## 기존 결과 전체를 다시 불러오기

GitHub 저장소에서:

1. **Actions**
2. **전당대회 결과 자동 갱신**
3. **Run workflow**
4. `result_url`은 비워둠
5. **Run workflow**

현재 등록된 공식 결과 공지 4건을 모두 다시 읽어 기존 지역별 득표를 처음부터 재생성합니다.

## 새 결과가 발표된 경우

같은 화면의 `result_url`에 새 더불어민주당 공식 공지 URL을 붙여 넣습니다.

예:

```text
https://theminjoo.kr/main/sub/news/view.php?sno=0&brd=1&post=1234567&search=
```

스크립트는 URL을 정규화하고, 표에서 지역과 11명 후보의 득표수를 읽은 뒤 완전성 검증을 통과한 경우에만:

1. `data/convention-sources.json`에 새 공지를 추가
2. 기존 공지 + 새 공지를 모두 다시 읽음
3. `data/convention-data.json`을 처음부터 재생성
4. GitHub Actions가 두 파일을 자동 커밋/푸시

합니다.

## 누계

후보별 누계는 JSON에 별도로 저장하지 않습니다.

`assets/js/convention.js`가 `resultUnits`의 지역별 원득표를 합산하므로,
지역별 결과만 정확하면 발표 누계와 가중치 누계는 자동 갱신됩니다.

## 중요

`content/convention-data.md`는 더 이상 사용하지 않으며 삭제했습니다.
`content/operating-rules.md` 등 다른 Markdown 문서는 그대로 유지됩니다.


## 최초 검증용 등록 순서

이 배포본은 `results` 목록과 지역별 득표를 모두 비운 상태입니다.

GitHub Actions의 `result_url`에 아래 공식 공지를 **하나씩 순서대로** 넣어 실행하면 됩니다.

1. `1219524` — 충남·충북·대전·세종
2. `1219534` — 울산·부산·경남
3. `1219599` — 제주·인천
4. `1219606` — 강원·대구·경북

각 실행은 새 공지를 목록에 등록한 뒤, **지금까지 등록된 모든 결과 공지**를 다시 읽어 `convention-data.json`을 처음부터 재생성합니다.

따라서 첫 실행 후에는 4개 지역, 두 번째 실행 후에는 7개 지역, 세 번째 실행 후에는 9개 지역, 네 번째 실행 후에는 12개 지역이 반영되어야 합니다.

이미 등록된 URL을 다시 입력하면 중복 추가하지 않고 현재 등록된 전체 공지를 다시 읽습니다.


## 2026-08-10 권리당원 선거인단·투표율 검증 구조

`convention-config.json`에 시도별 권리당원 선거인단을 저장합니다.

- 총계: **1,557,894명**
- 국제국: **1,688명**
- 이미지에서 보이지 않는 인천은 이미지 총계에서 나머지 표시 지역과 국제국을 뺀 **58,400명**으로 일치합니다.

결과 공지를 GitHub Actions에 등록하면 다음을 동시에 수행합니다.

1. 당대표 3명 지역별 득표수 추출
2. 최고위원 8명 지역별 득표수 추출
3. 온라인+ARS 합산 최종 투표율 추출
4. `당대표 3명 득표 합계 ÷ 지역 선거인단`과 공식 최종 투표율 교차검증
5. 검증 성공 시 `convention-data.json` 갱신
6. 해당 공식 결과 공지를 하단 `출처`에 자동 등록

투표율 차이가 0.02%p를 넘으면 Action을 실패시키고 결과를 저장하지 않습니다.

### 초기화 상태

이 패치는 테스트를 위해 다음 상태로 초기화되어 있습니다.

- `data/convention-sources.json`의 `results`: 0건
- `data/convention-data.json`의 모든 지역 결과: `scheduled`
- `turnoutRate`, `leaderVotes`, `supremeVotes`: `null`
- `data/convention-data.json`의 하단 `sources`: 빈 배열

일정·투표방식용 고정 reference 3건은 `convention-sources.json`에 보존되어 있으며,
첫 번째 결과 Action 성공 시 결과 공지와 함께 하단 출처에 다시 생성됩니다.


## 최종 운영 구조

- 전국 권리당원 선거인단 공식 총수: **1,527,261명**
- 현재 공식 결과 발표 12개 지역 실제 총선거인수 합계: **435,903명**
- 전국 선거인단 대비: **28.54%**

미발표 지역 잠정 추정치:
- 전남·광주 318,090명
- 전북 194,664명
- 경기 338,979명
- 서울 257,358명

GitHub Actions는 결과 공지에서 `총선거인수 / 투표자수 / 최종 투표율 / 후보 득표 / 출처`를 함께 읽습니다.
미발표 지역은 공지가 등록되는 즉시 추정치를 실제 총선거인수로 대체합니다.

진행률에는 `status == done`인 지역의 실제 총선거인수만 포함하므로 추정치는 포함되지 않습니다.

### 테스트 초기 상태

- 등록된 결과 공지 0건
- 모든 결과 지역 `scheduled`
- 후보 득표 / 투표자수 / 투표율 `null`
- 화면 하단 출처 빈 배열
- 선거인단 수는 유지: 기존 발표 12개 지역은 실제값, 미발표 4개 지역은 추정값
