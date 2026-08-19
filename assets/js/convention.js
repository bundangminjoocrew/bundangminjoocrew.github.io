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
    domesticEligible, domesticVoters,
    domesticTurnout: domesticEligible ? domesticVoters / domesticEligible * 100 : 0,
    overseasEligible, overseasVoters, overseasTurnout,
    leaderDomestic, leaderDomesticTotal, leaderFinalRights, jungIncrease, kimIncrease, songDomestic,
    supremeDomestic, supremeOverseasActive, activeFinalVotes, withdrawnDomesticVotes,
    allRightsSelections, excludedSelections, overseasWithdrawnCombined
  };
}

function renderHero() {
  const turnout = state.final.turnout;
  els.title.textContent = "2026 전당대회";
  els.meta.textContent = "8월 17일 최종 결과 확정 · 공식 결과와 지역별 원자료를 함께 봅니다.";
  document.title = "2026 전당대회 결과 분석 | 분당민주크루";

  els.hero.innerHTML = `
    <div class="hero-topline">
      <span class="dday-badge">최종 결과 확정</span>
      <span class="hero-updated">2026. 8. 17. 전국당원대회</span>
    </div>
    <h2 id="final-title">더불어민주당 제3차 정기전국당원대회</h2>
    <p>당대표·최고위원 최종 결과와 순회경선에서 공개된 권리당원 지역별 원자료를 같은 디자인 체계 안에서 비교합니다.</p>
    <div class="hero-stats">
      <div class="hero-stat"><span>당대표 당선</span><strong>김민석 54.08%</strong></div>
      <div class="hero-stat"><span>권리당원</span><strong>${formatPercent(turnout.rightsMembers.turnoutRate)}</strong><small>${formatNumber(turnout.rightsMembers.voterCount)}명 투표</small></div>
      <div class="hero-stat"><span>전국대의원</span><strong>${formatPercent(turnout.delegates.turnoutRate)}</strong><small>${formatNumber(turnout.delegates.voterCount)}명 투표</small></div>
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
          <div class="compare-label"><strong>${escapeHtml(label)}</strong><span>${formatPercent(a[key])} : ${formatPercent(b[key])}</span></div>
          <div class="compare-track split">
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
    <div class="official-note"><span class="status-chip limited">비공개</span><p>선호투표 적용 전 전국 합산 3인 1순위 결과는 공개되지 않았습니다. 아래 분석은 공개된 국내 권리당원 1순위와 최종 권리당원 결과 사이의 관계만 시각화합니다.</p></div>`;
}

function firstChoiceCard(candidate, votes, total, rank) {
  const pct = total ? votes / total * 100 : 0;
  return `<article class="candidate-card first-choice-card data-card ${rank === 1 ? "rank-1" : ""}" style="--candidate-color:${candidateColor(candidate)}">
    ${candidateAvatar(candidate)}
    <span class="candidate-rank">국내 16개 지역 · ${rank}위</span>
    <strong class="candidate-name">${escapeHtml(candidate.name)}</strong>
    <span class="candidate-percent">${formatPercent(pct)}</span>
    <span class="candidate-votes">${formatNumber(votes)}표 · 공개된 1순위 원자료</span>
  </article>`;
}

