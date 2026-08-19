const REGIONAL_DATA_PATH = "./data/convention-data.json";
const FINAL_DATA_PATH = "./data/convention-final.json";
const COLOR_VARS = [
  "var(--candidate-1)", "var(--candidate-2)", "var(--candidate-3)", "var(--candidate-4)",
  "var(--candidate-5)", "var(--candidate-6)", "var(--candidate-7)", "var(--candidate-8)"
];

const state = { regional: null, final: null, regionContest: "leader", expandedRegion: null };

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
  supremeIntro: document.querySelector("#supreme-intro"),
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
  return candidateMap(contest).get(id) || { id, name: id, short: id, image: "", index: 0 };
}

function candidateColor(candidate) {
  return COLOR_VARS[(candidate?.index ?? 0) % COLOR_VARS.length];
}

function candidateAvatar(candidate, className = "candidate-avatar") {
  const fallback = [...String(candidate.name || "?")].slice(0, 2).join("");
  if (!candidate.image) return `<span class="${className}"><span class="avatar-fallback">${escapeHtml(fallback)}</span></span>`;
  return `<span class="${className} has-image"><span class="avatar-fallback">${escapeHtml(fallback)}</span><img src="${escapeHtml(candidate.image)}" alt="${escapeHtml(candidate.name)}" loading="lazy"></span>`;
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
  const withdrawnIds = state.final.supreme.withdrawn.map((item) => item.id);
  const withdrawnDomesticVotes = withdrawnIds.reduce((sum, id) => sum + (supremeDomestic[id] || 0), 0);
  const activeFinalVotes = Object.values(supremeFinalRights).reduce((a, b) => a + b, 0);
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
    activeFinalVotes,
    withdrawnDomesticVotes,
    allRightsSelections,
    excludedSelections,
    overseasWithdrawnCombined
  };
}

function renderHero() {
  const turnout = state.final.turnout;
  els.title.textContent = "2026 전당대회";
  els.meta.textContent = "최종 결과와 지역별 공개 원자료를 함께 정리했습니다.";
  document.title = "2026 전당대회 결과 분석 | 분당민주크루";

  els.hero.innerHTML = `
    <div class="hero-topline">
      <span class="dday-badge">최종 결과 확정</span>
      <span class="hero-updated">2026. 8. 17. 전국당원대회</span>
    </div>
    <h2 id="final-title">더불어민주당 제3차 정기전국당원대회</h2>
    <div class="hero-stats">
      <div class="hero-stat"><span>당대표 당선</span><strong>김민석 54.08%</strong></div>
      <div class="hero-stat"><span>권리당원 투표율</span><strong>${formatPercent(turnout.rightsMembers.turnoutRate)}</strong><small>${formatNumber(turnout.rightsMembers.voterCount)}명 투표</small></div>
      <div class="hero-stat"><span>전국대의원 투표율</span><strong>${formatPercent(turnout.delegates.turnoutRate)}</strong><small>${formatNumber(turnout.delegates.voterCount)}명 투표</small></div>
    </div>`;
}

function leaderCandidateCard(row) {
  const candidate = candidateById("leader", row.id);
  const color = candidateColor(candidate);
  return `<article class="candidate-card final-leader-card data-card ${row.elected ? "is-selected rank-1" : ""}" style="--candidate-color:${color}">
    ${candidateAvatar(candidate)}
    <span class="candidate-rank">${row.elected ? "당선" : "최종 2위"}</span>
    <strong class="candidate-name">${escapeHtml(candidate.name)}</strong>
    <span class="candidate-percent">${formatPercent(row.finalRate)}</span>
    <span class="candidate-votes">권리당원 ${formatNumber(row.rightsVotes)}표 · 전국대의원 ${formatNumber(row.delegateVotes)}표</span>
  </article>`;
}

