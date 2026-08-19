const REGIONAL_DATA_PATH = "./data/convention-data.json";
const FINAL_DATA_PATH = "./data/convention-final.json";

const state = {
  regional: null,
  final: null,
  regionContest: "leader",
  expandedRegion: null
};

const els = {
  title: document.querySelector("#document-title"),
  meta: document.querySelector("#document-meta"),
  status: document.querySelector("#convention-status"),
  app: document.querySelector("#convention-app"),
  hero: document.querySelector("#final-hero"),
  leaderFinal: document.querySelector("#leader-final"),
  analysisGrid: document.querySelector("#analysis-grid"),
  leaderPreference: document.querySelector("#leader-preference-analysis"),
  supremeWithdrawal: document.querySelector("#supreme-withdrawal-analysis"),
  supremeFinal: document.querySelector("#supreme-final"),
  regionalIntro: document.querySelector("#regional-intro"),
  regionalSummary: document.querySelector("#regional-summary"),
  regionList: document.querySelector("#region-list"),
  certaintyGrid: document.querySelector("#certainty-grid"),
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

function formatNumber(value, digits = 0) {
  if (!Number.isFinite(Number(value))) return "-";
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: digits }).format(Number(value));
}

function formatPercent(value, digits = 2) {
  return Number.isFinite(Number(value)) ? `${Number(value).toFixed(digits)}%` : "-";
}

function candidateMap(contest) {
  return new Map((state.regional.candidates?.[contest] || []).map((candidate, index) => [candidate.id, { ...candidate, index }]));
}

function candidateById(contest, id) {
  return candidateMap(contest).get(id) || { id, name: id, short: id, image: "" };
}

function candidateAvatar(candidate, className = "analysis-avatar") {
  const fallback = [...String(candidate.name || "?")].slice(0, 2).join("");
  if (!candidate.image) return `<span class="${className}"><span>${escapeHtml(fallback)}</span></span>`;
  return `<span class="${className} has-image"><span>${escapeHtml(fallback)}</span><img src="${escapeHtml(candidate.image)}" alt="${escapeHtml(candidate.name)}" loading="lazy"></span>`;
}

function doneUnits() {
  return (state.regional.resultUnits || []).filter((unit) => unit.status === "done");
}

function sumUnits(key) {
  return doneUnits().reduce((sum, unit) => sum + (Number(unit[key]) || 0), 0);
}

function sumCandidateVotes(contest) {
  const key = contest === "leader" ? "leaderVotes" : "supremeVotes";
  const map = candidateMap(contest);
  const totals = Object.fromEntries([...map.keys()].map((id) => [id, 0]));
  doneUnits().forEach((unit) => {
    const votes = unit[key];
    if (!votes) return;
    Object.keys(totals).forEach((id) => {
      if (Number.isFinite(Number(votes[id]))) totals[id] += Number(votes[id]);
    });
  });
  return totals;
}

function computeAnalysis() {
  const rights = state.final.turnout.rightsMembers;
  const domesticEligible = sumUnits("eligibleVoters");
  const domesticVoters = sumUnits("voterCount");
  const overseasEligible = rights.eligibleVoters - domesticEligible;
  const overseasVoters = rights.voterCount - domesticVoters;
  const overseasTurnout = overseasEligible > 0 ? overseasVoters / overseasEligible * 100 : 0;

  const leaderDomestic = sumCandidateVotes("leader");
  const leaderDomesticTotal = Object.values(leaderDomestic).reduce((a, b) => a + b, 0);
  const leaderFinalRights = Object.fromEntries(state.final.leader.results.map((row) => [row.id, row.rightsVotes]));
  const jungIncrease = leaderFinalRights["jung-chungrae"] - (leaderDomestic["jung-chungrae"] || 0);
  const kimIncrease = leaderFinalRights["kim-minseok"] - (leaderDomestic["kim-minseok"] || 0);
  const songDomestic = leaderDomestic["song-younggil"] || 0;

  const supremeDomestic = sumCandidateVotes("supreme");
  const supremeFinalRights = Object.fromEntries(state.final.supreme.results.map((row) => [row.id, row.rightsVotes]));
  const supremeOverseasActive = Object.fromEntries(
    state.final.supreme.results.map((row) => [row.id, row.rightsVotes - (supremeDomestic[row.id] || 0)])
  );
  const activeFinalVotes = Object.values(supremeFinalRights).reduce((a, b) => a + b, 0);
  const withdrawnIds = state.final.supreme.withdrawn.map((item) => item.id);
  const withdrawnDomesticVotes = withdrawnIds.reduce((sum, id) => sum + (supremeDomestic[id] || 0), 0);
  const allRightsSelections = rights.voterCount * 2;
  const excludedSelections = allRightsSelections - activeFinalVotes;
  const overseasWithdrawnCombined = excludedSelections - withdrawnDomesticVotes;

  return {
    domesticEligible,
    domesticVoters,
    domesticTurnout: domesticEligible ? domesticVoters / domesticEligible * 100 : 0,
    overseasEligible,
    overseasVoters,
    overseasTurnout,
    leaderDomestic,
    leaderDomesticTotal,
    leaderFinalRights,
    jungIncrease,
    kimIncrease,
    songDomestic,
    supremeDomestic,
    supremeOverseasActive,
    activeFinalVotes,
    withdrawnDomesticVotes,
    allRightsSelections,
    excludedSelections,
    overseasWithdrawnCombined
  };
}

