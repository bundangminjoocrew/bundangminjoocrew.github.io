const DATA_PATH = "./data/convention-data.json";
const COLOR_VARS = [
  "var(--candidate-1)",
  "var(--candidate-2)",
  "var(--candidate-3)",
  "var(--candidate-4)",
  "var(--candidate-5)",
  "var(--candidate-6)",
  "var(--candidate-7)",
  "var(--candidate-8)"
];

const state = {
  data: null,
  leaderMode: "published",
  supremeMode: "published",
  regionContest: "leader",
  selectedLeaderCandidate: null,
  selectedSupremeCandidate: null,
  calendarDateKey: null
};

const els = {
  title: document.querySelector("#document-title"),
  meta: document.querySelector("#document-meta"),
  status: document.querySelector("#convention-status"),
  app: document.querySelector("#convention-app"),
  eventName: document.querySelector("#event-name"),
  eventDescription: document.querySelector("#event-description"),
  dday: document.querySelector("#dday-badge"),
  updated: document.querySelector("#hero-updated"),
  heroStats: document.querySelector("#hero-stats"),
  calendar: document.querySelector("#calendar"),
  scheduleDetail: document.querySelector("#schedule-detail"),
  leaderTabs: document.querySelector("#leader-metric-tabs"),
  leaderCaption: document.querySelector("#leader-caption"),
  leaderSummary: document.querySelector("#leader-summary"),
  leaderBars: document.querySelector("#leader-bars"),
  supremeTabs: document.querySelector("#supreme-metric-tabs"),
  supremeCaption: document.querySelector("#supreme-caption"),
  supremeRanking: document.querySelector("#supreme-ranking"),
  regionList: document.querySelector("#region-list"),
  methodGrid: document.querySelector("#method-grid"),
  methodNote: document.querySelector("#method-note"),
  sourceList: document.querySelector("#source-list"),
  topButton: document.querySelector("#top-button"),
  backLink: document.querySelector("#back-link")
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function formatNumber(value, maximumFractionDigits = 0) {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits }).format(value);
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${value.toFixed(2)}%` : "-";
}

function formatDate(dateString, options = {}) {
  if (!dateString) return "";
  const date = new Date(`${dateString}T00:00:00+09:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("ko-KR", options).format(date);
}

function getCandidateMap(contest) {
  return new Map(state.data.candidates[contest].map((candidate, index) => [candidate.id, { ...candidate, index }]));
}

function candidateColor(index) {
  return COLOR_VARS[index % COLOR_VARS.length];
}

function initials(name) {
  return [...String(name || "?")].slice(0, 2).join("");
}

function candidateAvatar(candidate, sizeClass = "candidate-avatar") {
  const color = candidateColor(candidate.index ?? 0);
  const fallback = escapeHtml(initials(candidate.name));
  if (candidate.image) {
    return `<span class="${sizeClass} has-image" style="--candidate-color:${color}"><span class="avatar-fallback" aria-hidden="true">${fallback}</span><img src="${escapeHtml(candidate.image)}" alt="${escapeHtml(candidate.name)}" loading="lazy"></span>`;
  }
  return `<span class="${sizeClass}" style="--candidate-color:${color}"><span class="avatar-fallback" aria-hidden="true">${fallback}</span></span>`;
}

function normalizeVoteObject(votes, contest) {
  if (!votes || typeof votes !== "object") return null;
  const ids = state.data.candidates[contest].map((candidate) => candidate.id);
  const normalized = {};
  let hasAny = false;
  ids.forEach((id) => {
    const value = votes[id];
    if (Number.isFinite(value)) {
      normalized[id] = value;
      hasAny = true;
    } else {
      normalized[id] = null;
    }
  });
  return hasAny ? normalized : null;
}