function renderLeaderFinal() {
  const rows = [...state.final.leader.results].sort((a, b) => b.finalRate - a.finalRate);
  const finalGap = rows[0].finalRate - rows[1].finalRate;
  const metrics = [
    ["전국대의원", "delegateRate"],
    ["권리당원", "rightsRate"],
    ["국민여론조사", "publicPollRate"]
  ];

  els.leaderFinal.innerHTML = `
    <div class="leader-final-grid">${rows.map(leaderCandidateCard).join("")}</div>
    <div class="final-component-compare">
      ${metrics.map(([label, key]) => {
        const a = rows[0], b = rows[1];
        const ca = candidateById("leader", a.id), cb = candidateById("leader", b.id);
        return `<div class="compare-row">
          <div class="compare-label"><strong>${escapeHtml(label)}</strong><i aria-hidden="true">|</i><span>${formatPercent(a[key])} : ${formatPercent(b[key])}</span></div>
          <div class="compare-track split" aria-label="${escapeHtml(label)} 김민석 ${formatPercent(a[key])}, 정청래 ${formatPercent(b[key])}">
            <span style="--share:${a[key]};--candidate-color:${candidateColor(ca)}"></span>
            <span style="--share:${b[key]};--candidate-color:${candidateColor(cb)}"></span>
          </div>
        </div>`;
      }).join("")}
    </div>
    <div class="result-readout compact-readout">
      <div><span>최종 격차</span><strong>${formatPercent(finalGap)}p</strong><small>김민석 우위</small></div>
      <div><span>반영 구조</span><strong>70 : 30</strong><small>당원·대의원 : 여론조사</small></div>
      <div><span>전략지역</span><strong>+5%</strong><small>대구·경북·경남</small></div>
    </div>
    <div class="official-note"><span class="status-chip limited">비공개</span><p>선호투표 적용 전 전국 3인 1순위 합산은 공개되지 않았습니다.</p></div>`;
}

function firstChoiceCard(candidate, votes, total, rank) {
  const pct = total ? votes / total * 100 : 0;
  return `<article class="candidate-card first-choice-card data-card ${rank === 1 ? "rank-1" : ""}" style="--candidate-color:${candidateColor(candidate)}">
    ${candidateAvatar(candidate)}
    <span class="candidate-rank">국내 16개 지역 · ${rank}위</span>
    <strong class="candidate-name">${escapeHtml(candidate.name)}</strong>
    <span class="candidate-percent">${formatPercent(pct)}</span>
    <span class="candidate-votes">${formatNumber(votes)}표 · 공개 원자료</span>
  </article>`;
}

