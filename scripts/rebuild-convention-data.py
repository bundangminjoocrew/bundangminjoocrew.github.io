#!/usr/bin/env python3
"""
더불어민주당 공식 결과 공지들을 모두 다시 읽어 data/convention-data.json을 재생성합니다.

기본 실행:
  python3 scripts/rebuild-convention-data.py

새 결과 공지 추가 + 전체 재구축:
  python3 scripts/rebuild-convention-data.py --add-url "https://theminjoo.kr/..."

핵심 원칙:
- 지역별 득표수는 convention-data.json에 수기로 관리하지 않습니다.
- convention-sources.json의 공식 공지 목록을 source of truth로 사용합니다.
- 매 실행마다 모든 결과를 빈 상태에서 다시 구성합니다.
- 후보별 누계는 저장하지 않습니다. 브라우저의 convention.js가 resultUnits를 합산합니다.
"""

from __future__ import annotations

import argparse
import copy
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
CONFIG_FILE = ROOT / "data" / "convention-config.json"
SOURCES_FILE = ROOT / "data" / "convention-sources.json"
OUTPUT_FILE = ROOT / "data" / "convention-data.json"

CANDIDATES = {
    "송영길": ("leader", "song-younggil"),
    "정청래": ("leader", "jung-chungrae"),
    "김민석": ("leader", "kim-minseok"),
    "최민희": ("supreme", "choi-minhee"),
    "김용": ("supreme", "kim-yong"),
    "김영호": ("supreme", "kim-youngho"),
    "서미화": ("supreme", "seo-mihwa"),
    "한민수": ("supreme", "han-minsoo"),
    "이성윤": ("supreme", "lee-sungyoon"),
    "박선원": ("supreme", "park-sunwon"),
    "임미애": ("supreme", "lim-miae"),
}

REGION_ALIASES = {
    "충남": "chungnam",
    "충북": "chungbuk",
    "대전": "daejeon",
    "세종": "sejong",
    "울산": "ulsan",
    "부산": "busan",
    "경남": "gyeongnam",
    "제주": "jeju",
    "인천": "incheon",
    "강원": "gangwon",
    "대구": "daegu",
    "경북": "gyeongbuk",
    "전남광주": "jeonnam-gwangju",
    "전남·광주": "jeonnam-gwangju",
    "전북": "jeonbuk",
    "경기": "gyeonggi",
    "서울": "seoul",
}

LEADER_IDS = {cid for contest, cid in CANDIDATES.values() if contest == "leader"}
SUPREME_IDS = {cid for contest, cid in CANDIDATES.values() if contest == "supreme"}


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, obj: dict) -> None:
    text = json.dumps(obj, ensure_ascii=False, indent=2) + "\n"
    json.loads(text)
    path.write_text(text, encoding="utf-8")


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def canonicalize_official_url(url: str) -> str:
    parsed = urlparse(url.strip())
    host = parsed.netloc.lower()
    if host not in {"theminjoo.kr", "www.theminjoo.kr"}:
        raise ValueError("theminjoo.kr 공식 공지 URL만 사용할 수 있습니다.")

    qs = parse_qs(parsed.query)
    post = (qs.get("post") or [None])[0]
    if not post or not str(post).isdigit():
        raise ValueError("공지 URL에서 post 번호를 찾지 못했습니다.")

    query = urlencode({"brd": "1", "post": str(post)})
    return urlunparse(("https", "theminjoo.kr", "/main/sub/news/view.php", "", query, ""))


def fetch_html(url: str) -> str:
    canonical = canonicalize_official_url(url)
    session = requests.Session()
    headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/151 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.7",
        "Referer": "https://theminjoo.kr/",
    }
    response = session.get(canonical, headers=headers, timeout=40, allow_redirects=True)
    response.raise_for_status()
    response.encoding = response.apparent_encoding or response.encoding or "utf-8"
    return response.text


def exact_region_from_cells(cells: list[str]) -> str | None:
    for cell in cells:
        compact = cell.replace(" ", "")
        if compact in REGION_ALIASES:
            return REGION_ALIASES[compact]
    return None


def vote_from_cells(cells: list[str]) -> int | None:
    # 가장 안전한 경우: "3,559표"처럼 표 단위가 붙은 셀.
    for cell in cells:
        m = re.fullmatch(r"\s*(\d{1,3}(?:,\d{3})+|\d+)\s*표\s*", cell)
        if m:
            return int(m.group(1).replace(",", ""))

    # 셀 안에 설명과 함께 들어간 경우.
    for cell in cells:
        m = re.search(r"(?<!\d)(\d{1,3}(?:,\d{3})+|\d+)\s*표", cell)
        if m:
            return int(m.group(1).replace(",", ""))
    return None


def extract_results(html: str) -> tuple[dict, str]:
    soup = BeautifulSoup(html, "html.parser")
    title = normalize_space(soup.title.get_text(" ", strip=True) if soup.title else "")
    found: dict[str, dict[str, dict[str, int]]] = {}
    active_candidate: str | None = None

    for tr in soup.find_all("tr"):
        cells = [normalize_space(cell.get_text(" ", strip=True)) for cell in tr.find_all(["th", "td"])]
        if not cells:
            continue
        row_text = " | ".join(cells)

        explicit_candidate = next((name for name in CANDIDATES if name in row_text), None)
        if explicit_candidate:
            active_candidate = explicit_candidate

        if not active_candidate:
            continue

        region_id = exact_region_from_cells(cells)
        if not region_id:
            continue

        vote = vote_from_cells(cells)
        if vote is None:
            continue

        contest, candidate_id = CANDIDATES[active_candidate]
        found.setdefault(region_id, {"leader": {}, "supreme": {}})
        found[region_id][contest][candidate_id] = vote

    return found, title