function calculateFromUnits(contest, weighted = false) {
  const voteKey = contest === "leader" ? "leaderVotes" : "supremeVotes";
  const candidates = state.data.candidates[contest];
  const totals = Object.fromEntries(candidates.map((candidate) => [candidate.id, 0]));
  let enteredUnits = 0;
  let totalUnits = 0;

  state.data.resultUnits.forEach((unit) => {
    const votes = normalizeVoteObject(unit[voteKey], contest);
    if (!votes) return;
    if (contest === "supreme" && unit.supremeComplete === false) return;
    totalUnits += 1;
    enteredUnits += 1;
    const multiplier = weighted ? (Number(unit.weight) || 1) : 1;
    candidates.forEach((candidate) => {
      const raw = votes[candidate.id];
      if (Number.isFinite(raw)) totals[candidate.id] += raw * multiplier;
    });
  });

  const grandTotal = Object.values(totals).reduce((sum, value) => sum + value, 0);
  return {
    totals,
    grandTotal,
    enteredUnits,
    availableUnits: state.data.resultUnits.filter((unit) => normalizeVoteObject(unit[voteKey], contest)).length
  };
}

function calculatePublished(contest) {
  const result = calculateFromUnits(contest, false);
  const voteKey = contest === "leader" ? "leaderVotes" : "supremeVotes";
  const completedUnits = state.data.resultUnits.filter((unit) => normalizeVoteObject(unit[voteKey], contest));

  if (!completedUnits.length) {
    return {
      ...result,
      label: "발표 누계",
      note: "아직 공식 결과가 반영된 지역이 없습니다."
    };
  }

  const latestDate = completedUnits.reduce((latest, unit) => {
    const date = String(unit.date || "");
    return date > latest ? date : latest;
  }, "");
  const latestUnits = completedUnits.filter((unit) => String(unit.date || "") === latestDate);
  const latestNames = latestUnits.map((unit) => unit.name).filter(Boolean).join("·");
  const label = latestDate
    ? `${formatDate(latestDate, { month: "numeric", day: "numeric" })} 발표 누계`
    : "발표 누계";
  const note = latestNames
    ? `${latestNames} 결과까지 공식 공지에서 가져온 지역별 원득표 ${completedUnits.length}개 결과 단위를 자동 합산했습니다.`
    : `공식 공지에서 가져온 지역별 원득표 ${completedUnits.length}개 결과 단위를 자동 합산했습니다.`;

  return { ...result, label, note };
}

function rankingFromResult(result, contest) {
  const candidateMap = getCandidateMap(contest);
  return Object.entries(result.totals)
    .map(([id, votes]) => {
      const candidate = candidateMap.get(id);
      const percent = result.grandTotal > 0 ? (votes / result.grandTotal) * 100 : 0;
      return { ...candidate, votes, percent };
    })
    .sort((a, b) => b.votes - a.votes);
}