function sankeyFlowSvg(analysis) {
  const jung = candidateById("leader", "jung-chungrae");
  const kim = candidateById("leader", "kim-minseok");
  const song = candidateById("leader", "song-younggil");
  const pool = analysis.songDomestic + analysis.overseasVoters;
  return `
  <div class="preference-flow-wrap">
    <div class="flow-titlebar">
      <strong>권리당원 1순위 공개분 → 선호투표 적용 후 최종</strong>
      <span>확정할 수 없는 구간은 회색으로 표시</span>
    </div>
    <svg class="preference-flow" viewBox="0 0 900 390" preserveAspectRatio="xMidYMid meet" role="img" aria-label="국내 권리당원 1순위 득표와 최종 권리당원 득표 사이의 흐름">
      <defs>
        <linearGradient id="poolGradient" x1="0" x2="1"><stop offset="0" stop-color="#8a92a6"/><stop offset="1" stop-color="#c3c8d3"/></linearGradient>
      </defs>

      <text class="flow-column-title" x="28" y="28">국내 16개 지역 1순위</text>
      <text class="flow-column-title end" x="872" y="28">최종 권리당원</text>

      <path class="flow-band" d="M205 92 C390 92 555 92 695 102" stroke="${candidateColor(jung)}" stroke-width="34" opacity=".30"/>
      <path class="flow-band" d="M205 202 C390 202 555 235 695 252" stroke="${candidateColor(kim)}" stroke-width="41" opacity=".30"/>
      <path class="flow-band" d="M205 312 C355 312 400 187 444 187" stroke="${candidateColor(song)}" stroke-width="12" opacity=".82"/>
      <path class="flow-band" d="M205 352 C365 352 414 213 444 211" stroke="#9ba2b2" stroke-width="4" opacity=".72"/>
      <path class="flow-band" d="M496 185 C585 165 615 125 695 121" stroke="${candidateColor(jung)}" stroke-width="8" opacity=".88"/>
      <path class="flow-band" d="M496 211 C590 222 625 271 695 273" stroke="${candidateColor(kim)}" stroke-width="13" opacity=".88"/>

      <rect class="flow-node" x="165" y="70" width="40" height="44" rx="9" fill="${candidateColor(jung)}"/>
      <rect class="flow-node" x="165" y="180" width="40" height="44" rx="9" fill="${candidateColor(kim)}"/>
      <rect class="flow-node" x="165" y="290" width="40" height="44" rx="9" fill="${candidateColor(song)}"/>
      <rect class="flow-node muted" x="165" y="344" width="40" height="16" rx="7" fill="#9ba2b2"/>

      <rect class="flow-node pool" x="444" y="163" width="52" height="72" rx="12" fill="url(#poolGradient)"/>
      <rect class="flow-node" x="695" y="77" width="44" height="65" rx="10" fill="${candidateColor(jung)}"/>
      <rect class="flow-node" x="695" y="227" width="44" height="65" rx="10" fill="${candidateColor(kim)}"/>

      <g class="flow-label left-start"><text x="28" y="83">정청래</text><text x="28" y="104" class="value">${formatNumber(analysis.leaderDomestic["jung-chungrae"])}표</text></g>
      <g class="flow-label left-start"><text x="28" y="193">김민석</text><text x="28" y="214" class="value">${formatNumber(analysis.leaderDomestic["kim-minseok"])}표</text></g>
      <g class="flow-label left-start"><text x="28" y="303">송영길</text><text x="28" y="324" class="value">${formatNumber(analysis.songDomestic)}표</text></g>
      <g class="flow-label left-start small"><text x="28" y="356">미공개 ${formatNumber(analysis.overseasVoters)}표</text></g>

      <g class="flow-label center"><text x="470" y="145">이전·미공개</text><text x="470" y="257" class="value">${formatNumber(pool)}표</text></g>
      <g class="flow-label right-end"><text x="872" y="93">정청래 최종</text><text x="872" y="114" class="value">${formatNumber(analysis.leaderFinalRights["jung-chungrae"])}표</text><text x="872" y="135" class="delta">+${formatNumber(analysis.jungIncrease)}</text></g>
      <g class="flow-label right-end"><text x="872" y="243">김민석 최종</text><text x="872" y="264" class="value">${formatNumber(analysis.leaderFinalRights["kim-minseok"])}표</text><text x="872" y="285" class="delta">+${formatNumber(analysis.kimIncrease)}</text></g>
    </svg>
    <div class="flow-mobile-fallback">
      <div><strong>정청래</strong><span>${formatNumber(analysis.leaderDomestic["jung-chungrae"])} → ${formatNumber(analysis.leaderFinalRights["jung-chungrae"])}표</span><em>+${formatNumber(analysis.jungIncrease)}</em></div>
      <div><strong>김민석</strong><span>${formatNumber(analysis.leaderDomestic["kim-minseok"])} → ${formatNumber(analysis.leaderFinalRights["kim-minseok"])}표</span><em>+${formatNumber(analysis.kimIncrease)}</em></div>
      <div class="pool"><strong>이전·미공개</strong><span>송영길 국내 ${formatNumber(analysis.songDomestic)} + 미공개 ${formatNumber(analysis.overseasVoters)}</span><em>${formatNumber(pool)}표</em></div>
    </div>
  </div>`;
}