function renderHero(analysis) {
  const winner = state.final.leader.results.find((row) => row.elected);
  const winnerCandidate = candidateById("leader", winner.id);
  const turnout = state.final.turnout;

  els.title.textContent = state.final.meta.pageTitle;
  els.meta.textContent = `8월 17일 최종 결과 확정 · 공식 결과와 지역별 원자료를 분리해 분석합니다.`;
  document.title = `${state.final.meta.pageTitle} | 분당민주크루`;

  els.hero.innerHTML = `
    <div class="final-hero-status"><span class="status-dot"></span> 전당대회 종료 · 최종 결과 확정</div>
    <div class="winner-lockup">
      ${candidateAvatar(winnerCandidate, "winner-avatar")}
      <div>
        <p>더불어민주당 당대표 당선</p>
        <h2 id="final-title">${escapeHtml(winnerCandidate.name)}</h2>
        <strong>${formatPercent(winner.finalRate)}<span> 최종득표율</span></strong>
      </div>
    </div>
    <div class="hero-metrics">
      <div><span>권리당원 투표율</span><strong>${formatPercent(turnout.rightsMembers.turnoutRate)}</strong><small>${formatNumber(turnout.rightsMembers.voterCount)} / ${formatNumber(turnout.rightsMembers.eligibleVoters)}명</small></div>
      <div><span>전국대의원 투표율</span><strong>${formatPercent(turnout.delegates.turnoutRate)}</strong><small>${formatNumber(turnout.delegates.voterCount)} / ${formatNumber(turnout.delegates.eligibleVoters)}명</small></div>
      <div><span>전체 투표자</span><strong>${formatNumber(turnout.total.voterCount)}명</strong><small>선거인단 ${formatNumber(turnout.total.eligibleVoters)}명</small></div>
    </div>
    <div class="hero-derived-line"><span class="status-chip derived">역산</span> 국내 16개 지역과 전국 합계의 차이: 재외국민 권리당원 ${formatNumber(analysis.overseasEligible)}명 중 ${formatNumber(analysis.overseasVoters)}명 투표 · ${formatPercent(analysis.overseasTurnout)}</div>
  `;
}

