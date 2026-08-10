#!/usr/bin/env python3
"""
더불어민주당 공식 결과 공지를 읽어 data/convention-data.json을 재생성합니다.

자동 수집:
- 지역별 총선거인수
- 지역별 투표자수
- 온라인 + ARS 합산 최종 투표율
- 당대표 3명 득표수
- 최고위원 8명 득표수
- 하단 출처

검증:
- 당대표 3명 득표 합계 == 투표자수
- 투표자수 / 총선거인수 == 공지 투표율(반올림 오차 허용)
- config에서 confirmed인 기존 지역 총선거인수는 공지값과 동일해야 함
- estimated 지역은 결과 발표 시 공지의 실제 총선거인수로 자동 대체
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
    "충남": "chungnam", "충북": "chungbuk", "대전": "daejeon", "세종": "sejong",
    "울산": "ulsan", "부산": "busan", "경남": "gyeongnam", "제주": "jeju",
    "인천": "incheon", "강원": "gangwon", "대구": "daegu", "경북": "gyeongbuk",
    "전남광주": "jeonnam-gwangju", "전남·광주": "jeonnam-gwangju",
    "전남ㆍ광주": "jeonnam-gwangju", "전남・광주": "jeonnam-gwangju",
    "전북": "jeonbuk", "경기": "gyeonggi", "서울": "seoul",
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


def normalize_region_label(value: str) -> str:
    return (
        normalize_space(value)
        .replace(" ", "")
        .replace("ㆍ", "·")
        .replace("・", "·")
        .replace("‧", "·")
    )


def canonicalize_official_url(url: str) -> str:
    parsed = urlparse(url.strip())
    if parsed.netloc.lower() not in {"theminjoo.kr", "www.theminjoo.kr"}:
        raise ValueError("theminjoo.kr 공식 공지 URL만 사용할 수 있습니다.")
    qs = parse_qs(parsed.query)
    post = (qs.get("post") or [None])[0]
    if not post or not str(post).isdigit():
        raise ValueError("공지 URL에서 post 번호를 찾지 못했습니다.")
    query = urlencode({"brd": "1", "post": str(post)})
    return urlunparse(("https", "theminjoo.kr", "/main/sub/news/view.php", "", query, ""))


def fetch_html(url: str) -> str:
    response = requests.get(
        canonicalize_official_url(url),
        headers={
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/151 Safari/537.36",
            "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.7",
            "Referer": "https://theminjoo.kr/",
        },
        timeout=40,
        allow_redirects=True,
    )
    response.raise_for_status()
    response.encoding = response.apparent_encoding or response.encoding or "utf-8"
    return response.text


def exact_region_from_cells(cells: list[str]) -> str | None:
    for cell in cells:
        compact = normalize_region_label(cell)
        if compact in REGION_ALIASES:
            return REGION_ALIASES[compact]
    return None


def vote_from_cells(cells: list[str]) -> int | None:
    for cell in cells:
        m = re.fullmatch(r"\s*(\d{1,3}(?:,\d{3})+|\d+)\s*표\s*", cell)
        if m:
            return int(m.group(1).replace(",", ""))
    for cell in cells:
        m = re.search(r"(?<!\d)(\d{1,3}(?:,\d{3})+|\d+)\s*표", cell)
        if m:
            return int(m.group(1).replace(",", ""))
    return None


def extract_candidate_results(soup: BeautifulSoup) -> dict:
    found: dict[str, dict[str, dict[str, int]]] = {}
    active_candidate: str | None = None
    for tr in soup.find_all("tr"):
        cells = [normalize_space(c.get_text(" ", strip=True)) for c in tr.find_all(["th", "td"])]
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
    return found


def extract_election_stats(soup: BeautifulSoup) -> dict[str, dict]:
    found: dict[str, dict] = {}
    for table in soup.find_all("table"):
        table_text = normalize_space(table.get_text(" ", strip=True))
        if not all(k in table_text for k in ("총선거인수", "투표자수", "투표율")):
            continue
        for tr in table.find_all("tr"):
            cells = [normalize_space(c.get_text(" ", strip=True)) for c in tr.find_all(["th", "td"])]
            if not cells:
                continue
            region_id = exact_region_from_cells(cells)
            if not region_id:
                continue
            row_text = " ".join(cells)
            people = [
                int(value.replace(",", ""))
                for value in re.findall(r"(\d{1,3}(?:,\d{3})+|\d+)\s*명", row_text)
            ]
            percent_match = re.search(r"(\d{1,3}(?:\.\d+)?)\s*%", row_text)
            if len(people) < 2 or not percent_match:
                continue
            found[region_id] = {
                "eligibleVoters": people[0],
                "voterCount": people[1],
                "turnoutRate": float(percent_match.group(1)),
            }
    return found


def extract_notice_title(soup: BeautifulSoup) -> str:
    for selector in [".board-view-title", ".view-title", ".subject", ".tit", "h1", "h2", "h3"]:
        for node in soup.select(selector):
            text = normalize_space(node.get_text(" ", strip=True))
            if len(text) >= 5 and text != "공지사항" and any(k in text for k in ("결과", "투표", "지도부")):
                return text
    return ""


def extract_results(html: str) -> tuple[dict, dict, str]:
    soup = BeautifulSoup(html, "html.parser")
    return extract_candidate_results(soup), extract_election_stats(soup), extract_notice_title(soup)


def verify_source_result(candidate_results: dict, election_stats: dict, expected_regions: list[str], source_url: str, unit_map: dict) -> None:
    missing_regions = set(expected_regions) - set(candidate_results)
    if missing_regions:
        raise ValueError(f"{source_url}: 후보 득표를 읽지 못한 지역: {', '.join(sorted(missing_regions))}")

    for region_id in expected_regions:
        contests = candidate_results[region_id]
        if set(contests["leader"]) != LEADER_IDS:
            missing = LEADER_IDS - set(contests["leader"])
            raise ValueError(f"{source_url}: {region_id} 당대표 후보 득표 누락: {', '.join(sorted(missing))}")
        if set(contests["supreme"]) != SUPREME_IDS:
            missing = SUPREME_IDS - set(contests["supreme"])
            raise ValueError(f"{source_url}: {region_id} 최고위원 후보 득표 누락: {', '.join(sorted(missing))}")
        if region_id not in election_stats:
            raise ValueError(f"{source_url}: {region_id}의 총선거인수·투표자수·투표율 표를 찾지 못했습니다.")

        stats = election_stats[region_id]
        eligible = int(stats["eligibleVoters"])
        voters = int(stats["voterCount"])
        turnout = float(stats["turnoutRate"])

        leader_total = sum(int(v) for v in contests["leader"].values())
        if leader_total != voters:
            raise ValueError(
                f"{source_url}: {region_id} 당대표 득표합 {leader_total:,}표와 "
                f"공지 투표자수 {voters:,}명이 일치하지 않습니다."
            )

        calculated = voters / eligible * 100
        if abs(calculated - turnout) > 0.02:
            raise ValueError(
                f"{source_url}: {region_id} 투표율 검산 실패. "
                f"{voters:,}/{eligible:,}={calculated:.4f}% vs 공지 {turnout:.2f}%"
            )

        unit = unit_map.get(region_id)
        if not unit:
            raise ValueError(f"{source_url}: config에 없는 지역입니다: {region_id}")

        baseline = unit.get("eligibleVoters")
        baseline_status = unit.get("eligibleVotersStatus")
        if baseline_status == "confirmed" and baseline is not None and int(baseline) != eligible:
            raise ValueError(
                f"{source_url}: {region_id} 기존 확정 총선거인수 {int(baseline):,}명과 "
                f"공지값 {eligible:,}명이 다릅니다."
            )
        if baseline_status == "estimated" and baseline is not None:
            print(f"  ↳ {region_id} 추정치 {int(baseline):,}명 → 공식 확정 {eligible:,}명으로 대체")

        print(f"  ✓ {region_id}: 선거인단 {eligible:,}명 · 투표 {voters:,}명 · 투표율 {turnout:.2f}%")


def new_output_from_config(config: dict) -> dict:
    data = {
        "meta": copy.deepcopy(config["meta"]),
        "electorate": copy.deepcopy(config.get("electorate", {})),
        "rules": copy.deepcopy(config["rules"]),
        "candidates": copy.deepcopy(config["candidates"]),
        "schedule": copy.deepcopy(config["schedule"]),
        "resultUnits": [],
        "sources": [],
    }
    for skeleton in config["resultUnits"]:
        unit = copy.deepcopy(skeleton)
        unit["status"] = "scheduled"
        unit["voterCount"] = None
        unit["turnoutRate"] = None
        unit["leaderVotes"] = None
        unit["supremeVotes"] = None
        data["resultUnits"].append(unit)
    return data


def source_label(expected_regions: list[str], unit_map: dict) -> str:
    names = [unit_map[r]["name"] for r in expected_regions if r in unit_map]
    return "·".join(names) + " 권리당원 투표 결과"


def add_source_url(config: dict, sources: dict, url: str) -> bool:
    canonical = canonicalize_official_url(url)
    if any(canonicalize_official_url(item["url"]) == canonical for item in sources.get("results", [])):
        print(f"이미 등록된 결과 공지입니다: {canonical}")
        return False

    unit_map = {u["id"]: u for u in config["resultUnits"]}
    html = fetch_html(canonical)
    candidate_results, election_stats, title = extract_results(html)
    if not candidate_results:
        raise ValueError("새 공지에서 지역별 후보 득표표를 찾지 못했습니다.")

    expected_regions = list(candidate_results.keys())
    verify_source_result(candidate_results, election_stats, expected_regions, canonical, unit_map)

    label = title or source_label(expected_regions, unit_map)
    sources.setdefault("results", []).append({
        "url": canonical,
        "expectedRegions": expected_regions,
        "label": label,
    })
    print(f"새 공지 등록: {canonical}")
    print(f"하단 출처 자동 추가: {label}")
    return True


def rebuild(config: dict, sources: dict) -> dict:
    data = new_output_from_config(config)
    unit_map = {u["id"]: u for u in data["resultUnits"]}

    for source in sources.get("results", []):
        url = canonicalize_official_url(source["url"])
        expected_regions = source["expectedRegions"]
        print(f"가져오는 중: {source.get('label', url)}")
        candidate_results, election_stats, title = extract_results(fetch_html(url))
        verify_source_result(candidate_results, election_stats, expected_regions, url, unit_map)

        for region_id in expected_regions:
            unit = unit_map[region_id]
            stats = election_stats[region_id]
            unit["eligibleVoters"] = int(stats["eligibleVoters"])
            unit["eligibleVotersStatus"] = "confirmed"
            unit["voterCount"] = int(stats["voterCount"])
            unit["turnoutRate"] = float(stats["turnoutRate"])
            unit["leaderVotes"] = candidate_results[region_id]["leader"]
            unit["supremeVotes"] = candidate_results[region_id]["supreme"]
            unit["status"] = "done"
            unit["sourceUrl"] = url

        label = source.get("label") or title or source_label(expected_regions, unit_map)
        data["sources"].append({
            "label": f"더불어민주당 공식 공지 · {label}",
            "description": (
                "지역별 총선거인수·투표자수·최종 투표율 및 "
                "당대표·최고위원 득표 원자료 · GitHub Actions 자동 반영"
            ),
            "url": url,
        })

    for source in sources.get("references", []):
        data["sources"].append({
            "label": f"더불어민주당 공식 공지 · {source['label']}",
            "description": source.get("description", ""),
            "url": canonicalize_official_url(source["url"]),
        })

    official_total = int(data.get("electorate", {}).get("officialTotalEligibleVoters") or 0)
    announced_electorate = sum(
        int(u.get("eligibleVoters") or 0)
        for u in data["resultUnits"]
        if u.get("status") == "done"
    )
    announced_regions = sum(1 for u in data["resultUnits"] if u.get("status") == "done")
    progress = announced_electorate / official_total * 100 if official_total else 0

    data["electorate"]["announcedEligibleVoters"] = announced_electorate
    data["electorate"]["announcedRegionCount"] = announced_regions
    data["electorate"]["resultProgressRate"] = progress

    now = datetime.now(ZoneInfo("Asia/Seoul"))
    data["meta"]["updatedAt"] = now.isoformat(timespec="seconds")
    data["meta"]["dataStatus"] = (
        f"{now.month}월 {now.day}일 기준 공식 결과 공지 "
        f"{len(sources.get('results', []))}건 · {announced_regions}개 지역 · "
        f"선거인단 기준 {progress:.1f}% 결과 발표"
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
            sources_changed = add_source_url(config, sources, args.add_url.strip())

        data = rebuild(config, sources)

        if args.dry_run:
            print(json.dumps(data["meta"], ensure_ascii=False, indent=2))
            print(json.dumps(data["electorate"], ensure_ascii=False, indent=2))
            print("DRY RUN: 파일은 저장하지 않았습니다.")
            return 0

        if sources_changed:
            save_json(SOURCES_FILE, sources)
        save_json(OUTPUT_FILE, data)
        print(f"완료: {OUTPUT_FILE.relative_to(ROOT)}")
        return 0

    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