function renderAnalysis(analysis) {
  const total = analysis.leaderDomesticTotal;
  const ranked = ["kim-minseok", "jung-chungrae", "song-younggil"]
    .map((id) => ({ candidate: candidateById("leader", id), votes: analysis.leaderDomestic[id] || 0 }))
    .sort((a, b) => b.votes - a.votes);

  els.analysisGrid.innerHTML = `
    <article class="analysis-card official"><span class="status-chip official">공식</span><h3>국내 16개 지역 공개분</h3><strong>${formatNumber(total)}표</strong><p>당대표 권리당원 1순위 원자료 합계</p></article>
    <article class="analysis-card official"><span class="status-chip official">공식</span><h3>1순위 선두</h3><strong>김민석 ${formatPercent((analysis.leaderDomestic["kim-minseok"] / total) * 100)}</strong><p>${formatNumber(analysis.leaderDomestic["kim-minseok"])}표 · 과반 미달</p></article>
    <article class="analysis-card limited"><span class="status-chip limited">비공개</span><h3>직접 복원 불가</h3><strong>전국 3인 1순위</strong><p>대의원·여론조사의 송영길 1순위는 공개되지 않았습니다.</p></article>`;

  const firstCards = ranked.map((row, index) => firstChoiceCard(row.candidate, row.votes, total, index + 1)).join("");

  els.leaderPreference.innerHTML = `
    <div class="deep-dive-heading"><span class="status-chip derived">분석</span><h3>송영길 표는 어디로 갔나</h3></div>
    <div class="leader-grid first-choice-grid">${firstCards}</div>
    ${sankeyFlowSvg(analysis)}
    <div class="flow-readout">
      <div><span>정청래 증가분</span><strong>+${formatNumber(analysis.jungIncrease)}표</strong><small>국내 원자료 대비 최종 권리당원 증가분</small></div>
      <div><span>김민석 증가분</span><strong>+${formatNumber(analysis.kimIncrease)}표</strong><small>국내 원자료 대비 최종 권리당원 증가분</small></div>
      <div><span>이전·미공개 합계</span><strong>${formatNumber(analysis.songDomestic + analysis.overseasVoters)}표</strong><small>송영길 국내 1순위 + 공개되지 않은 구간</small></div>
    </div>
    <p class="fine-print">정·김 후보의 최종 권리당원 증가분 합계 ${formatNumber(analysis.jungIncrease + analysis.kimIncrease)}표는 송영길 국내 1순위 ${formatNumber(analysis.songDomestic)}표와 공개되지 않은 ${formatNumber(analysis.overseasVoters)}표의 합과 같습니다. 다만 미공개 구간의 최초 분포가 없어 정확한 이전 비율은 확정할 수 없습니다.</p>
    <p class="supporting-data">보조값 · 전체 권리당원과 국내 16개 지역 공지 합계의 차이: 선거인단 ${formatNumber(analysis.overseasEligible)}명, 투표자 ${formatNumber(analysis.overseasVoters)}명.</p>`;
}

function supremeFeaturedCard(row, index) {
  const candidate = candidateById("supreme", row.id);
  const subline = `권리 ${formatPercent(row.rightsRate)} · 대의원 ${formatPercent(row.delegateRate)} · 여론 ${formatPercent(row.publicPollRate)}`;
  return `<article class="candidate-card supreme-featured-card data-card ${index === 0 ? "rank-1" : ""}" style="--candidate-color:${candidateColor(candidate)}">
    ${candidateAvatar(candidate)}
    <span class="candidate-rank">${index + 1}위 · 당선</span>
    <strong class="candidate-name">${escapeHtml(candidate.name)}</strong>
    <span class="candidate-percent">${formatPercent(row.finalRate)}</span>
    <span class="candidate-votes">${subline}</span>
  </article>`;
}

function supremeCompactRow({ candidate, rankLabel, headline, detail, value, withdrawn = false }) {
  return `<article class="supreme-row ${withdrawn ? "withdrawn" : ""}" style="--candidate-color:${candidateColor(candidate)}">
    <span class="supreme-rank">${rankLabel}</span>
    ${candidateAvatar(candidate, "supreme-avatar")}
    <span class="supreme-info"><strong>${escapeHtml(headline)}</strong><small>${detail}</small></span>
    <span class="supreme-value ${withdrawn ? "muted" : ""}">${value}</span>
  </article>`;
}