function renderLeaderFinal(analysis) {
  const rows = [...state.final.leader.results].sort((a, b) => b.finalRate - a.finalRate);
  const finalGap = rows[0].finalRate - rows[1].finalRate;
  const delegateGap = rows[0].delegateRate - rows[1].delegateRate;
  const rightsGap = rows[0].rightsRate - rows[1].rightsRate;
  const pollGap = rows[0].publicPollRate - rows[1].publicPollRate;

  const cards = rows.map((row) => {
    const candidate = candidateById("leader", row.id);
    return `<article class="leader-final-card ${row.elected ? "winner" : ""}">
      <div class="leader-final-head">
        ${candidateAvatar(candidate)}
        <div><span>${row.elected ? "당선" : "최종 2위"}</span><h3>${escapeHtml(candidate.name)}</h3></div>
        <strong>${formatPercent(row.finalRate)}</strong>
      </div>
      <div class="component-bars">
        ${componentBar("전국대의원", row.delegateRate, `${formatNumber(row.delegateVotes)}표`)}
        ${componentBar("권리당원", row.rightsRate, `${formatNumber(row.rightsVotes)}표`)}
        ${componentBar("국민여론조사", row.publicPollRate, "30% 반영")}
      </div>
    </article>`;
  }).join("");

  els.leaderFinal.innerHTML = `
    <div class="leader-final-grid">${cards}</div>
    <div class="result-readout">
      <div><span>최종 격차</span><strong>${formatPercent(finalGap)}p</strong><small>김민석 우위</small></div>
      <div><span>대의원 격차</span><strong>${formatPercent(Math.abs(delegateGap))}p</strong><small>김민석 우위</small></div>
      <div><span>권리당원 격차</span><strong>${formatPercent(Math.abs(rightsGap))}p</strong><small>김민석 우위</small></div>
      <div><span>여론조사 격차</span><strong>${formatPercent(Math.abs(pollGap))}p</strong><small>${pollGap < 0 ? "정청래" : "김민석"} 우위</small></div>
    </div>
    <div class="official-note"><span class="status-chip limited">비공개</span><p>당대표는 선호투표가 적용됐습니다. 과반 후보가 없었던 선호투표 적용 전 전국 합산 1순위 결과는 공개되지 않았으므로, 최종 54.08%를 지역별 1순위 누계와 직접 비교하면 안 됩니다.</p></div>
  `;
}

function componentBar(label, value, note) {
  const width = Math.max(0, Math.min(100, Number(value) || 0));
  return `<div class="component-row"><div><span>${escapeHtml(label)}</span><strong>${formatPercent(value)}</strong></div><div class="component-track"><span style="width:${width}%"></span></div><small>${escapeHtml(note)}</small></div>`;
}