function sankeyFlowSvg(analysis) {
  const jung = candidateById("leader", "jung-chungrae");
  const kim = candidateById("leader", "kim-minseok");
  const song = candidateById("leader", "song-younggil");
  const pool = analysis.songDomestic + analysis.overseasVoters;
  return `
  <div class="preference-flow-wrap">
    <svg class="preference-flow" viewBox="0 0 1000 360" role="img" aria-label="국내 권리당원 1순위 득표와 최종 권리당원 득표 사이의 흐름">
      <defs>
        <linearGradient id="poolGradient" x1="0" x2="1"><stop offset="0" stop-color="#8a92a6"/><stop offset="1" stop-color="#c3c8d3"/></linearGradient>
      </defs>
      <path class="flow-band" d="M155 75 C420 75 585 82 845 90" stroke="${candidateColor(jung)}" stroke-width="31" opacity=".32"/>
      <path class="flow-band" d="M155 185 C420 185 585 220 845 230" stroke="${candidateColor(kim)}" stroke-width="38" opacity=".32"/>
      <path class="flow-band" d="M155 295 C350 295 380 178 475 178" stroke="${candidateColor(song)}" stroke-width="10" opacity=".72"/>
      <path class="flow-band overseas-band" d="M155 335 C350 335 400 198 475 198" stroke="#9ba2b2" stroke-width="3" opacity=".75"/>
      <path class="flow-band" d="M525 174 C650 155 710 110 845 108" stroke="${candidateColor(jung)}" stroke-width="7" opacity=".78"/>
      <path class="flow-band" d="M525 198 C650 210 720 250 845 250" stroke="${candidateColor(kim)}" stroke-width="11" opacity=".78"/>

      <rect class="flow-node" x="95" y="53" width="60" height="44" rx="10" fill="${candidateColor(jung)}"/>
      <rect class="flow-node" x="95" y="163" width="60" height="44" rx="10" fill="${candidateColor(kim)}"/>
      <rect class="flow-node" x="95" y="273" width="60" height="44" rx="10" fill="${candidateColor(song)}"/>
      <rect class="flow-node muted" x="95" y="326" width="60" height="18" rx="8" fill="#9ba2b2"/>

      <rect class="flow-node pool" x="475" y="151" width="50" height="72" rx="12" fill="url(#poolGradient)"/>
      <rect class="flow-node" x="845" y="68" width="60" height="62" rx="11" fill="${candidateColor(jung)}"/>
      <rect class="flow-node" x="845" y="215" width="60" height="62" rx="11" fill="${candidateColor(kim)}"/>

      <g class="flow-label left"><text x="75" y="66">정청래</text><text x="75" y="86" class="value">${formatNumber(analysis.leaderDomestic["jung-chungrae"])}표</text></g>
      <g class="flow-label left"><text x="75" y="176">김민석</text><text x="75" y="196" class="value">${formatNumber(analysis.leaderDomestic["kim-minseok"])}표</text></g>
      <g class="flow-label left"><text x="75" y="286">송영길</text><text x="75" y="306" class="value">${formatNumber(analysis.songDomestic)}표</text></g>
      <g class="flow-label left small"><text x="75" y="340">기타 미공개 ${formatNumber(analysis.overseasVoters)}표</text></g>

      <g class="flow-label center"><text x="500" y="133">미분해 풀</text><text x="500" y="245" class="value">${formatNumber(pool)}표</text></g>
      <g class="flow-label right"><text x="925" y="90">정청래 최종</text><text x="925" y="110" class="value">${formatNumber(analysis.leaderFinalRights["jung-chungrae"])}표</text><text x="925" y="130" class="delta">+${formatNumber(analysis.jungIncrease)}</text></g>
      <g class="flow-label right"><text x="925" y="237">김민석 최종</text><text x="925" y="257" class="value">${formatNumber(analysis.leaderFinalRights["kim-minseok"])}표</text><text x="925" y="277" class="delta">+${formatNumber(analysis.kimIncrease)}</text></g>
    </svg>
    <div class="flow-mobile-fallback">
      <div><strong>정청래</strong><span>${formatNumber(analysis.leaderDomestic["jung-chungrae"])} → ${formatNumber(analysis.leaderFinalRights["jung-chungrae"])}표</span><em>+${formatNumber(analysis.jungIncrease)}</em></div>
      <div><strong>김민석</strong><span>${formatNumber(analysis.leaderDomestic["kim-minseok"])} → ${formatNumber(analysis.leaderFinalRights["kim-minseok"])}표</span><em>+${formatNumber(analysis.kimIncrease)}</em></div>
      <div class="pool"><strong>미분해 풀</strong><span>송영길 국내 ${formatNumber(analysis.songDomestic)} + 기타 미공개 ${formatNumber(analysis.overseasVoters)}</span><em>${formatNumber(pool)}표</em></div>
    </div>
  </div>`;
}