function renderSupremeFinal(analysis) {
  const active = [...state.final.supreme.results].sort((a, b) => b.finalRate - a.finalRate);
  const elected = active.filter((row) => row.elected).slice(0, 5);
  const remainder = active.filter((row) => !row.elected);
  const withdrawn = state.final.supreme.withdrawn.map((item) => ({
    ...item,
    candidate: candidateById("supreme", item.id),
    domesticVotes: analysis.supremeDomestic[item.id] || 0
  }));

  const featured = elected.map(supremeFeaturedCard).join("");
  const compactActive = remainder.map((row) => {
    const candidate = candidateById("supreme", row.id);
    return supremeCompactRow({
      candidate,
      rankLabel: "6",
      headline: candidate.name,
      detail: `권리 ${formatPercent(row.rightsRate)} · 대의원 ${formatPercent(row.delegateRate)} · 여론 ${formatPercent(row.publicPollRate)}`,
      value: formatPercent(row.finalRate)
    });
  }).join("");
  const compactWithdrawn = withdrawn.map((row) => supremeCompactRow({
    candidate: row.candidate,
    rankLabel: "—",
    headline: `${row.candidate.name} · 8/16 사퇴`,
    detail: `국내 16개 지역 사퇴 전 원득표 ${formatNumber(row.domesticVotes)}표`,
    value: "사퇴",
    withdrawn: true
  })).join("");

  if (els.supremeIntro) {
    els.supremeIntro.textContent = "8월 16일 사퇴한 김영호·임미애 후보의 지역별 사퇴 전 득표는 아래 원자료에 함께 남겨 두었습니다.";
  }

  els.supremeFinal.innerHTML = `
    <div class="supreme-featured-grid">${featured}</div>
    <div class="supreme-cutline-divider"><span>5위까지 당선</span></div>
    <div class="supreme-rest-list">${compactActive}${compactWithdrawn}</div>`;

  els.supremeWithdrawal.innerHTML = `
    <div class="support-note compact">
      <span class="status-chip derived">보조 분석</span>
      <p>사퇴 후보 2명에게 행사된 미공개 구간의 표는 합계 <strong>${formatNumber(analysis.overseasWithdrawnCombined)}표</strong>로 계산됩니다. 후보별 배분은 공개 자료만으로 복원할 수 없습니다.</p>
    </div>`;
}

function renderRegional() {
  const contest = state.regionContest;
  const key = contest === "leader" ? "leaderVotes" : "supremeVotes";
  const candidates = candidateMap(contest);
  const units = doneUnits();
  const totals = sumCandidateVotes(contest);
  const grand = Object.values(totals).reduce((a, b) => a + b, 0);

  els.regionalIntro.textContent = contest === "leader"
    ? ""
    : "";

  const withdrawnSet = new Set((state.final.supreme.withdrawn || []).map((item) => item.id));
  const sortedTotals = [...candidates.values()]
    .map((candidate) => ({ ...candidate, votes: totals[candidate.id] || 0 }))
    .sort((a, b) => b.votes - a.votes);

  els.regionalSummary.innerHTML = sortedTotals.map((row) => {
    const percent = grand ? row.votes / grand * 100 : 0;
    const withdrawn = withdrawnSet.has(row.id);
    return `<div class="regional-total-chip ${withdrawn ? "withdrawn" : ""}" style="--candidate-color:${candidateColor(row)}"><span>${escapeHtml(row.name)}${withdrawn ? " · 사퇴" : ""}</span><strong>${formatNumber(row.votes)}표</strong><small>${formatPercent(percent)}</small></div>`;
  }).join("");

  els.regionList.innerHTML = units.map((unit) => {
    const votes = unit[key] || {};
    const denominator = contest === "leader" ? Number(unit.voterCount) : Number(unit.voterCount) * 2;
    const ranking = [...candidates.values()]
      .map((candidate) => ({ ...candidate, votes: Number(votes[candidate.id]) || 0 }))
      .sort((a, b) => b.votes - a.votes);
    const top = ranking[0];
    const expanded = state.expandedRegion === unit.id;
    const detail = expanded ? `<div class="region-detail-list">${ranking.map((row) => {
      const withdrawn = withdrawnSet.has(row.id);
      const pct = denominator ? row.votes / denominator * 100 : 0;
      return `<div class="region-detail-row ${withdrawn ? "withdrawn" : ""}" style="--candidate-color:${candidateColor(row)}"><span class="region-detail-name"><i></i><b>${escapeHtml(row.name)}</b>${withdrawn ? " <small>사퇴</small>" : ""}</span><strong>${formatNumber(row.votes)}표</strong><em>${formatPercent(pct)}</em></div>`;
    }).join("")}</div>` : "";
    return `<article class="region-card ${expanded ? "expanded" : ""}">
      <button type="button" class="region-card-button" data-region-id="${escapeHtml(unit.id)}" aria-expanded="${expanded}">
        <span class="region-name"><strong>${escapeHtml(unit.name)}</strong><small>선거인단 ${formatNumber(unit.eligibleVoters)} · 투표 ${formatNumber(unit.voterCount)}</small></span>
        <span class="region-turnout"><strong>${formatPercent(unit.turnoutRate)}</strong><small>투표율</small></span>
        <span class="region-top" style="--candidate-color:${candidateColor(top)}"><strong>${escapeHtml(top.name)}</strong><small>${formatNumber(top.votes)}표</small></span>
        <span class="region-chevron">${expanded ? "−" : "+"}</span>
      </button>${detail}
    </article>`;
  }).join("");

  els.regionList.querySelectorAll("[data-region-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.regionId;
      state.expandedRegion = state.expandedRegion === id ? null : id;
      renderRegional();
    });
  });
}