function renderAnalysis(analysis) {
  const leaderDomestic = analysis.leaderDomestic;
  const total = analysis.leaderDomesticTotal;
  const kimShare = total ? (leaderDomestic["kim-minseok"] / total * 100) : 0;
  const jungShare = total ? (leaderDomestic["jung-chungrae"] / total * 100) : 0;
  const songShare = total ? (leaderDomestic["song-younggil"] / total * 100) : 0;

  els.analysisGrid.innerHTML = `
    ${analysisCard("official", "국내 16개 지역 공개분", `${formatNumber(analysis.domesticVoters)}명`, `권리당원 선거인단 ${formatNumber(analysis.domesticEligible)}명 · 투표율 ${formatPercent(analysis.domesticTurnout)}`)}
    ${analysisCard("derived", "재외국민 권리당원", `${formatNumber(analysis.overseasVoters)}명 투표`, `전체−국내 16개 지역으로 역산 · 선거인단 ${formatNumber(analysis.overseasEligible)}명 · ${formatPercent(analysis.overseasTurnout)}`)}
    ${analysisCard("derived", "국내 당대표 1순위", `김민석 ${formatPercent(kimShare)}`, `정청래 ${formatPercent(jungShare)} · 송영길 ${formatPercent(songShare)} · 총 ${formatNumber(total)}표`)}
    ${analysisCard("limited", "전국 1차 결과", "정확한 복원 불가", "재외국민 998명의 1순위, 전국대의원 1순위, 여론조사 3인 1순위가 공개되지 않음")}
  `;

  const jMin = Math.max(0, analysis.jungIncrease - analysis.overseasVoters);
  const jMax = analysis.jungIncrease;
  const kMin = Math.max(0, analysis.kimIncrease - analysis.overseasVoters);
  const kMax = analysis.kimIncrease;
  const transferTotalMin = analysis.songDomestic;
  const kShareMin = transferTotalMin ? kMin / transferTotalMin * 100 : 0;
  const kShareMax = transferTotalMin ? kMax / transferTotalMin * 100 : 0;

  els.leaderPreference.innerHTML = `
    <div class="deep-dive-heading"><span class="status-chip derived">역산 분석</span><h3>선호투표에서 확인되는 66,872표의 이동</h3></div>
    <p>최종 권리당원 표에서 국내 16개 지역 1순위 누계를 빼면 정청래는 <strong>+${formatNumber(analysis.jungIncrease)}표</strong>, 김민석은 <strong>+${formatNumber(analysis.kimIncrease)}표</strong>입니다. 두 증가분의 합은 ${formatNumber(analysis.jungIncrease + analysis.kimIncrease)}표로, 국내 송영길 1순위 ${formatNumber(analysis.songDomestic)}표와 재외국민 투표자 ${formatNumber(analysis.overseasVoters)}명을 합친 값과 정확히 같습니다.</p>
    <div class="equation-card"><span>${formatNumber(analysis.jungIncrease)} + ${formatNumber(analysis.kimIncrease)}</span><strong>= ${formatNumber(analysis.songDomestic)} + ${formatNumber(analysis.overseasVoters)}</strong><small>정·김 최종 증가분 = 국내 송영길 1순위 + 재외국민 전체 투표자</small></div>
    <div class="range-grid">
      <div><span>송영길→정청래 이전표</span><strong>${formatNumber(jMin)} ~ ${formatNumber(jMax)}표</strong></div>
      <div><span>송영길→김민석 이전표</span><strong>${formatNumber(kMin)} ~ ${formatNumber(kMax)}표</strong></div>
    </div>
    <p class="fine-print">재외국민 998명의 최초 1순위 분포를 알 수 없어 정확한 이관표는 확정할 수 없습니다. 가능한 범위에서는 송영길 1순위 표 가운데 김민석으로 이동한 비중이 대략 ${kShareMin.toFixed(1)}~${kShareMax.toFixed(1)}% 수준입니다.</p>
  `;

  const overseasRows = state.final.supreme.results.map((row) => {
    const candidate = candidateById("supreme", row.id);
    return `<div class="overseas-vote-row"><span>${escapeHtml(candidate.name)}</span><strong>${formatNumber(analysis.supremeOverseasActive[row.id])}표</strong></div>`;
  }).join("");

  els.supremeWithdrawal.innerHTML = `
    <div class="deep-dive-heading"><span class="status-chip derived">역산 분석</span><h3>최고위원 사퇴와 재외국민 1,996표의 흔적</h3></div>
    <p>최고위원은 1인 2표이므로 권리당원 ${formatNumber(state.final.turnout.rightsMembers.voterCount)}명의 전체 선택 가능 표는 <strong>${formatNumber(analysis.allRightsSelections)}표</strong>입니다. 최종 결과표에 남은 6명의 권리당원 득표 합계는 ${formatNumber(analysis.activeFinalVotes)}표로, 차이는 ${formatNumber(analysis.excludedSelections)}표입니다.</p>
    <div class="equation-card"><span>${formatNumber(analysis.allRightsSelections)} − ${formatNumber(analysis.activeFinalVotes)}</span><strong>= ${formatNumber(analysis.excludedSelections)}표</strong><small>최종 6인 결과에서 제외된 권리당원 선택표</small></div>
    <p>국내 16개 지역에서 김영호·임미애 후보가 사퇴 전 얻은 표는 합계 <strong>${formatNumber(analysis.withdrawnDomesticVotes)}표</strong>입니다. 따라서 나머지 <strong>${formatNumber(analysis.overseasWithdrawnCombined)}표</strong>는 재외국민 투표분에서 두 사퇴 후보에게 행사된 표의 합계로 역산됩니다.</p>
    <div class="overseas-breakdown"><div class="overseas-breakdown-title">재외국민 최고위원 표 · 최종 6인에 반영된 분</div>${overseasRows}<div class="overseas-vote-row withdrawn"><span>김영호 + 임미애</span><strong>${formatNumber(analysis.overseasWithdrawnCombined)}표</strong></div></div>
    <p class="fine-print">두 사퇴 후보의 재외국민 득표는 후보별로 분리해 공개되지 않아 98표의 내부 배분은 복원할 수 없습니다.</p>
  `;
}

function analysisCard(type, label, value, note) {
  const labels = { official: "공식", derived: "역산", limited: "비공개" };
  return `<article class="analysis-card ${type}"><span class="status-chip ${type}">${labels[type]}</span><h3>${escapeHtml(label)}</h3><strong>${escapeHtml(value)}</strong><p>${escapeHtml(note)}</p></article>`;
}