function renderAnalysis(analysis) {
  const total = analysis.leaderDomesticTotal;
  const ranked = ["kim-minseok", "jung-chungrae", "song-younggil"]
    .map((id) => ({ candidate: candidateById("leader", id), votes: analysis.leaderDomestic[id] || 0 }))
    .sort((a, b) => b.votes - a.votes);

  els.analysisGrid.innerHTML = `
    <article class="analysis-card official"><span class="status-chip official">공식</span><h3>국내 16개 지역 공개분</h3><strong>${formatNumber(total)}표</strong><p>당대표 권리당원 1순위 원자료의 합계</p></article>
    <article class="analysis-card official"><span class="status-chip official">공식</span><h3>1순위 선두</h3><strong>김민석 ${formatPercent((analysis.leaderDomestic["kim-minseok"] / total) * 100)}</strong><p>383,373표 · 과반에는 미달</p></article>
    <article class="analysis-card limited"><span class="status-chip limited">비공개</span><h3>전국 1차 합산</h3><strong>정확한 복원 불가</strong><p>대의원·여론조사의 송영길 1순위가 공개되지 않음</p></article>`;

  const firstCards = ranked.map((row, index) => firstChoiceCard(row.candidate, row.votes, total, index + 1)).join("");
  const jMin = Math.max(0, analysis.jungIncrease - analysis.overseasVoters);
  const jMax = analysis.jungIncrease;
  const kMin = Math.max(0, analysis.kimIncrease - analysis.overseasVoters);
  const kMax = analysis.kimIncrease;

  els.leaderPreference.innerHTML = `
    <div class="deep-dive-heading"><span class="status-chip derived">분석</span><h3>국내 1순위 득표와 최종 권리당원 득표의 연결</h3></div>
    <div class="leader-grid first-choice-grid">${firstCards}</div>
    ${sankeyFlowSvg(analysis)}
    <div class="flow-readout">
      <div><span>정청래 증가분</span><strong>+${formatNumber(analysis.jungIncrease)}표</strong><small>가능한 송영길 이전표 ${formatNumber(jMin)}~${formatNumber(jMax)}</small></div>
      <div><span>김민석 증가분</span><strong>+${formatNumber(analysis.kimIncrease)}표</strong><small>가능한 송영길 이전표 ${formatNumber(kMin)}~${formatNumber(kMax)}</small></div>
      <div><span>미분해 표</span><strong>${formatNumber(analysis.songDomestic + analysis.overseasVoters)}표</strong><small>송영길 국내 1순위 + 후보별 1순위 미공개분</small></div>
    </div>
    <p class="fine-print"><strong>읽는 법.</strong> 정·김 후보의 최종 권리당원 득표 증가분 합계 ${formatNumber(analysis.jungIncrease + analysis.kimIncrease)}표는 국내 송영길 1순위 ${formatNumber(analysis.songDomestic)}표와 국내 지역 공지에 포함되지 않은 투표 ${formatNumber(analysis.overseasVoters)}표의 합과 같습니다. 다만 그 ${formatNumber(analysis.overseasVoters)}표의 최초 후보별 분포가 공개되지 않아 송영길 표의 정확한 이전 비율은 확정할 수 없습니다.</p>
    <p class="supporting-data">보조값 · 전체 권리당원과 국내 16개 지역 공지 합계의 차이: 선거인단 ${formatNumber(analysis.overseasEligible)}명, 투표자 ${formatNumber(analysis.overseasVoters)}명, 산술상 투표율 ${formatPercent(analysis.overseasTurnout)}. 분석의 주인공이 아니라 미공개 구간을 설명하는 보조값으로만 사용합니다.</p>`;
}

function renderSupremeFinal(analysis) {
  const active = [...state.final.supreme.results].sort((a, b) => b.finalRate - a.finalRate);
  const withdrawn = state.final.supreme.withdrawn.map((item) => {
    const candidate = candidateById("supreme", item.id);
    return { ...item, candidate, domesticVotes: analysis.supremeDomestic[item.id] || 0 };
  });

  const activeRows = active.map((row, index) => {
    const candidate = candidateById("supreme", row.id);
    return `<article class="supreme-row final ${index === 4 ? "cutline" : ""}" style="--candidate-color:${candidateColor(candidate)}">
      <span class="supreme-rank">${index + 1}</span>
      ${candidateAvatar(candidate, "supreme-avatar")}
      <span class="supreme-info"><strong>${escapeHtml(candidate.name)}${row.elected ? " · 당선" : ""}</strong><span class="supreme-mini-track"><span class="supreme-mini-fill" style="width:${Math.min(100, row.finalRate / 20 * 100)}%"></span></span><small>권리 ${formatPercent(row.rightsRate)} · 대의원 ${formatPercent(row.delegateRate)} · 여론 ${formatPercent(row.publicPollRate)}</small></span>
      <span class="supreme-value">${formatPercent(row.finalRate)}<small>최종</small></span>
    </article>`;
  }).join("");

  const withdrawnRows = withdrawn.map((row) => `<article class="supreme-row withdrawn" style="--candidate-color:${candidateColor(row.candidate)}">
    <span class="supreme-rank">—</span>
    ${candidateAvatar(row.candidate, "supreme-avatar")}
    <span class="supreme-info"><strong>${escapeHtml(row.candidate.name)} · 8/16 사퇴</strong><span class="supreme-mini-track"><span class="supreme-mini-fill" style="width:${Math.min(100, row.domesticVotes / 260000 * 100)}%"></span></span><small>국내 16개 지역 사퇴 전 원득표 ${formatNumber(row.domesticVotes)}표</small></span>
    <span class="supreme-value muted">사퇴<small>최종표 제외</small></span>
  </article>`).join("");

  els.supremeFinal.innerHTML = `<div class="supreme-ranking">${activeRows}${withdrawnRows}</div>`;

  els.supremeWithdrawal.innerHTML = `
    <div class="deep-dive-heading"><span class="status-chip derived">보조 분석</span><h3>사퇴 후보 득표는 지역 원자료에 남겨 둡니다</h3></div>
    <p>최고위원은 1인 2표입니다. 최종 결과표에 남은 6명의 권리당원 득표와 국내 16개 지역의 8명 원자료를 맞춰보면, 사퇴 후보 두 명에게 행사된 미공개 구간의 표가 합계 <strong>${formatNumber(analysis.overseasWithdrawnCombined)}표</strong>로 계산됩니다. 후보별 배분은 복원할 수 없으므로 화면에서는 이 값만 작은 보조 설명으로 남깁니다.</p>`;
}