function renderMethod(analysis) {
  els.certaintyGrid.innerHTML = `
    <article><span class="status-chip official">공식</span><h3>그대로 인용</h3><p>최종 득표율, 전국대의원·권리당원 득표수와 투표율, 16개 지역별 원득표.</p></article>
    <article><span class="status-chip derived">역산</span><h3>보조적으로 산출</h3><p>전체 수치와 지역 공지 합계의 차이 등, 공개 숫자끼리의 산술적 차이만 사용합니다.</p></article>
    <article><span class="status-chip limited">비공개</span><h3>숫자를 만들지 않음</h3><p>전국 선호투표 전 3인 합산, 전국대의원·여론조사의 송영길 1순위 등.</p></article>`;
  els.methodNote.innerHTML = `<strong>계산 원칙</strong><p>미공개 변수가 있어 하나의 값으로 결정되지 않는 항목은 범위가 아니라 ‘복원 불가’로 남겼습니다. 전체−국내 차이로 얻은 선거인단 ${formatNumber(analysis.overseasEligible)}명·투표자 ${formatNumber(analysis.overseasVoters)}명은 보조 설명이며, 전략지역 5% 가중치는 대구·경북·경남에 적용됩니다.</p>`;
}

function renderSources() {
  const typeLabels = { regional: "지역 결과", withdrawal: "후보 사퇴", final: "최종 결과" };
  const sources = [...(state.final.sources || [])].sort((a, b) => String(a.publishedAt || "").localeCompare(String(b.publishedAt || "")));
  els.sourceList.innerHTML = sources.map((source) => {
    const date = source.publishedAt ? formatSourceDate(source.publishedAt) : "";
    const type = typeLabels[source.type] || "공식 공지";
    return `<a class="source-item source-type-${escapeHtml(source.type || "reference")}" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">
      <span class="source-main"><span class="source-meta"><em>${escapeHtml(type)}</em>${date ? `<time datetime="${escapeHtml(source.publishedAt)}">${escapeHtml(date)}</time>` : ""}</span><strong>${escapeHtml(source.title || source.shortLabel || "더불어민주당 공식 공지")}</strong><span>${escapeHtml(source.description || "더불어민주당 공식 공지")}</span></span><span class="source-arrow" aria-hidden="true">↗</span>
    </a>`;
  }).join("");
}

function formatSourceDate(dateString) {
  const [year, month, day] = String(dateString || "").split("-").map(Number);
  if (!year || !month || !day) return dateString || "";
  return `${month}월 ${day}일 게시`;
}

function bindControls() {
  document.querySelectorAll(".contest-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.regionContest = button.dataset.contest;
      state.expandedRegion = null;
      document.querySelectorAll(".contest-button").forEach((item) => item.classList.toggle("active", item === button));
      renderRegional();
    });
  });
}

function renderAll() {
  const analysis = computeAnalysis();
  renderHero();
  renderLeaderFinal();
  renderAnalysis(analysis);
  renderSupremeFinal(analysis);
  renderRegional();
  renderMethod(analysis);
  renderSources();
  bindControls();
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
    } catch {}
  });
}

if (els.topButton) {
  els.topButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  window.addEventListener("scroll", () => els.topButton.classList.toggle("visible", window.scrollY > 500), { passive: true });
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