function renderHeader() {
  const { meta } = state.data;
  const leaderSnapshot = calculatePublished("leader");
  const leaderTop = rankingFromResult(leaderSnapshot, "leader")[0];

  const officialTotal = Number(state.data.electorate?.officialTotalEligibleVoters);
  const doneUnits = state.data.resultUnits.filter((unit) => unit.status === "done");
  const announcedEligible = doneUnits.reduce(
    (sum, unit) => sum + (Number(unit.eligibleVoters) || 0),
    0
  );
  const progressRate = Number.isFinite(officialTotal) && officialTotal > 0
    ? (announcedEligible / officialTotal) * 100
    : 0;

  els.heroStats.innerHTML = [
    ["현재 1위", leaderTop ? `${leaderTop.name} ${formatPercent(leaderTop.percent)}` : "-"],
    ["최종 선출", formatDate(meta.electionDate, { month: "numeric", day: "numeric" })],
    [state.data.electorate?.label || "권리당원 선거인단", Number.isFinite(officialTotal) ? `${formatNumber(officialTotal)}명` : "-"]
  ].map(([label, value]) => `<div class="hero-stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");

  let progressEl = document.getElementById("electorate-progress");
  if (!progressEl) {
    progressEl = document.createElement("div");
    progressEl.id = "electorate-progress";
    progressEl.className = "electorate-progress";
    els.heroStats.insertAdjacentElement("afterend", progressEl);
  }

  progressEl.innerHTML = `
    <div class="electorate-progress-head">
      <span>전국 권리당원 선거인단 기준</span>
      <strong>${progressRate.toFixed(1)}% 결과 발표 완료</strong>
    </div>
    <div class="electorate-progress-track" role="progressbar"
      aria-label="권리당원 선거인단 기준 결과 발표 진행률"
      aria-valuemin="0" aria-valuemax="100"
      aria-valuenow="${Math.min(100, Math.max(0, progressRate)).toFixed(1)}">
      <span style="width:${Math.min(100, Math.max(0, progressRate))}%"></span>
    </div>
    <div class="electorate-progress-meta">
      <span>${formatNumber(announcedEligible)}명분 결과 발표</span>
      <span>전체 ${Number.isFinite(officialTotal) ? formatNumber(officialTotal) : "-"}명</span>
    </div>
  `;

  els.pageUpdated.textContent = meta.updatedAt ? `업데이트 ${formatDateTime(meta.updatedAt)}` : "";
  els.dataStatus.textContent = meta.dataStatus || "";
}
function renderCalendar() {
  const { meta, schedule } = state.data;
  const start = new Date(`${meta.calendarStart}T00:00:00+09:00`);
  const count = Number(meta.calendarDays) || 14;
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const dates = [];

  for (let i = 0; i < count; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push({ date, key: dateKey(date) });
  }

  const currentKst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const currentKey = dateKey(currentKst);
  state.calendarDateKey = currentKey;

  // PC: 캘린더 위에 기간 이벤트를 여러 날짜를 가로지르는 막대로 배치한다.
  let desktop = `<div class="calendar-desktop"><div class="calendar-weekdays">${weekdays.map((day) => `<div class="calendar-weekday">${day}</div>`).join("")}</div>`;

  for (let weekStart = 0; weekStart < dates.length; weekStart += 7) {
    const weekDates = dates.slice(weekStart, weekStart + 7);
    if (!weekDates.length) continue;
    const weekFirst = weekDates[0].key;
    const weekLast = weekDates[weekDates.length - 1].key;

    const segments = [];
    schedule.forEach((event, index) => {
      const eventEnd = event.endDate || event.date;
      if (eventEnd < weekFirst || event.date > weekLast) return;
      const clippedStart = event.date < weekFirst ? weekFirst : event.date;
      const clippedEnd = eventEnd > weekLast ? weekLast : eventEnd;
      const startCol = daysBetween(weekFirst, clippedStart) + 1;
      const endCol = daysBetween(weekFirst, clippedEnd) + 1;
      segments.push({ event, index, startCol, endCol, span: endCol - startCol + 1 });
    });

    const positioned = assignCalendarLanes(segments);
    const laneCount = Math.max(1, ...positioned.map((segment) => segment.lane));

    desktop += `<div class="calendar-week-row" style="--calendar-lanes:${laneCount}">`;
    desktop += weekDates.map(({ date, key }) => {
      const month = date.getMonth() + 1;
      return `<div class="calendar-day calendar-day-pc ${key === currentKey ? "today" : ""}" data-date="${key}"><div class="calendar-date"><span>${month}.</span><strong>${date.getDate()}</strong></div></div>`;
    }).join("");

    desktop += `<div class="calendar-span-layer">${positioned.map(({ event, index, startCol, span, lane }) => {
      const scope = event.scope ? `<small>${escapeHtml(event.scope)}</small>` : "";
      return `<button class="calendar-event ${escapeHtml(event.type || "regional")}${phaseClass(event)}" type="button" data-event-index="${index}" style="--event-start:${startCol};--event-span:${span};--event-lane:${lane}"><span>${escapeHtml(event.shortTitle || event.title.replace(" 순회경선", ""))}</span>${scope}</button>`;
    }).join("")}</div>`;
    desktop += `</div>`;
  }
  desktop += `</div>`;

  // 모바일: 지난 날짜는 숨기고, 최종 전당대회일까지만 표시한다.
  // 기간 이벤트는 진행되는 각 날짜에 반복 노출한다.
  const mobileEndKey = meta.electionDate || dates.at(-1)?.key || currentKey;
  const mobileDates = dates.filter(({ key }) => key >= currentKey && key <= mobileEndKey);

  let mobile = `<div class="calendar-mobile">`;
  if (!mobileDates.length) {
    mobile += `<div class="calendar-mobile-finished">전당대회 일정이 종료되었습니다.</div>`;
  } else {
    mobileDates.forEach(({ date, key }) => {
      const events = schedule.map((event, index) => ({ ...event, index })).filter((event) => eventOccursOn(event, key));
      const month = date.getMonth() + 1;
      mobile += `<div class="calendar-mobile-day ${key === currentKey ? "today" : ""}" data-date="${key}">`;
      mobile += `<div class="calendar-mobile-date"><span>${month}.</span><strong>${date.getDate()}</strong></div>`;
      mobile += `<div class="calendar-mobile-events">${events.map((event) => {
        const note = event.mobileNote || event.scope || (event.endDate && event.endDate !== event.date ? formatScheduleRange(event) : "");
        return `<button class="calendar-event ${escapeHtml(event.type || "regional")}${phaseClass(event)}" type="button" data-event-index="${event.index}"><span>${escapeHtml(event.shortTitle || event.title.replace(" 순회경선", ""))}</span>${note ? `<small>${escapeHtml(note)}</small>` : ""}</button>`;
      }).join("")}</div>`;
      mobile += `</div>`;
    });
  }
  mobile += `</div>`;

  els.calendar.innerHTML = desktop + mobile;

  els.calendar.querySelectorAll(".calendar-event").forEach((button) => {
    button.addEventListener("click", () => {
      const event = schedule[Number(button.dataset.eventIndex)];
      els.scheduleDetail.hidden = false;
      els.scheduleDetail.innerHTML = `<strong>${escapeHtml(formatScheduleRange(event))} · ${escapeHtml(event.title)}</strong><span>${escapeHtml(event.detail || "")}</span>`;
    });
  });
}

function getLeaderResult(mode) {
  if (mode === "published") return { ...calculatePublished("leader"), mode };
  return { ...calculateFromUnits("leader", mode === "weighted"), mode };
}

function renderLeader() {
  const result = getLeaderResult(state.leaderMode);
  const ranking = rankingFromResult(result, "leader");
  const entered = calculateFromUnits("leader", false).availableUnits;

  if (state.leaderMode === "published") {
    els.leaderCaption.textContent = `${result.label || "발표 누계"} · ${result.note || ""}`;
  } else {
    const modeLabel = state.leaderMode === "weighted" ? "가중치 적용" : "가중치 미적용";
    els.leaderCaption.textContent = `${modeLabel} 자동계산 · 득표수가 입력된 ${entered}개 결과 단위만 합산합니다.`;
  }

  els.leaderSummary.innerHTML = ranking.map((candidate, index) => {
    const color = candidateColor(candidate.index);
    const voteText = state.leaderMode === "weighted"
      ? `${formatNumber(candidate.votes, 2)} 환산표`
      : `${formatNumber(candidate.votes)}표`;
    const selected = state.selectedLeaderCandidate === candidate.id;
    return `<button type="button" class="candidate-card ${index === 0 ? "rank-1" : ""} ${selected ? "is-selected" : ""}" data-candidate-id="${escapeHtml(candidate.id)}" aria-pressed="${selected ? "true" : "false"}" style="--candidate-color:${color}">
      ${candidateAvatar(candidate)}
      <span class="candidate-rank">${index + 1}위</span>
      <strong class="candidate-name">${escapeHtml(candidate.name)}</strong>
      <span class="candidate-percent">${formatPercent(candidate.percent)}</span>
      <span class="candidate-votes">${escapeHtml(voteText)}</span>
      <span class="candidate-action">${selected ? "지역별 득표 닫기" : "지역별 득표 보기"}</span>
    </button>`;
  }).join("");

  const max = Math.max(...ranking.map((item) => item.percent), 1);
  const bars = ranking.map((candidate) => {
    const width = Math.max(2, (candidate.percent / max) * 100);
    const selected = state.selectedLeaderCandidate === candidate.id;
    return `<div class="result-bar-row ${selected ? "is-selected" : ""}" style="--candidate-color:${candidateColor(candidate.index)}">
      <span class="result-bar-name">${escapeHtml(candidate.short || candidate.name)}</span>
      <div class="result-bar-track"><div class="result-bar-fill" style="--bar-width:${width}%"></div></div>
      <span class="result-bar-value">${formatPercent(candidate.percent)}</span>
    </div>`;
  }).join("");
  els.leaderBars.innerHTML = bars + candidateRegionalDetail("leader", state.selectedLeaderCandidate, state.leaderMode);
}

function candidateRegionalDetail(contest, candidateId, mode) {
  if (!candidateId) return "";
  const candidateMap = getCandidateMap(contest);
  const candidate = candidateMap.get(candidateId);
  if (!candidate) return "";
  const key = contest === "leader" ? "leaderVotes" : "supremeVotes";
  const rows = state.data.resultUnits
    .map((unit, order) => {
      const votes = normalizeVoteObject(unit[key], contest);
      if (!votes || !Number.isFinite(votes[candidateId])) return null;
      const data = getUnitVoteData(unit, contest);
      if (!data) return null;
      const candidateRow = data.ranking.find((row) => row.id === candidateId);
      if (!candidateRow) return null;
      return { unit, order, ...candidateRow };
    })
    .filter(Boolean)
    .sort((a, b) => String(a.unit.date || "").localeCompare(String(b.unit.date || "")) || a.order - b.order);

  if (!rows.length) return "";
  const weightedMode = mode === "weighted";
  const body = rows.map((row) => {
    const multiplier = Number(row.unit.weight) || 1;
    const weighted = multiplier > 1;
    const voteLabel = weightedMode && weighted
      ? `${formatNumber(row.votes * multiplier, 2)} 환산표`
      : `${formatNumber(row.votes)}표`;
    return `<div class="candidate-detail-row">
      <span class="candidate-detail-region"><strong>${escapeHtml(row.unit.name)}</strong>${weighted ? `<small>전략지역 ×${multiplier.toFixed(2)}</small>` : ""}</span>
      <span class="candidate-detail-score"><strong>${formatPercent(row.percent)}</strong><small>${escapeHtml(voteLabel)}</small></span>
    </div>`;
  }).join("");

  return `<section class="candidate-detail" aria-live="polite">
    <div class="candidate-detail-heading"><span><strong>${escapeHtml(candidate.name)}</strong> 지역별 득표</span><small>후보를 다시 누르면 닫힙니다</small></div>
    <div class="candidate-detail-list">${body}</div>
  </section>`;
}

function getSupremeResult(mode) {
  if (mode === "published") return { ...calculatePublished("supreme"), mode };
  return { ...calculateFromUnits("supreme", mode === "weighted"), mode };
}

function renderSupreme() {
  const result = getSupremeResult(state.supremeMode);
  const ranking = rankingFromResult(result, "supreme");
  const entered = calculateFromUnits("supreme", false).availableUnits;

  if (state.supremeMode === "published") {
    els.supremeCaption.textContent = `${result.label || "발표 누계"} · ${result.note || ""}`;
  } else {
    const modeLabel = state.supremeMode === "weighted" ? "가중치 적용" : "가중치 미적용";
    els.supremeCaption.textContent = `${modeLabel} 자동계산 · 득표수가 입력된 ${entered}개 지역을 합산합니다.`;
  }

  const topFive = ranking.slice(0, 5);
  const rest = ranking.slice(5);
  const max = Math.max(...ranking.map((item) => item.percent), 1);

  const featured = topFive.map((candidate, index) => {
    const voteText = state.supremeMode === "weighted"
      ? `${formatNumber(candidate.votes, 2)} 환산표`
      : `${formatNumber(candidate.votes)}표`;
    const selected = state.selectedSupremeCandidate === candidate.id;
    return `<button type="button" class="candidate-card supreme-featured-card ${index === 0 ? "rank-1" : ""} ${selected ? "is-selected" : ""}" data-candidate-id="${escapeHtml(candidate.id)}" aria-pressed="${selected ? "true" : "false"}" style="--candidate-color:${candidateColor(candidate.index)}">
      ${candidateAvatar(candidate)}
      <span class="candidate-rank">${index + 1}위</span>
      <strong class="candidate-name">${escapeHtml(candidate.name)}</strong>
      <span class="candidate-percent">${formatPercent(candidate.percent)}</span>
      <span class="candidate-votes">${escapeHtml(voteText)}</span>
      <span class="candidate-action">${selected ? "상세 닫기" : "지역별 보기"}</span>
    </button>`;
  }).join("");

  const compact = rest.map((candidate, offset) => {
    const index = offset + 5;
    const width = Math.max(2, (candidate.percent / max) * 100);
    const voteText = state.supremeMode === "weighted"
      ? `${formatNumber(candidate.votes, 2)} 환산표`
      : `${formatNumber(candidate.votes)}표`;
    const selected = state.selectedSupremeCandidate === candidate.id;
    return `<button type="button" class="supreme-row ${selected ? "is-selected" : ""}" data-candidate-id="${escapeHtml(candidate.id)}" aria-pressed="${selected ? "true" : "false"}" style="--candidate-color:${candidateColor(candidate.index)}">
      <span class="supreme-rank">${index + 1}</span>
      ${candidateAvatar(candidate, "supreme-avatar")}
      <span class="supreme-info"><strong>${escapeHtml(candidate.name)}</strong><span class="supreme-mini-track"><span class="supreme-mini-fill" style="width:${width}%"></span></span></span>
      <span class="supreme-value">${formatPercent(candidate.percent)}<small>${escapeHtml(voteText)}</small></span>
    </button>`;
  }).join("");

  els.supremeRanking.innerHTML = `
    <div class="supreme-featured-grid">${featured}</div>
    <div class="supreme-cutline-divider"><span>5위까지 당선권</span></div>
    <div class="supreme-rest-list">${compact}</div>
    ${candidateRegionalDetail("supreme", state.selectedSupremeCandidate, state.supremeMode)}
  `;
}

function getUnitVoteData(unit, contest) {
  const key = contest === "leader" ? "leaderVotes" : "supremeVotes";
  const votes = normalizeVoteObject(unit[key], contest);
  if (!votes) return null;
  const candidateMap = getCandidateMap(contest);
  const knownTotal = Object.values(votes).reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
  const suppliedTotal = contest === "supreme" && Number.isFinite(unit.supremeTotalVotes) ? unit.supremeTotalVotes : null;
  const total = suppliedTotal || knownTotal;
  const ranking = Object.entries(votes)
    .filter(([, value]) => Number.isFinite(value))
    .map(([id, value]) => ({ ...candidateMap.get(id), votes: value, percent: total > 0 ? (value / total) * 100 : 0 }))
    .sort((a, b) => b.votes - a.votes);
  return { total, ranking, complete: contest !== "supreme" || unit.supremeComplete !== false };
}

function renderRegions() {
  const contest = state.regionContest;
  const units = state.data.resultUnits.filter((unit) => {
    if (contest === "leader" && unit.id === "jeju-incheon-supreme") return false;
    return true;
  });

  els.regionList.innerHTML = units.map((unit) => {
    const data = getUnitVoteData(unit, contest);
    const top = data?.ranking?.[0];
    const weighted = Number(unit.weight) > 1;
    const isDone = unit.status === "done";
    const dateLabel = formatDate(unit.date, { month: "numeric", day: "numeric" });

    const turnoutRate = Number(unit.turnoutRate);
    const voterCount = Number(unit.voterCount);
    const eligibleVoters = Number(unit.eligibleVoters);

    const hasTurnout = Number.isFinite(turnoutRate);
    const hasVoterCount = Number.isFinite(voterCount);
    const hasEligible = Number.isFinite(eligibleVoters);
    const isEstimated = unit.eligibleVotersStatus === "estimated";

    const electorateBadge = hasEligible
      ? `<span class="electorate-status-badge ${isEstimated ? "estimated" : "confirmed"}">${isEstimated ? "선거인단 추정" : "선거인단 확정"}</span>`
      : "";

    const electorateText = hasEligible
      ? `${isEstimated ? "약 " : ""}${formatNumber(eligibleVoters)}명${isEstimated ? " · 추정" : ""}`
      : "-";

    const turnoutDetail = (hasEligible || hasTurnout || hasVoterCount)
      ? `<div class="region-turnout-panel">
          ${hasEligible ? `<div><span>권리당원 총선거인수</span><strong>${electorateText}</strong><small>${isEstimated ? "결과 발표 전 잠정 추정치" : "공식 결과 공지 확정값"}</small></div>` : ""}
          ${hasVoterCount ? `<div><span>투표자수</span><strong>${formatNumber(voterCount)}명</strong><small>당대표 실제 투표자 기준</small></div>` : ""}
          ${hasTurnout ? `<div><span>최종 투표율</span><strong>${formatPercent(turnoutRate)}</strong><small>온라인 + ARS 합산</small></div>` : ""}
        </div>`
      : "";

    const detailRows = data
      ? data.ranking.map((candidate) => `<div class="region-result-row" style="--candidate-color:${candidateColor(candidate.index)}"><span class="region-result-name"><span class="candidate-dot"></span>${escapeHtml(candidate.name)}</span><span class="region-result-value">${formatPercent(candidate.percent)}<small>${formatNumber(candidate.votes)}표${weighted ? ` · 환산 ${formatNumber(candidate.votes * Number(unit.weight), 2)}` : ""}</small></span></div>`).join("")
      : `<div class="region-empty">${escapeHtml(unit.memo || "아직 공식 결과가 반영되지 않았습니다. 새 공지 URL을 GitHub Actions에 추가하면 총선거인수·투표자수·최종 투표율과 후보별 득표가 함께 자동 갱신됩니다.")}</div>`;

    return `<details class="region-card">
      <summary class="region-summary">
        <span class="region-main">
          <span class="region-name-line">
            <span class="region-name">${escapeHtml(unit.name)}</span>
            ${weighted ? `<span class="weight-badge">×${Number(unit.weight).toFixed(2)}</span>` : ""}
            <span class="status-badge ${isDone ? "done" : ""}">${isDone ? "발표" : "예정"}</span>
            ${electorateBadge}
            ${hasTurnout ? `<span class="turnout-badge">투표율 ${formatPercent(turnoutRate)}</span>` : ""}
          </span>
          <span class="region-sub">
            ${escapeHtml(dateLabel)}
            ${hasEligible ? ` · 선거인단 ${electorateText}` : ""}
            ${data ? ` · ${data.complete ? "유효 입력" : "전체 기준"} ${formatNumber(data.total)}표${data.complete ? "" : " · 일부 후보 표수만 입력"}` : ""}
          </span>
        </span>
        <span class="region-lead">${top ? `<strong>${escapeHtml(top.name)} ${formatPercent(top.percent)}</strong><span>현재 1위</span>` : `<strong>결과 대기</strong><span>클릭해 확인</span>`}</span>
        <span class="region-chevron" aria-hidden="true">⌄</span>
      </summary>
      <div class="region-detail">${turnoutDetail}${detailRows}</div>
    </details>`;
  }).join("");
}
function renderMethod() {
  const { rules, electorate } = state.data;
  const officialTotal = Number(electorate?.officialTotalEligibleVoters);

  els.methodGrid.innerHTML = [
    ["결과 발표 진행률", "발표 완료 지역의 확정 총선거인수 합계 ÷ 전국 권리당원 선거인단 총수 × 100"],
    ["지역별 최종 투표율", "더불어민주당 공식 결과 공지의 온라인투표 + ARS투표 합산 투표율"],
    ["결과 검산", "당대표 3명 득표 합계 = 투표자수 / 투표자수 ÷ 총선거인수 ≈ 공식 투표율"],
    ["가중치 환산", "지역 후보 득표수 × resultUnit.weight"]
  ].map(([title, formula]) => `<div class="method-card"><strong>${escapeHtml(title)}</strong><code>${escapeHtml(formula)}</code></div>`).join("");

  const totalText = Number.isFinite(officialTotal)
    ? `전국 권리당원 선거인단 총수는 ${formatNumber(officialTotal)}명입니다. `
    : "";

  els.methodNote.textContent = `${totalText}미발표 지역의 선거인단은 잠정 추정치를 표시하며, 결과 발표 후 공식 공지의 실제 총선거인수로 자동 대체합니다. 최종 선출 반영 비율은 당원·대의원 ${(Number(rules.partyVoteWeight) * 100).toFixed(0)}%, 국민여론조사 ${(Number(rules.publicPollWeight) * 100).toFixed(0)}%입니다. ${rules.weightRuleNote || ""}`;
}
function renderSources() {
  const sources = state.data.sources || [];
  if (!sources.length) {
    els.sourceList.innerHTML = `<div class="source-empty">공식 결과 공지를 등록하면 출처가 자동으로 추가됩니다.</div>`;
    return;
  }
  els.sourceList.innerHTML = sources.map((source) => `<a class="source-item" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer"><span><strong>${escapeHtml(source.label)}</strong><span>${escapeHtml(source.description || "")}</span></span><span class="source-arrow" aria-hidden="true">↗</span></a>`).join("");
}

function bindCandidateSelection() {
  els.leaderSummary?.addEventListener("click", (event) => {
    const card = event.target.closest(".candidate-card[data-candidate-id]");
    if (!card) return;
    const id = card.dataset.candidateId;
    state.selectedLeaderCandidate = state.selectedLeaderCandidate === id ? null : id;
    renderLeader();
  });

  els.supremeRanking?.addEventListener("click", (event) => {
    const row = event.target.closest("[data-candidate-id]");
    if (!row || !els.supremeRanking.contains(row)) return;
    const id = row.dataset.candidateId;
    state.selectedSupremeCandidate = state.selectedSupremeCandidate === id ? null : id;
    renderSupreme();
  });
}

function bindControls() {
  els.leaderTabs.querySelectorAll(".metric-tab").forEach((button) => {
    button.addEventListener("click", () => {
      state.leaderMode = button.dataset.mode;
      els.leaderTabs.querySelectorAll(".metric-tab").forEach((tab) => {
        const active = tab === button;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
      });
      renderLeader();
    });
  });

  els.supremeTabs?.querySelectorAll(".metric-tab").forEach((button) => {
    button.addEventListener("click", () => {
      state.supremeMode = button.dataset.supremeMode;
      els.supremeTabs.querySelectorAll(".metric-tab").forEach((tab) => {
        const active = tab === button;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
      });
      renderSupreme();
    });
  });

  document.querySelectorAll(".contest-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.regionContest = button.dataset.contest;
      document.querySelectorAll(".contest-button").forEach((item) => item.classList.toggle("active", item === button));
      renderRegions();
    });
  });
}