function renderSupremeFinal(analysis) {
  els.supremeFinal.innerHTML = [...state.final.supreme.results]
    .sort((a, b) => b.finalRate - a.finalRate)
    .map((row, index) => {
      const candidate = candidateById("supreme", row.id);
      const overseas = analysis.supremeOverseasActive[row.id];
      return `<article class="supreme-final-card ${row.elected ? "elected" : ""}">
        <div class="supreme-rank">${index + 1}</div>
        ${candidateAvatar(candidate, "supreme-final-avatar")}
        <div class="supreme-final-info"><div><strong>${escapeHtml(candidate.name)}</strong>${row.elected ? `<span class="elected-badge">당선</span>` : ""}</div><small>권리당원 ${formatPercent(row.rightsRate)} · 대의원 ${formatPercent(row.delegateRate)} · 여론 ${formatPercent(row.publicPollRate)}</small><em>재외국민 역산 ${formatNumber(overseas)}표</em></div>
        <div class="supreme-final-rate"><strong>${formatPercent(row.finalRate)}</strong><span>최종</span></div>
      </article>`;
    }).join("");
}

function renderRegional(analysis) {
  const contest = state.regionContest;
  const key = contest === "leader" ? "leaderVotes" : "supremeVotes";
  const candidates = candidateMap(contest);
  const units = doneUnits();
  const totals = sumCandidateVotes(contest);
  const grand = Object.values(totals).reduce((a, b) => a + b, 0);

  if (contest === "leader") {
    els.regionalIntro.textContent = "당대표는 각 지역에서 공개된 권리당원 1순위 득표입니다. 재외국민 998명의 후보별 1순위는 포함되지 않으며, 최종 선호투표 결과와는 별도 지표입니다.";
  } else {
    els.regionalIntro.textContent = "최고위원은 1인 2표 원득표입니다. 김영호·임미애 후보의 사퇴 전 지역별 득표도 원자료 보존을 위해 그대로 표시합니다.";
  }

  const sortedTotals = [...candidates.values()].map((candidate) => ({ ...candidate, votes: totals[candidate.id] || 0 }))
    .sort((a, b) => b.votes - a.votes);
  els.regionalSummary.innerHTML = sortedTotals.map((row) => {
    const percent = grand ? row.votes / grand * 100 : 0;
    const withdrawn = state.final.supreme.withdrawn.some((item) => item.id === row.id);
    return `<div class="regional-total-chip ${withdrawn ? "withdrawn" : ""}"><span>${escapeHtml(row.name)}${withdrawn ? " · 사퇴" : ""}</span><strong>${formatNumber(row.votes)}표</strong><small>${formatPercent(percent)}</small></div>`;
  }).join("");

  els.regionList.innerHTML = units.map((unit) => {
    const votes = unit[key] || {};
    const denominator = contest === "leader" ? Number(unit.voterCount) : Number(unit.voterCount) * 2;
    const ranking = [...candidates.values()].map((candidate) => ({ ...candidate, votes: Number(votes[candidate.id]) || 0 }))
      .sort((a, b) => b.votes - a.votes);
    const top = ranking[0];
    const expanded = state.expandedRegion === unit.id;
    const detail = expanded ? `<div class="region-detail-list">${ranking.map((row) => {
      const withdrawn = state.final.supreme.withdrawn.some((item) => item.id === row.id);
      const pct = denominator ? row.votes / denominator * 100 : 0;
      return `<div class="region-detail-row ${withdrawn ? "withdrawn" : ""}"><span>${escapeHtml(row.name)}${withdrawn ? " <small>사퇴</small>" : ""}</span><strong>${formatNumber(row.votes)}표</strong><em>${formatPercent(pct)}</em></div>`;
    }).join("")}</div>` : "";
    return `<article class="region-card ${expanded ? "expanded" : ""}">
      <button type="button" class="region-card-button" data-region-id="${escapeHtml(unit.id)}" aria-expanded="${expanded}">
        <span class="region-name"><strong>${escapeHtml(unit.name)}</strong><small>선거인단 ${formatNumber(unit.eligibleVoters)} · 투표 ${formatNumber(unit.voterCount)}</small></span>
        <span class="region-turnout"><strong>${formatPercent(unit.turnoutRate)}</strong><small>투표율</small></span>
        <span class="region-top"><strong>${escapeHtml(top.name)}</strong><small>${formatNumber(top.votes)}표</small></span>
        <span class="region-chevron">${expanded ? "−" : "+"}</span>
      </button>${detail}
    </article>`;
  }).join("");

  els.regionList.querySelectorAll("[data-region-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.regionId;
      state.expandedRegion = state.expandedRegion === id ? null : id;
      renderRegional(analysis);
    });
  });
}