function renderRegional() {
  const contest = state.regionContest;
  const key = contest === "leader" ? "leaderVotes" : "supremeVotes";
  const candidates = candidateMap(contest);
  const units = doneUnits();
  const totals = sumCandidateVotes(contest);
  const grand = Object.values(totals).reduce((a, b) => a + b, 0);

  els.regionalIntro.textContent = contest === "leader"
    ? "각 지역 공지에서 공개된 권리당원 당대표 1순위 득표입니다. 최종 선호투표 결과와는 별도 지표입니다."
    : "최고위원 1인 2표 원득표입니다. 김영호·임미애 후보의 사퇴 전 지역별 득표도 원자료로 보존합니다.";

  const sortedTotals = [...candidates.values()].map((candidate) => ({ ...candidate, votes: totals[candidate.id] || 0 })).sort((a, b) => b.votes - a.votes);
  els.regionalSummary.innerHTML = sortedTotals.map((row) => {
    const percent = grand ? row.votes / grand * 100 : 0;
    const withdrawn = state.final.supreme.withdrawn.some((item) => item.id === row.id);
    return `<div class="regional-total-chip ${withdrawn ? "withdrawn" : ""}" style="--candidate-color:${candidateColor(row)}"><span>${escapeHtml(row.name)}${withdrawn ? " · 사퇴" : ""}</span><strong>${formatNumber(row.votes)}표</strong><small>${formatPercent(percent)}</small></div>`;
  }).join("");

  els.regionList.innerHTML = units.map((unit) => {
    const votes = unit[key] || {};
    const denominator = contest === "leader" ? Number(unit.voterCount) : Number(unit.voterCount) * 2;
    const ranking = [...candidates.values()].map((candidate) => ({ ...candidate, votes: Number(votes[candidate.id]) || 0 })).sort((a, b) => b.votes - a.votes);
    const top = ranking[0];
    const expanded = state.expandedRegion === unit.id;
    const detail = expanded ? `<div class="region-detail-list">${ranking.map((row) => {
      const withdrawn = state.final.supreme.withdrawn.some((item) => item.id === row.id);
      const pct = denominator ? row.votes / denominator * 100 : 0;
      return `<div class="region-detail-row ${withdrawn ? "withdrawn" : ""}" style="--candidate-color:${candidateColor(row)}"><span><i></i>${escapeHtml(row.name)}${withdrawn ? " <small>사퇴</small>" : ""}</span><strong>${formatNumber(row.votes)}표</strong><em>${formatPercent(pct)}</em></div>`;
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
  els.methodNote.innerHTML = `<strong>계산 원칙</strong><p>미공개 변수가 있어 하나의 값으로 결정되지 않는 항목은 범위로 표시하거나 ‘복원 불가’로 남깁니다. 전체−국내 차이로 얻은 선거인단 ${formatNumber(analysis.overseasEligible)}명·투표자 ${formatNumber(analysis.overseasVoters)}명은 분석 보조값이며 메인 결과로 취급하지 않습니다. 전략지역 5% 가중치는 대구·경북·경남에 적용됩니다.</p>`;
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