function renderAll() {
  renderHeader();
  renderCalendar();
  renderLeader();
  renderSupreme();
  renderRegions();
  renderMethod();
  renderSources();
  bindControls();
  bindCandidateSelection();
  els.status.hidden = true;
  els.app.hidden = false;
}

async function loadData() {
  try {
    const response = await fetch(DATA_PATH, { cache: "no-cache" });
    if (!response.ok) throw new Error(`데이터 파일을 불러오지 못했습니다. (${response.status})`);
    state.data = await response.json();
    renderAll();
  } catch (error) {
    els.status.classList.add("error");
    els.status.textContent = error.message || "전당대회 데이터를 읽는 중 문제가 발생했습니다.";
  }
}

if (els.backLink) {
  els.backLink.addEventListener("click", (event) => {
    try {
      const sameOrigin = document.referrer && new URL(document.referrer).origin === window.location.origin;
      if (window.history.length > 1 && sameOrigin) {
        event.preventDefault();
        window.history.back();
      }
    } catch {
      // 기본 링크 동작 유지
    }
  });
}

if (els.topButton) {
  els.topButton.addEventListener("click", () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });
  window.addEventListener("scroll", () => {
    els.topButton.classList.toggle("visible", window.scrollY > 400);
  }, { passive: true });
}

document.addEventListener("error", (event) => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement)) return;
  const avatar = image.closest(".candidate-avatar, .supreme-avatar");
  if (!avatar) return;
  avatar.classList.remove("has-image");
  image.remove();
}, true);

loadData();

// 페이지를 오래 열어둔 경우에도 자정이 지나면 오늘 표시와 모바일 남은 일정이 자동 갱신된다.
window.setInterval(() => {
  if (!state.data) return;
  const currentKst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const currentKey = dateKey(currentKst);
  if (currentKey !== state.calendarDateKey) renderCalendar();
}, 60 * 1000);