def verify_source_result(found: dict, expected_regions: list[str], source_url: str) -> None:
    actual_regions = set(found)
    expected = set(expected_regions)

    missing_regions = expected - actual_regions
    if missing_regions:
        raise ValueError(
            f"{source_url}: 예상 지역을 모두 읽지 못했습니다: {', '.join(sorted(missing_regions))}"
        )

    unexpected = actual_regions - expected
    if unexpected:
        raise ValueError(
            f"{source_url}: 예상하지 않은 지역이 감지되었습니다: {', '.join(sorted(unexpected))}"
        )

    for region_id in expected_regions:
        contests = found[region_id]
        if set(contests["leader"]) != LEADER_IDS:
            missing = LEADER_IDS - set(contests["leader"])
            raise ValueError(
                f"{source_url}: {region_id} 당대표 후보 득표가 불완전합니다: {', '.join(sorted(missing))}"
            )
        if set(contests["supreme"]) != SUPREME_IDS:
            missing = SUPREME_IDS - set(contests["supreme"])
            raise ValueError(
                f"{source_url}: {region_id} 최고위원 후보 득표가 불완전합니다: {', '.join(sorted(missing))}"
            )


def new_output_from_config(config: dict) -> dict:
    data = {
        "meta": copy.deepcopy(config["meta"]),
        "rules": copy.deepcopy(config["rules"]),
        "candidates": copy.deepcopy(config["candidates"]),
        "schedule": copy.deepcopy(config["schedule"]),
        "resultUnits": [],
        "sources": [],
    }
    for skeleton in config["resultUnits"]:
        unit = copy.deepcopy(skeleton)
        unit["status"] = "scheduled"
        unit["leaderVotes"] = None
        unit["supremeVotes"] = None
        data["resultUnits"].append(unit)
    return data


def add_source_url(sources: dict, url: str) -> bool:
    canonical = canonicalize_official_url(url)
    if any(canonicalize_official_url(item["url"]) == canonical for item in sources.get("results", [])):
        print(f"이미 등록된 결과 공지입니다: {canonical}")
        return False

    html = fetch_html(canonical)
    found, title = extract_results(html)
    if not found:
        raise ValueError("새 공지에서 지역별 후보 득표표를 찾지 못했습니다.")

    # 신규 공지는 파싱된 지역을 기대 지역으로 자동 등록.
    expected_regions = list(found.keys())

    # 후보 세트가 완전한지 먼저 검증.
    verify_source_result(found, expected_regions, canonical)

    sources.setdefault("results", []).append({
        "url": canonical,
        "expectedRegions": expected_regions,
        "label": title or "추가 결과 공지",
    })
    print(f"새 공지 등록: {canonical}")
    print(f"감지 지역: {', '.join(expected_regions)}")
    return True


def rebuild(config: dict, sources: dict) -> dict:
    data = new_output_from_config(config)
    unit_map = {unit["id"]: unit for unit in data["resultUnits"]}

    for source in sources.get("results", []):
        url = canonicalize_official_url(source["url"])
        expected_regions = source["expectedRegions"]
        print(f"가져오는 중: {source.get('label', url)}")
        html = fetch_html(url)
        found, title = extract_results(html)
        verify_source_result(found, expected_regions, url)

        for region_id in expected_regions:
            if region_id not in unit_map:
                raise ValueError(f"config에 없는 지역 ID입니다: {region_id}")
            unit = unit_map[region_id]
            unit["leaderVotes"] = found[region_id]["leader"]
            unit["supremeVotes"] = found[region_id]["supreme"]
            unit["status"] = "done"
            unit["sourceUrl"] = url

        data["sources"].append({
            "label": f"더불어민주당 공식 공지 · {source.get('label') or title or '투표 결과'}",
            "description": "당대표·최고위원 지역별 득표 원자료 · GitHub Actions 자동 반영",
            "url": url,
        })

    for source in sources.get("references", []):
        data["sources"].append({
            "label": f"더불어민주당 공식 공지 · {source['label']}",
            "description": source.get("description", ""),
            "url": canonicalize_official_url(source["url"]),
        })

    now = datetime.now(ZoneInfo("Asia/Seoul"))
    completed = [u for u in data["resultUnits"] if u["status"] == "done"]
    data["meta"]["updatedAt"] = now.isoformat(timespec="seconds")
    data["meta"]["dataStatus"] = (
        f"{now.month}월 {now.day}일 기준 더불어민주당 공식 결과 공지 "
        f"{len(sources.get('results', []))}건 자동 반영 · {len(completed)}개 지역"
    )

    return data


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--add-url", default="", help="새 theminjoo.kr 결과 공지 URL")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    try:
        config = load_json(CONFIG_FILE)
        sources = load_json(SOURCES_FILE)

        sources_changed = False
        if args.add_url.strip():
            sources_changed = add_source_url(sources, args.add_url.strip())

        data = rebuild(config, sources)

        if args.dry_run:
            print(json.dumps(data["meta"], ensure_ascii=False, indent=2))
            print("DRY RUN: 파일은 저장하지 않았습니다.")
            return 0

        if sources_changed:
            save_json(SOURCES_FILE, sources)
        save_json(OUTPUT_FILE, data)

        print(f"완료: {OUTPUT_FILE.relative_to(ROOT)}")
        print("누계는 저장하지 않습니다. convention.js가 지역별 원득표에서 자동 합산합니다.")
        return 0
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