function renderMethod(analysis) {
  els.certaintyGrid.innerHTML = `
    <article><span class="status-chip official">공식</span><h3>그대로 인용</h3><p>최종 득표율, 전국대의원·권리당원 득표수와 투표율, 16개 지역별 원득표.</p></article>
    <article><span class="status-chip derived">역산</span><h3>공식값의 차이로 산출</h3><p>재외국민 선거인단 ${formatNumber(analysis.overseasEligible)}명·투표자 ${formatNumber(analysis.overseasVoters)}명, 최고위원 재외국민 후보별 일부 득표 등.</p></article>
    <article><span class="status-chip limited">비공개</span><h3>숫자를 만들지 않음</h3><p>당대표 전국 선호투표 전 3인 최종득표율, 전국대의원 송영길 1순위, 여론조사 송영길 1순위.</p></article>
  `;
  els.methodNote.innerHTML = `<strong>계산 원칙</strong><p>역산값은 공식 전체 수치와 공식 지역별 원자료 사이의 산술적 차이만 사용합니다. 미공개 변수 때문에 하나의 값으로 결정되지 않는 항목은 범위로 표시하거나 ‘복원 불가’로 남깁니다. 전략지역 5% 가중치는 대구·경북·경남에 적용되며, 최종 공식 득표율은 전국대의원·권리당원 70%와 국민여론조사 30%를 반영한 값입니다.</p>`;
}

function renderSources() {
  const typeLabels = { regional: "지역 결과", withdrawal: "후보 사퇴", final: "최종 결과" };
  const sources = [...(state.final.sources || [])].sort((a, b) =>
    String(a.publishedAt || "").localeCompare(String(b.publishedAt || ""))
  );

  els.sourceList.innerHTML = sources.map((source) => {
    const date = source.publishedAt ? formatSourceDate(source.publishedAt) : "";
    const type = typeLabels[source.type] || "공식 공지";
    return `<a class="source-item source-type-${escapeHtml(source.type || "reference")}" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">
      <span class="source-main">
        <span class="source-meta"><em>${escapeHtml(type)}</em>${date ? `<time datetime="${escapeHtml(source.publishedAt)}">${escapeHtml(date)}</time>` : ""}</span>
        <strong>${escapeHtml(source.title || source.shortLabel || "더불어민주당 공식 공지")}</strong>
        <span>${escapeHtml(source.description || "더불어민주당 공식 공지")}</span>
      </span>
      <span class="source-arrow" aria-hidden="true">↗</span>
    </a>`;
  }).join("");
}

function formatSourceDate(dateString) {
  const [year, month, day] = String(dateString || "").split("-").map(Number);
  if (!year || !month || !day) return dateString || "";
  return `${month}월 ${day}일 게시`;
}

function bindControls(analysis) {
  document.querySelectorAll(".contest-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.regionContest = button.dataset.contest;
      state.expandedRegion = null;
      document.querySelectorAll(".contest-button").forEach((item) => item.classList.toggle("active", item === button));
      renderRegional(analysis);
    });
  });
}

function renderAll() {
  const analysis = computeAnalysis();
  renderHero(analysis);
  renderLeaderFinal(analysis);
  renderAnalysis(analysis);
  renderSupremeFinal(analysis);
  renderRegional(analysis);
  renderMethod(analysis);
  renderSources();
  bindControls(analysis);
  els.status.hidden = true;
  els.app.hidden = false;
}

async function loadData() {
  try {
    const [regionalResponse, finalResponse] = await Promise.all([
      fetch(REGIONAL_DATA_PATH, { cache: "no-cache" }),
      fetch(FINAL_DATA_PATH, { cache: "no-cache" })
    ]);
    if (!regionalResponse.ok) throw new Error(`지역 원자료를 불러오지 못했습니다. (${regionalResponse.status})`);
    if (!finalResponse.ok) throw new Error(`최종 결과 데이터를 불러오지 못했습니다. (${finalResponse.status})`);
    state.regional = await regionalResponse.json();
    state.final = await finalResponse.json();
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
  els.topButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  window.addEventListener("scroll", () => els.topButton.classList.toggle("visible", window.scrollY > 500), { passive: true });
}

document.addEventListener("error", (event) => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement)) return;
  const avatar = image.closest(".analysis-avatar, .winner-avatar, .supreme-final-avatar");
  if (!avatar) return;
  avatar.classList.remove("has-image");
  image.remove();
}, true);

loadData();
