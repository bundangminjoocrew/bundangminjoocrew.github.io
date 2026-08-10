const json = (x, status = 200) => new Response(JSON.stringify(x), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  },
});

const normalizeNickname = (v) => String(v || "")
  .normalize("NFKC")
  .trim()
  .replace(/\s+/g, "")
  .toLowerCase();

const normalizeText = (v) => String(v || "").normalize("NFKC").trim();

const districtLike = (v) => /^[가-힣0-9·]+동$/.test(normalizeText(v));

const parseNickname = (raw) => {
  const v = normalizeText(raw);
  const i = v.indexOf("/");
  if (i <= 0 || i === v.length - 1 || v.indexOf("/", i + 1) !== -1) return null;
  const name = v.slice(0, i).trim();
  const district = v.slice(i + 1).trim();
  if (!name || !district || !districtLike(district)) return null;
  return { display: name + "/" + district, name, district };
};

const isPlaceholder = (v) => {
  const x = normalizeText(v).replace(/\s+/g, "").toLowerCase();
  return ["모름", "미상", "unknown", "?", "-", "없음"].includes(x);
};

const plusYears = (iso, years) => {
  const d = new Date(iso);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString();
};

function reviewer(request) {
  return request.headers.get("Cf-Access-Authenticated-User-Email") || "access-user";
}

const CSS = `
:root{--bg:#f6f7f9;--card:#fff;--ink:#17191d;--muted:#737984;--line:#e6e8ec;--blue:#1f5eff;--blue2:#eaf0ff;--ok:#137a43;--bad:#b42318;--amber:#8a5a00;--shadow:0 10px 30px rgba(18,24,40,.06)}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:Inter,Pretendard,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{max-width:1280px;margin:0 auto;padding:36px 20px 80px}.eyebrow{font-size:13px;font-weight:800;color:var(--blue);letter-spacing:.04em}.top{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;margin:8px 0 20px}.top h1{font-size:30px;margin:0}.muted{color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}.metric,.card{background:var(--card);border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow)}.metric{padding:18px}.metric b{display:block;font-size:28px;margin-top:6px}.card{margin-top:16px;padding:18px}.progress{height:10px;background:#edf0f4;border-radius:999px;overflow:hidden}.progress>i{display:block;height:100%;background:var(--blue)}table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:12px 8px;border-bottom:1px solid var(--line);vertical-align:middle}th{color:var(--muted);font-size:12px;white-space:nowrap}.pill{display:inline-block;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:750;background:#eef0f3}.pill.pending{background:#fff4dc;color:#805b00}.pill.verified{background:#e8f7ef;color:var(--ok)}.pill.rejected{background:#ffefed;color:var(--bad)}.pill.wait1,.pill.wait2{background:#eef3ff;color:#2456c7}.pill.admitted{background:#e8f7ef;color:var(--ok)}button,.btn{border:0;border-radius:10px;padding:9px 12px;font-weight:800;cursor:pointer;text-decoration:none;display:inline-block;font:inherit}.ok{background:#e8f7ef;color:var(--ok)}.bad{background:#ffefed;color:var(--bad)}.view{background:var(--blue2);color:var(--blue)}.secondary{background:#f1f2f4;color:#333}.toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center}.danger-note{font-size:12px;color:var(--muted)}dialog{border:0;border-radius:18px;max-width:min(920px,94vw);width:100%;padding:0;box-shadow:0 30px 90px rgba(0,0,0,.25)}dialog::backdrop{background:rgba(0,0,0,.45)}.dlg{padding:18px}.proof{width:100%;max-height:70vh;object-fit:contain;background:#111;border-radius:12px}.import{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.tabs{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0 0}.tabs button{background:#e9ebef;color:#4d535c}.tabs button.active{background:var(--ink);color:#fff}.sectionHead{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:12px}.sectionHead h2{font-size:18px;margin:0}.hidden{display:none!important}.flow{font-size:13px;color:var(--muted);margin-top:6px}.countBadge{font-size:12px;background:#eef0f3;border-radius:999px;padding:4px 8px;margin-left:6px}.subgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}.box{border:1px solid var(--line);border-radius:14px;padding:16px;background:#fbfcfd}.box h3{margin:0 0 6px;font-size:16px}.formrow{display:grid;grid-template-columns:1fr 1fr;gap:10px}.field{display:flex;flex-direction:column;gap:6px;margin-top:10px}.field label{font-size:12px;font-weight:800;color:#555}.field input,.field select,.toolbar input{border:1px solid var(--line);border-radius:10px;padding:10px 11px;font:inherit;background:#fff}.issue{border-top:1px solid var(--line);padding:14px 0}.issue:first-child{border-top:0}.issueRaw{font-weight:800;word-break:break-all}.issueForm{display:grid;grid-template-columns:1fr 1fr auto auto;gap:8px;align-items:end;margin-top:8px}.summary{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.summary span{background:#f1f3f6;border-radius:999px;padding:7px 10px;font-size:13px;font-weight:750}.summary .warn{background:#fff4dc;color:#805b00}.summary .oksum{background:#e8f7ef;color:var(--ok)}.successText{color:var(--ok);font-weight:800}.errorText{color:var(--bad);font-weight:800}.rosterStats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}.rosterStat{border:1px solid var(--line);border-radius:12px;padding:12px;background:#fff}.rosterStat b{display:block;font-size:22px;margin-top:4px}.memberList{max-height:360px;overflow:auto;border:1px solid var(--line);border-radius:12px}.memberPick{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:10px 12px;border-bottom:1px solid var(--line)}.memberPick:last-child{border-bottom:0}.aliasText{font-size:12px;color:var(--muted);margin-top:3px}.actions{display:flex;gap:6px;flex-wrap:wrap}.compact{padding:6px 9px;font-size:12px}
@media(max-width:900px){.grid{grid-template-columns:1fr 1fr}.top{align-items:flex-start;flex-direction:column}.card{overflow:auto}.subgrid{grid-template-columns:1fr}.issueForm,.formrow{grid-template-columns:1fr}.rosterStats{grid-template-columns:1fr 1fr}}
`;

function page() {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>분민크 인증 관리</title><style>${CSS}</style><script defer src="/admin.js"></script></head><body><main>
  <div class="eyebrow">분민크 · MEMBER VERIFICATION</div>
  <div class="top"><div><h1>당원 인증 및 입장 관리</h1><div class="muted">O 확인 즉시 인증 원본 삭제 · 신규 참여자는 입장 대기-1 → 대기-2 → 입장 명부 순으로 관리합니다.</div></div><div id="who" class="muted"></div></div>
  <section class="grid" id="metrics"></section>

  <section class="card">
    <div style="display:flex;justify-content:space-between;gap:16px;align-items:center;flex-wrap:wrap"><div><b>기존 참여자 재확인</b><div class="muted" id="progressText"></div></div><b id="progressPct">0%</b></div>
    <div class="progress" style="margin-top:12px"><i id="progressBar" style="width:0%"></i></div>
    <div class="rosterStats">
      <div class="rosterStat"><span class="muted">원본 명부</span><b id="rosterSourceTotal">0</b></div>
      <div class="rosterStat"><span class="muted">식별·연결 완료</span><b id="rosterIdentified">0</b></div>
      <div class="rosterStat"><span class="muted">확인 필요</span><b id="rosterPending">0</b></div>
      <div class="rosterStat"><span class="muted">활성 인물</span><b id="rosterActive">0</b></div>
    </div>
  </section>

  <div class="tabs">
    <button data-tab="review" class="active">인증 검토</button>
    <button data-tab="wait1">입장 대기-1 <span class="countBadge" id="wait1Count">0</span></button>
    <button data-tab="wait2">입장 대기-2 <span class="countBadge" id="wait2Count">0</span></button>
    <button data-tab="members">입장 명부 <span class="countBadge" id="memberCount">0</span></button>
  </div>

  <section class="card tabPanel" id="tab-review">
    <div class="sectionHead"><div><h2>인증 검토</h2><div class="flow">자동 일치 실패 재확인은 기존 참여자와 직접 연결할 수 있습니다. 이미 O 처리된 건도 사후 연결하면 재확인 완료에 반영됩니다.</div></div></div>
    <div class="toolbar"><select id="status"><option value="all">전체 상태</option><option value="pending">미확인</option><option value="verified">O 확인</option><option value="rejected">X 확인</option></select><select id="type"><option value="all">전체 유형</option><option value="reverify">기존 참여자 재확인</option><option value="new">신규 참여</option></select><button class="view" id="refreshBtn">새로고침</button></div><div id="reviewTable"></div>
  </section>

  <section class="card tabPanel hidden" id="tab-wait1">
    <div class="sectionHead"><div><h2>입장 대기-1</h2><div class="flow">당원 여부 O 확인 완료 · 아직 연락 전</div></div><a class="btn view" href="/api/onboarding/wait1.csv">이름·전화번호 CSV 다운로드</a></div>
    <div id="wait1Table"></div>
  </section>

  <section class="card tabPanel hidden" id="tab-wait2">
    <div class="sectionHead"><div><h2>입장 대기-2</h2><div class="flow">연락 완료 · 실제 오픈채팅 입장 여부 확인 대기</div></div></div>
    <div id="wait2Table"></div>
  </section>

  <section class="card tabPanel hidden" id="tab-members">
    <div class="sectionHead"><div><h2>입장 명부</h2><div class="flow">기존 참여자 재확인 완료자 + 신규 참여자 입장 완료자를 합친 최종 명부</div></div></div>
    <div id="membersTable"></div>
  </section>

  <section class="card">
    <div class="sectionHead"><div><h2>기존 참여자 명부 관리</h2><div class="flow">표준 식별값은 <code>이름/거주동</code>입니다. 직책·후보자명·예전 닉네임은 별칭으로 별도 보존합니다.</div></div><span class="countBadge" id="issueCount">확인 필요 0</span></div>
    <div class="box">
      <h3>CSV 가져오기</h3>
      <p class="muted">원본 CSV를 다시 가져오면 원본 명부 건수를 기록합니다. 정확한 <code>이름/거주동</code>만 자동 등록하며, 직책·별명 등 형식이 다른 항목은 확인 필요에 남깁니다.</p>
      <div class="import"><input type="file" id="csv" accept=".csv,text/csv"><button class="view" id="importBtn">CSV 가져오기</button><span id="importResult" class="muted"></span></div>
      <div id="importSummary" class="summary"></div>
    </div>

    <div class="subgrid">
      <div class="box">
        <h3>확인 필요 명단</h3>
        <p class="muted">정확한 정보가 없으면 그대로 두세요. 기존 참여자와 같은 사람이라면 ‘기존 참여자 연결’을 사용하고, 새 표준 식별값이 확실할 때만 신규 등록하세요.</p>
        <div id="issueList"></div>
      </div>
      <div class="box">
        <h3>기존 참여자 개별 등록</h3>
        <p class="muted">같은 <code>이름/거주동</code>이 이미 있으면 자동 병합하지 않고 중복 경고를 냅니다.</p>
        <form id="manualForm">
          <div class="formrow">
            <div class="field"><label for="manualName">이름</label><input id="manualName" autocomplete="off" required></div>
            <div class="field"><label for="manualDistrict">거주동</label><input id="manualDistrict" autocomplete="off" placeholder="예: 서현동" required></div>
          </div>
          <div class="field"><label for="manualLegacy">현재/기존 오픈채팅 닉네임 (선택)</label><input id="manualLegacy" autocomplete="off"></div>
          <div class="import" style="margin-top:12px"><button class="view" type="submit">기존 참여자로 등록</button><span id="manualResult" class="muted"></span></div>
        </form>
      </div>
    </div>

    <div class="box" style="margin-top:16px">
      <div class="sectionHead"><div><h3>활성 기존 참여자</h3><div class="flow">이름·거주동을 수정하거나 과거/현재 닉네임을 별칭으로 추가할 수 있습니다.</div></div><input id="memberSearch" placeholder="이름·거주동·별칭 검색"></div>
      <div id="rosterMemberTable"></div>
    </div>
  </section>

  <dialog id="dlg"><div class="dlg"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><b>인증자료 확인</b><button id="closeDlg">닫기</button></div><div id="proofBox"></div><p class="danger-note">O 처리 시 원본은 즉시 영구 삭제됩니다.</p></div></dialog>

  <dialog id="linkDlg"><div class="dlg"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div><b id="linkTitle">기존 참여자 연결</b><div class="muted" id="linkSubtitle"></div></div><button id="closeLinkDlg">닫기</button></div><div class="field"><label for="linkSearch">참여자 검색</label><input id="linkSearch" autocomplete="off" placeholder="이름 또는 거주동"></div><div id="linkMemberList" class="memberList" style="margin-top:12px"></div></div></dialog>

  <dialog id="editDlg"><div class="dlg"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><b>기존 참여자 정보 수정</b><button id="closeEditDlg">닫기</button></div><form id="editMemberForm"><input type="hidden" id="editMemberId"><div class="formrow"><div class="field"><label for="editName">이름</label><input id="editName" required></div><div class="field"><label for="editDistrict">거주동</label><input id="editDistrict" required></div></div><div class="field"><label for="editAlias">추가할 현재/과거 닉네임 (선택)</label><input id="editAlias"></div><div class="import" style="margin-top:14px"><button class="view" type="submit">저장</button><span id="editResult" class="muted"></span></div></form></div></dialog>
  </main></body></html>`;
}

const ADMIN_JS = String.raw`
const $ = (s) => document.querySelector(s);
let reviewRows = [];
let rosterMembers = [];
let linkContext = null;

async function api(path, opt) {
  const r = await fetch(path, opt);
  const ct = r.headers.get('content-type') || '';
  const j = ct.includes('application/json') ? await r.json() : { message: await r.text() };
  if (!r.ok) {
    const err = new Error(j.message || '요청 실패');
    err.data = j;
    err.status = r.status;
    throw err;
  }
  return j;
}

function e(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[c]);
}

function fmt(v) { return v ? new Date(v).toLocaleString('ko-KR') : '-'; }
function stageName(s) { return ({ wait1: '대기-1', wait2: '대기-2', admitted: '입장 완료' })[s] || '-'; }

async function loadAll() {
  const q = new URLSearchParams({ status: $('#status').value, type: $('#type').value });
  const [s, l, w1, w2, m, issues, roster] = await Promise.all([
    api('/api/stats'),
    api('/api/submissions?' + q),
    api('/api/onboarding?stage=wait1'),
    api('/api/onboarding?stage=wait2'),
    api('/api/members'),
    api('/api/roster/issues'),
    api('/api/roster/members')
  ]);

  reviewRows = l.items || [];
  rosterMembers = roster.items || [];

  $('#who').textContent = s.reviewer;
  $('#metrics').innerHTML = [
    ['미확인', s.pending], ['O 확인', s.verified], ['X 확인', s.rejected], ['대기-1', s.wait1], ['대기-2', s.wait2]
  ].map((x) => '<div class="metric"><span class="muted">' + x[0] + '</span><b>' + x[1] + '</b></div>').join('');

  const denominator = s.rosterSourceTotal || 0;
  const pct = denominator ? Math.round(s.rosterReverified * 1000 / denominator) / 10 : 0;
  $('#progressText').textContent = s.rosterReverified + ' / ' + denominator + '명 완료';
  $('#progressPct').textContent = pct + '%';
  $('#progressBar').style.width = Math.min(100, pct) + '%';

  $('#rosterSourceTotal').textContent = s.rosterSourceTotal;
  $('#rosterIdentified').textContent = s.rosterIdentified;
  $('#rosterPending').textContent = s.rosterPending;
  $('#rosterActive').textContent = s.rosterActive;

  $('#wait1Count').textContent = w1.items.length;
  $('#wait2Count').textContent = w2.items.length;
  $('#memberCount').textContent = m.items.length;
  $('#issueCount').textContent = '확인 필요 ' + issues.items.length;

  renderReview();
  renderWait1(w1.items);
  renderWait2(w2.items);
  renderMembers(m.items);
  renderIssues(issues.items);
  renderRosterMembers(rosterMembers);
}

function renderReview() {
  if (!reviewRows.length) {
    $('#reviewTable').innerHTML = '<p class="muted">표시할 접수 내역이 없습니다.</p>';
    return;
  }
  $('#reviewTable').innerHTML = '<table><thead><tr><th>접수</th><th>유형</th><th>닉네임</th><th>이름</th><th>거주동</th><th>명부</th><th>상태</th><th>자료</th><th>판정</th></tr></thead><tbody>' +
    reviewRows.map((r) => {
      let proof = r.proof_key ? '<button class="view compact" data-action="proof" data-id="' + e(r.id) + '">보기</button>' : '삭제됨';
      let action = '-';
      if (r.review_status === 'pending') {
        action = '<button class="ok compact" data-action="review" data-decision="verified" data-id="' + e(r.id) + '">O</button> ' +
          '<button class="bad compact" data-action="review" data-decision="rejected" data-id="' + e(r.id) + '">X</button>';
      } else if (r.request_type === 'new' && r.review_status === 'verified') {
        action = '<span class="pill ' + e(r.onboarding_stage || 'wait1') + '">' + stageName(r.onboarding_stage || 'wait1') + '</span>';
      }

      let rosterCell = '-';
      if (r.request_type === 'reverify') {
        if (r.roster_match && r.roster_member_id) {
          rosterCell = '<span class="successText">일치</span> <button class="secondary compact" data-action="link-submission" data-id="' + e(r.id) + '">변경</button>';
        } else {
          rosterCell = '<span class="errorText">불일치</span> <button class="view compact" data-action="link-submission" data-id="' + e(r.id) + '">기존 참여자 연결</button>';
        }
      }

      return '<tr><td>' + fmt(r.submitted_at) + '</td><td>' + (r.request_type === 'reverify' ? '재확인' : '신규') + '</td><td>' + e(r.chat_nickname || '-') + '</td><td>' + e(r.name) + '</td><td>' + e(r.district) + '</td><td>' + rosterCell + '</td><td><span class="pill ' + e(r.review_status) + '">' + ({ pending: '미확인', verified: 'O', rejected: 'X' })[r.review_status] + '</span></td><td>' + proof + '</td><td>' + action + '</td></tr>';
    }).join('') + '</tbody></table>';
}

function renderWait1(rows) {
  if (!rows.length) { $('#wait1Table').innerHTML = '<p class="muted">입장 대기-1 대상자가 없습니다.</p>'; return; }
  $('#wait1Table').innerHTML = '<table><thead><tr><th>O 확인일</th><th>이름</th><th>전화번호</th><th>거주동</th><th>당원구분</th><th>처리</th></tr></thead><tbody>' +
    rows.map((r) => '<tr><td>' + fmt(r.reviewed_at) + '</td><td>' + e(r.name) + '</td><td>' + e(r.phone || '-') + '</td><td>' + e(r.district) + '</td><td>' + (r.member_type === 'rights' ? '권리당원' : '일반당원') + '</td><td><button class="view" data-action="contacted" data-id="' + e(r.id) + '">연락 완료</button></td></tr>').join('') + '</tbody></table>';
}

function renderWait2(rows) {
  if (!rows.length) { $('#wait2Table').innerHTML = '<p class="muted">입장 대기-2 대상자가 없습니다.</p>'; return; }
  $('#wait2Table').innerHTML = '<table><thead><tr><th>연락 완료일</th><th>이름</th><th>전화번호</th><th>거주동</th><th>처리</th></tr></thead><tbody>' +
    rows.map((r) => '<tr><td>' + fmt(r.contacted_at) + '</td><td>' + e(r.name) + '</td><td>' + e(r.phone || '-') + '</td><td>' + e(r.district) + '</td><td><button class="ok" data-action="admit" data-id="' + e(r.id) + '">입장 확인</button></td></tr>').join('') + '</tbody></table>';
}

function renderMembers(rows) {
  if (!rows.length) { $('#membersTable').innerHTML = '<p class="muted">확인 완료된 입장 명부가 없습니다.</p>'; return; }
  $('#membersTable').innerHTML = '<table><thead><tr><th>구분</th><th>닉네임</th><th>별칭</th><th>이름</th><th>거주동</th><th>확인/입장일</th></tr></thead><tbody>' +
    rows.map((r) => '<tr><td>' + (r.source === 'existing' ? '기존 참여자' : '신규 입장') + '</td><td>' + e(r.nickname || '-') + '</td><td>' + e(r.aliases || r.legacy_nickname || '-') + '</td><td>' + e(r.name || '-') + '</td><td>' + e(r.district || '-') + '</td><td>' + fmt(r.completed_at) + '</td></tr>').join('') + '</tbody></table>';
}

function suggestion(raw) {
  const parts = String(raw || '').split('/').map((x) => x.trim());
  if (parts.length >= 2 && parts[0] && /^[가-힣0-9·]+동$/.test(parts[1])) return { name: parts[0], district: parts[1] };
  return { name: '', district: '' };
}

function renderIssues(rows) {
  if (!rows.length) {
    $('#issueList').innerHTML = '<p class="muted">확인 필요한 항목이 없습니다.</p>';
    return;
  }
  $('#issueList').innerHTML = rows.map((r) => {
    const s = suggestion(r.original_nickname);
    return '<div class="issue"><div class="issueRaw">' + e(r.original_nickname) + '</div><div class="muted">가져온 시각 ' + fmt(r.created_at) + '</div>' +
      '<div class="issueForm"><div class="field"><label>이름</label><input data-role="issue-name" data-id="' + e(r.id) + '" value="' + e(s.name) + '"></div>' +
      '<div class="field"><label>거주동</label><input data-role="issue-district" data-id="' + e(r.id) + '" value="' + e(s.district) + '"></div>' +
      '<button class="view" data-action="resolve-issue" data-id="' + e(r.id) + '">신규 등록</button>' +
      '<button class="secondary" data-action="link-issue" data-id="' + e(r.id) + '">기존 참여자 연결</button></div></div>';
  }).join('');
}

function renderRosterMembers(rows) {
  const q = ($('#memberSearch').value || '').trim().toLowerCase();
  const filtered = !q ? rows : rows.filter((r) => {
    const hay = [r.display_nickname, r.name, r.district, r.aliases].join(' ').toLowerCase();
    return hay.includes(q);
  });
  if (!filtered.length) {
    $('#rosterMemberTable').innerHTML = '<p class="muted">표시할 기존 참여자가 없습니다.</p>';
    return;
  }
  $('#rosterMemberTable').innerHTML = '<table><thead><tr><th>표준 식별값</th><th>별칭</th><th>재확인</th><th>관리</th></tr></thead><tbody>' +
    filtered.map((r) => '<tr><td><b>' + e(r.display_nickname) + '</b></td><td>' + e(r.aliases || r.legacy_nickname || '-') + '</td><td>' + (r.reverified_at ? fmt(r.reverified_at) : '-') + '</td><td><button class="secondary compact" data-action="edit-member" data-id="' + e(r.id) + '">수정</button></td></tr>').join('') +
    '</tbody></table>';
}

async function review(id, decision) {
  if (decision === 'verified' && !confirm('O로 확인하면 인증 원본이 즉시 삭제됩니다. 신규 참여자는 입장 대기-1로 이동합니다. 계속할까요?')) return;
  if (decision === 'rejected' && !confirm('X로 표시할까요? 원본은 제출일 기준 7일까지 보관 후 자동 삭제됩니다.')) return;
  await api('/api/submissions/' + id + '/review', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decision }) });
  await loadAll();
}

async function contacted(id) {
  if (!confirm('연락을 완료했습니까? 대상자를 입장 대기-2로 이동합니다.')) return;
  await api('/api/onboarding/' + id + '/contacted', { method: 'POST' });
  await loadAll();
  switchTab('wait2');
}

async function admit(id) {
  if (!confirm('실제 오픈채팅 입장을 확인했습니까? 확인 후 최종 입장 명부로 이동합니다.')) return;
  await api('/api/onboarding/' + id + '/admit', { method: 'POST' });
  await loadAll();
  switchTab('members');
}

async function proof(id) {
  const r = await fetch('/api/submissions/' + id + '/proof');
  if (!r.ok) { alert('자료를 불러올 수 없습니다.'); return; }
  const blob = await r.blob();
  const u = URL.createObjectURL(blob);
  const ct = r.headers.get('content-type') || '';
  $('#proofBox').innerHTML = ct.includes('pdf') ? '<iframe src="' + u + '" style="width:100%;height:70vh;border:0"></iframe>' : '<img class="proof" src="' + u + '">';
  $('#dlg').showModal();
}

async function importCSV() {
  const f = $('#csv').files[0];
  if (!f) { $('#importResult').textContent = 'CSV 파일을 선택하세요.'; return; }
  $('#importResult').textContent = '가져오는 중…';
  $('#importSummary').innerHTML = '';
  try {
    const text = await f.text();
    const r = await api('/api/roster/import', { method: 'POST', headers: { 'content-type': 'text/csv; charset=utf-8' }, body: text });
    $('#importResult').textContent = '가져오기 완료';
    $('#importResult').className = 'successText';
    $('#importSummary').innerHTML = '<span>원본 ' + r.total + '건</span><span class="oksum">자동 식별 ' + r.identified + '건</span><span class="warn">확인 필요 ' + r.pending + '건</span>';
    await loadAll();
  } catch (err) {
    $('#importResult').textContent = err.message || '가져오기에 실패했습니다.';
    $('#importResult').className = 'errorText';
  }
}

async function resolveIssue(id) {
  const nameEl = document.querySelector('[data-role="issue-name"][data-id="' + CSS.escape(id) + '"]');
  const districtEl = document.querySelector('[data-role="issue-district"][data-id="' + CSS.escape(id) + '"]');
  const name = (nameEl && nameEl.value || '').trim();
  const district = (districtEl && districtEl.value || '').trim();
  if (!name || !district) { alert('정확한 이름과 거주동을 모두 아는 경우에만 신규 등록하세요. 모르면 그대로 확인 필요 상태로 두면 됩니다.'); return; }
  try {
    const r = await api('/api/roster/issues/' + id + '/resolve', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, district }) });
    alert(r.nickname + '으로 신규 등록했습니다.');
    await loadAll();
  } catch (err) {
    if (err.data && err.data.code === 'MEMBER_EXISTS') {
      alert('이미 ' + err.data.existingMember.display_nickname + ' 참여자가 있습니다. 자동 병합하지 않았습니다. 같은 사람이라면 "기존 참여자 연결"을 사용하세요.');
    } else {
      alert(err.message || '등록에 실패했습니다.');
    }
  }
}

async function manualAdd(ev) {
  ev.preventDefault();
  const name = $('#manualName').value.trim();
  const district = $('#manualDistrict').value.trim();
  const legacy_nickname = $('#manualLegacy').value.trim();
  const out = $('#manualResult');
  out.textContent = '등록 중…'; out.className = 'muted';
  try {
    const r = await api('/api/roster/manual', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, district, legacy_nickname }) });
    out.textContent = r.nickname + ' 등록 완료'; out.className = 'successText';
    $('#manualForm').reset();
    await loadAll();
  } catch (err) {
    if (err.data && err.data.code === 'MEMBER_EXISTS') {
      out.textContent = '이미 ' + err.data.existingMember.display_nickname + ' 참여자가 있습니다. 자동 병합하지 않았습니다.';
    } else {
      out.textContent = err.message || '등록에 실패했습니다.';
    }
    out.className = 'errorText';
  }
}

function switchTab(name) {
  document.querySelectorAll('.tabPanel').forEach((x) => x.classList.add('hidden'));
  document.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('active', x.dataset.tab === name));
  $('#tab-' + name).classList.remove('hidden');
}

function openLink(kind, id) {
  linkContext = { kind, id };
  let subtitle = '';
  if (kind === 'submission') {
    const r = reviewRows.find((x) => x.id === id);
    subtitle = r ? (r.chat_nickname + ' · ' + (r.review_status === 'verified' ? 'O 처리됨' : '미확인')) : '';
  } else {
    const issue = document.querySelector('[data-action="link-issue"][data-id="' + CSS.escape(id) + '"]');
    subtitle = issue ? issue.closest('.issue').querySelector('.issueRaw').textContent : '';
  }
  $('#linkSubtitle').textContent = subtitle;
  $('#linkSearch').value = subtitle.split('/')[0] || '';
  renderLinkMembers();
  $('#linkDlg').showModal();
  $('#linkSearch').focus();
}

function renderLinkMembers() {
  const q = ($('#linkSearch').value || '').trim().toLowerCase();
  const rows = rosterMembers.filter((r) => {
    if (!q) return true;
    return [r.display_nickname, r.name, r.district, r.aliases].join(' ').toLowerCase().includes(q);
  }).slice(0, 80);

  $('#linkMemberList').innerHTML = rows.length ? rows.map((r) =>
    '<div class="memberPick"><div><b>' + e(r.display_nickname) + '</b><div class="aliasText">' + e(r.aliases || r.legacy_nickname || '') + '</div></div><button class="view compact" data-action="choose-link-member" data-id="' + e(r.id) + '">이 사람과 연결</button></div>'
  ).join('') : '<p class="muted" style="padding:12px">검색 결과가 없습니다.</p>';
}

async function chooseLinkMember(memberId) {
  if (!linkContext) return;
  const member = rosterMembers.find((x) => x.id === memberId);
  if (!member) return;
  if (!confirm(member.display_nickname + ' 참여자와 연결할까요?')) return;

  if (linkContext.kind === 'submission') {
    const r = await api('/api/submissions/' + linkContext.id + '/link-member', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ member_id: memberId }) });
    alert(r.reverified ? '연결했고 이미 O 처리된 접수이므로 재확인 완료에도 반영했습니다.' : '기존 참여자와 연결했습니다. O 처리 시 재확인 완료에 반영됩니다.');
  } else {
    await api('/api/roster/issues/' + linkContext.id + '/link', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ member_id: memberId }) });
    alert('확인 필요 항목을 ' + member.display_nickname + ' 참여자와 연결했습니다.');
  }

  $('#linkDlg').close();
  linkContext = null;
  await loadAll();
}

function openEditMember(id) {
  const r = rosterMembers.find((x) => x.id === id);
  if (!r) return;
  $('#editMemberId').value = r.id;
  $('#editName').value = r.name || '';
  $('#editDistrict').value = r.district || '';
  $('#editAlias').value = '';
  $('#editResult').textContent = r.aliases ? '현재 별칭: ' + r.aliases : '';
  $('#editResult').className = 'muted';
  $('#editDlg').showModal();
}

async function saveMemberEdit(ev) {
  ev.preventDefault();
  const id = $('#editMemberId').value;
  const body = {
    name: $('#editName').value.trim(),
    district: $('#editDistrict').value.trim(),
    alias: $('#editAlias').value.trim()
  };
  try {
    const r = await api('/api/roster/members/' + id + '/update', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    $('#editResult').textContent = r.nickname + ' 저장 완료';
    $('#editResult').className = 'successText';
    await loadAll();
    setTimeout(() => $('#editDlg').close(), 350);
  } catch (err) {
    $('#editResult').textContent = err.data && err.data.code === 'MEMBER_EXISTS'
      ? '이미 ' + err.data.existingMember.display_nickname + ' 참여자가 있어 변경할 수 없습니다.'
      : (err.message || '수정에 실패했습니다.');
    $('#editResult').className = 'errorText';
  }
}

async function handleAction(target) {
  const action = target.dataset.action;
  const id = target.dataset.id;
  if (action === 'proof') return proof(id);
  if (action === 'review') return review(id, target.dataset.decision);
  if (action === 'contacted') return contacted(id);
  if (action === 'admit') return admit(id);
  if (action === 'resolve-issue') return resolveIssue(id);
  if (action === 'link-submission') return openLink('submission', id);
  if (action === 'link-issue') return openLink('issue', id);
  if (action === 'choose-link-member') return chooseLinkMember(id);
  if (action === 'edit-member') return openEditMember(id);
}

document.addEventListener('click', (ev) => {
  const button = ev.target.closest('[data-action]');
  if (button) handleAction(button).catch((err) => alert(err.message || '처리 중 오류가 발생했습니다.'));
});

document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));
$('#status').addEventListener('change', loadAll);
$('#type').addEventListener('change', loadAll);
$('#refreshBtn').addEventListener('click', loadAll);
$('#importBtn').addEventListener('click', importCSV);
$('#manualForm').addEventListener('submit', manualAdd);
$('#memberSearch').addEventListener('input', () => renderRosterMembers(rosterMembers));
$('#linkSearch').addEventListener('input', renderLinkMembers);
$('#editMemberForm').addEventListener('submit', saveMemberEdit);
$('#closeDlg').addEventListener('click', () => $('#dlg').close());
$('#closeLinkDlg').addEventListener('click', () => $('#linkDlg').close());
$('#closeEditDlg').addEventListener('click', () => $('#editDlg').close());

loadAll().catch((err) => {
  console.error(err);
  alert('관리자 데이터를 불러오지 못했습니다: ' + err.message);
});
`;

function parseCSV(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim() !== "");
  if (!lines.length) return [];
  const split = (line) => {
    const out = [];
    let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (q && line[i + 1] === '"') { cur += '"'; i++; }
        else q = !q;
      } else if (c === "," && !q) { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur);
    return out;
  };
  const heads = split(lines[0]).map((x) => x.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const v = split(line), o = {};
    heads.forEach((h, i) => o[h] = v[i] || "");
    return o;
  });
}

async function findMemberByKey(env, key) {
  return env.MEMBERS_DB.prepare("SELECT * FROM existing_members WHERE nickname_key=? AND active=1 LIMIT 1").bind(key).first();
}

async function findAnyMemberByKey(env, key) {
  return env.MEMBERS_DB.prepare("SELECT * FROM existing_members WHERE nickname_key=? LIMIT 1").bind(key).first();
}

async function addAlias(env, memberId, nickname, kind, who = "system") {
  nickname = normalizeText(nickname);
  if (!nickname) return;
  const key = normalizeNickname(nickname);
  const now = new Date().toISOString();
  const standard = await env.MEMBERS_DB.prepare("SELECT id,display_nickname FROM existing_members WHERE nickname_key=? AND id<>? LIMIT 1").bind(key, memberId).first();
  if (standard) throw new Error("이 별칭은 다른 참여자의 표준 식별값과 같습니다: " + standard.display_nickname);

  const existing = await env.MEMBERS_DB.prepare("SELECT id,member_id FROM member_aliases WHERE nickname_key=? LIMIT 1").bind(key).first();
  if (existing) {
    if (existing.member_id === memberId) return;
    throw new Error("이 별칭은 다른 기존 참여자에게 이미 연결되어 있습니다.");
  }
  await env.MEMBERS_DB.prepare("INSERT INTO member_aliases(id,member_id,nickname,nickname_key,kind,created_at,created_by) VALUES(?,?,?,?,?,?,?)")
    .bind(crypto.randomUUID(), memberId, nickname, key, kind || "legacy", now, who).run();
}

async function createExistingMember(env, { name, district, legacyNickname = null, importedAt = null, who = "system" }) {
  name = normalizeText(name);
  district = normalizeText(district);
  legacyNickname = normalizeText(legacyNickname) || null;

  if (!name || !district) throw new Error("이름과 거주동이 필요합니다.");
  if (isPlaceholder(name) || isPlaceholder(district)) throw new Error("'모름/모름' 같은 임시값은 등록할 수 없습니다. 정확한 정보가 확인될 때까지 확인 필요 상태로 두세요.");
  if (name.includes("/") || district.includes("/")) throw new Error("이름과 거주동에는 / 문자를 사용할 수 없습니다.");
  if (!districtLike(district)) throw new Error("거주동은 '서현동', '판교동'처럼 법정동 이름만 입력해주세요.");

  const display = name + "/" + district;
  const key = normalizeNickname(display);
  const existing = await findAnyMemberByKey(env, key);
  if (existing) {
    const err = new Error("같은 표준 식별값의 기존 참여자가 이미 있습니다.");
    err.code = "MEMBER_EXISTS";
    err.existingMember = existing;
    throw err;
  }

  const now = importedAt || new Date().toISOString();
  const id = crypto.randomUUID();
  await env.MEMBERS_DB.prepare("INSERT INTO existing_members(id,nickname_key,display_nickname,name,district,legacy_nickname,active,imported_at) VALUES(?,?,?,?,?,?,1,?)")
    .bind(id, key, display, name, district, legacyNickname, now).run();

  if (legacyNickname && normalizeNickname(legacyNickname) !== key) {
    await addAlias(env, id, legacyNickname, "legacy", who);
  }

  return env.MEMBERS_DB.prepare("SELECT * FROM existing_members WHERE id=? LIMIT 1").bind(id).first();
}

async function listSubmissions(url, env) {
  const status = url.searchParams.get("status") || "all";
  const type = url.searchParams.get("type") || "all";
  const where = [], bind = [];
  if (status !== "all") { where.push("review_status=?"); bind.push(status); }
  if (type !== "all") { where.push("request_type=?"); bind.push(type); }
  const sql = `SELECT * FROM submissions ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY submitted_at DESC LIMIT 500`;
  const r = await env.DB.prepare(sql).bind(...bind).all();
  return json({ items: r.results || [] });
}

async function stats(request, env) {
  const [a, b, c, d, activeStat, issuePending, sourceStat, f, g, h] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) n FROM submissions WHERE review_status='pending'").first(),
    env.DB.prepare("SELECT COUNT(*) n FROM submissions WHERE review_status='verified'").first(),
    env.DB.prepare("SELECT COUNT(*) n FROM submissions WHERE review_status='rejected'").first(),
    env.DB.prepare("SELECT COUNT(*) n FROM submissions WHERE proof_key IS NOT NULL").first(),
    env.MEMBERS_DB.prepare("SELECT SUM(CASE WHEN active=1 THEN 1 ELSE 0 END) active, SUM(CASE WHEN active=1 AND reverified_at IS NOT NULL THEN 1 ELSE 0 END) done, SUM(CASE WHEN active=0 THEN 1 ELSE 0 END) inactive FROM existing_members").first(),
    env.MEMBERS_DB.prepare("SELECT COUNT(*) n FROM roster_import_issues WHERE status='pending'").first(),
    env.MEMBERS_DB.prepare("SELECT COUNT(*) total, SUM(CASE WHEN status='identified' THEN 1 ELSE 0 END) identified, SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) pending FROM roster_import_entries").first(),
    env.DB.prepare("SELECT COUNT(*) n FROM submissions WHERE request_type='new' AND review_status='verified' AND onboarding_stage='wait1'").first(),
    env.DB.prepare("SELECT COUNT(*) n FROM submissions WHERE request_type='new' AND review_status='verified' AND onboarding_stage='wait2'").first(),
    env.MEMBERS_DB.prepare("SELECT COUNT(*) n FROM admitted_members").first(),
  ]);

  const sourceTotal = sourceStat.total || ((activeStat.active || 0) + (issuePending.n || 0));
  const identified = sourceStat.total ? (sourceStat.identified || 0) : (activeStat.active || 0);
  const pending = sourceStat.total ? (sourceStat.pending || 0) : (issuePending.n || 0);

  return json({
    pending: a.n || 0,
    verified: b.n || 0,
    rejected: c.n || 0,
    proofsRemaining: d.n || 0,
    rosterSourceTotal: sourceTotal,
    rosterIdentified: identified,
    rosterPending: pending,
    rosterActive: activeStat.active || 0,
    rosterInactive: activeStat.inactive || 0,
    rosterReverified: activeStat.done || 0,
    wait1: f.n || 0,
    wait2: g.n || 0,
    newAdmitted: h.n || 0,
    reviewer: reviewer(request),
  });
}

async function reviewSubmission(request, env, id) {
  const body = await request.json();
  const decision = body.decision;
  if (!["verified", "rejected"].includes(decision)) return json({ message: "잘못된 판정입니다." }, 400);
  const row = await env.DB.prepare("SELECT * FROM submissions WHERE id=? LIMIT 1").bind(id).first();
  if (!row) return json({ message: "접수 내역이 없습니다." }, 404);
  if (row.review_status !== "pending") return json({ message: "이미 처리된 접수입니다." }, 409);
  const now = new Date().toISOString();
  const who = reviewer(request);
  const expires = plusYears(now, 2);

  if (decision === "verified") {
    if (row.proof_key) await env.PROOFS.delete(row.proof_key);
    const stage = row.request_type === "new" ? "wait1" : null;
    await env.DB.prepare(`UPDATE submissions SET review_status='verified',reviewed_at=?,reviewer=?,onboarding_stage=?,proof_key=NULL,proof_original_name=NULL,proof_mime=NULL,proof_size=NULL,proof_deleted_at=?,proof_delete_reason='verified_immediate',expires_at=? WHERE id=? AND review_status='pending'`)
      .bind(now, who, stage, now, expires, id).run();

    if (row.request_type === "reverify" && row.roster_member_id) {
      await env.MEMBERS_DB.prepare("UPDATE existing_members SET reverified_at=?, reverified_submission_id=? WHERE id=? AND active=1")
        .bind(now, id, row.roster_member_id).run();
    }
  } else {
    await env.DB.prepare("UPDATE submissions SET review_status='rejected',reviewed_at=?,reviewer=?,expires_at=? WHERE id=? AND review_status='pending'")
      .bind(now, who, expires, id).run();
  }
  return json({ ok: true });
}

async function linkSubmissionMember(request, env, id) {
  const body = await request.json();
  const memberId = normalizeText(body.member_id);
  const row = await env.DB.prepare("SELECT * FROM submissions WHERE id=? LIMIT 1").bind(id).first();
  if (!row) return json({ message: "접수 내역이 없습니다." }, 404);
  if (row.request_type !== "reverify") return json({ message: "기존 참여자 재확인 접수만 연결할 수 있습니다." }, 400);

  const member = await env.MEMBERS_DB.prepare("SELECT * FROM existing_members WHERE id=? AND active=1 LIMIT 1").bind(memberId).first();
  if (!member) return json({ message: "활성 기존 참여자를 찾을 수 없습니다." }, 404);

  if (row.roster_member_id && row.roster_member_id !== memberId) {
    await env.MEMBERS_DB.prepare("UPDATE existing_members SET reverified_at=NULL,reverified_submission_id=NULL WHERE id=? AND reverified_submission_id=?")
      .bind(row.roster_member_id, id).run();
  }

  await env.DB.prepare("UPDATE submissions SET roster_member_id=?,roster_match=1 WHERE id=?")
    .bind(memberId, id).run();

  try {
    if (row.chat_nickname && normalizeNickname(row.chat_nickname) !== normalizeNickname(member.display_nickname)) {
      await addAlias(env, memberId, row.chat_nickname, "submitted", reviewer(request));
    }
  } catch (_) {}

  let reverified = false;
  if (row.review_status === "verified") {
    const when = row.reviewed_at || new Date().toISOString();
    await env.MEMBERS_DB.prepare("UPDATE existing_members SET reverified_at=?,reverified_submission_id=? WHERE id=? AND active=1")
      .bind(when, id, memberId).run();
    reverified = true;
  }

  return json({ ok: true, member: member.display_nickname, reverified });
}

async function proof(env, id) {
  const row = await env.DB.prepare("SELECT proof_key,proof_mime FROM submissions WHERE id=? LIMIT 1").bind(id).first();
  if (!row?.proof_key) return json({ message: "원본이 이미 삭제되었습니다." }, 404);
  const obj = await env.PROOFS.get(row.proof_key);
  if (!obj) return json({ message: "파일이 없습니다." }, 404);
  return new Response(obj.body, { headers: { "content-type": row.proof_mime || "application/octet-stream", "cache-control": "no-store", "content-disposition": "inline" } });
}

async function upsertSourceEntry(env, originalNickname, status, memberId, now) {
  const sourceKey = normalizeNickname(originalNickname);
  await env.MEMBERS_DB.prepare(`
    INSERT INTO roster_import_entries(id,source_key,original_nickname,status,member_id,imported_at)
    VALUES(?,?,?,?,?,?)
    ON CONFLICT(source_key) DO UPDATE SET
      original_nickname=excluded.original_nickname,
      status=excluded.status,
      member_id=excluded.member_id,
      imported_at=excluded.imported_at
  `).bind(crypto.randomUUID(), sourceKey, originalNickname, status, memberId || null, now).run();
}

async function importRoster(request, env) {
  const rows = parseCSV(await request.text());
  let total = 0, identified = 0, pending = 0;
  const now = new Date().toISOString();

  for (const r of rows) {
    const nickname = normalizeText(r.nickname || r.chat_nickname || "");
    if (!nickname) continue;
    total++;

    const parsed = parseNickname(nickname);
    if (parsed) {
      const key = normalizeNickname(parsed.display);
      let member = await findMemberByKey(env, key);
      if (!member) {
        const inactive = await findAnyMemberByKey(env, key);
        if (inactive) {
          await env.MEMBERS_DB.prepare("UPDATE existing_members SET active=1,imported_at=? WHERE id=?").bind(now, inactive.id).run();
          member = { ...inactive, active: 1 };
        } else {
          member = await createExistingMember(env, { name: parsed.name, district: parsed.district, importedAt: now, who: reviewer(request) });
        }
      }
      await upsertSourceEntry(env, nickname, "identified", member.id, now);
      identified++;
      continue;
    }

    const issueKey = normalizeNickname(nickname);
    let issue = await env.MEMBERS_DB.prepare("SELECT * FROM roster_import_issues WHERE issue_key=? LIMIT 1").bind(issueKey).first();

    if (!issue) {
      const issueId = crypto.randomUUID();
      await env.MEMBERS_DB.prepare("INSERT INTO roster_import_issues(id,issue_key,original_nickname,status,created_at) VALUES(?,?,?,'pending',?)")
        .bind(issueId, issueKey, nickname, now).run();
      issue = { id: issueId, status: "pending", resolved_member_id: null };
    } else {
      await env.MEMBERS_DB.prepare("UPDATE roster_import_issues SET original_nickname=? WHERE id=?").bind(nickname, issue.id).run();
    }

    if (issue.status === "resolved" && issue.resolved_member_id) {
      const member = await env.MEMBERS_DB.prepare("SELECT id FROM existing_members WHERE id=? AND active=1 LIMIT 1").bind(issue.resolved_member_id).first();
      if (member) {
        await upsertSourceEntry(env, nickname, "identified", member.id, now);
        identified++;
        continue;
      }
    }

    await upsertSourceEntry(env, nickname, "pending", null, now);
    pending++;
  }

  return json({ ok: true, total, identified, pending });
}

async function rosterIssues(env) {
  const r = await env.MEMBERS_DB.prepare("SELECT id,original_nickname,created_at FROM roster_import_issues WHERE status='pending' ORDER BY created_at ASC, original_nickname ASC").all();
  return json({ items: r.results || [] });
}

async function resolveRosterIssue(request, env, id) {
  const issue = await env.MEMBERS_DB.prepare("SELECT * FROM roster_import_issues WHERE id=? LIMIT 1").bind(id).first();
  if (!issue) return json({ message: "확인 필요 항목이 없습니다." }, 404);
  if (issue.status !== "pending") return json({ message: "이미 처리된 항목입니다." }, 409);
  const body = await request.json();

  try {
    const member = await createExistingMember(env, {
      name: body.name,
      district: body.district,
      legacyNickname: issue.original_nickname,
      who: reviewer(request),
    });
    const now = new Date().toISOString();
    const who = reviewer(request);
    await env.MEMBERS_DB.prepare("UPDATE roster_import_issues SET status='resolved',resolved_at=?,resolved_by=?,resolved_member_id=? WHERE id=? AND status='pending'")
      .bind(now, who, member.id, id).run();
    await upsertSourceEntry(env, issue.original_nickname, "identified", member.id, now);
    return json({ ok: true, nickname: member.display_nickname });
  } catch (err) {
    if (err.code === "MEMBER_EXISTS") return json({ message: err.message, code: err.code, existingMember: { id: err.existingMember.id, display_nickname: err.existingMember.display_nickname } }, 409);
    return json({ message: err.message || "등록할 수 없습니다." }, 400);
  }
}

async function linkRosterIssue(request, env, id) {
  const issue = await env.MEMBERS_DB.prepare("SELECT * FROM roster_import_issues WHERE id=? LIMIT 1").bind(id).first();
  if (!issue) return json({ message: "확인 필요 항목이 없습니다." }, 404);
  if (issue.status !== "pending") return json({ message: "이미 처리된 항목입니다." }, 409);

  const body = await request.json();
  const member = await env.MEMBERS_DB.prepare("SELECT * FROM existing_members WHERE id=? AND active=1 LIMIT 1").bind(body.member_id).first();
  if (!member) return json({ message: "활성 기존 참여자를 찾을 수 없습니다." }, 404);

  const now = new Date().toISOString();
  const who = reviewer(request);
  await env.MEMBERS_DB.prepare("UPDATE roster_import_issues SET status='resolved',resolved_at=?,resolved_by=?,resolved_member_id=? WHERE id=? AND status='pending'")
    .bind(now, who, member.id, id).run();

  try { await addAlias(env, member.id, issue.original_nickname, "source", who); } catch (_) {}
  await upsertSourceEntry(env, issue.original_nickname, "identified", member.id, now);
  return json({ ok: true, nickname: member.display_nickname });
}

async function manualRosterAdd(request, env) {
  const body = await request.json();
  try {
    const member = await createExistingMember(env, {
      name: body.name,
      district: body.district,
      legacyNickname: body.legacy_nickname,
      who: reviewer(request),
    });
    return json({ ok: true, nickname: member.display_nickname });
  } catch (err) {
    if (err.code === "MEMBER_EXISTS") return json({ message: err.message, code: err.code, existingMember: { id: err.existingMember.id, display_nickname: err.existingMember.display_nickname } }, 409);
    return json({ message: err.message || "등록할 수 없습니다." }, 400);
  }
}

async function rosterMembers(env) {
  const r = await env.MEMBERS_DB.prepare(`
    SELECT e.*,
      COALESCE((SELECT GROUP_CONCAT(a.nickname, ' · ') FROM member_aliases a WHERE a.member_id=e.id), '') aliases
    FROM existing_members e
    WHERE e.active=1
    ORDER BY e.name ASC, e.district ASC
  `).all();
  return json({ items: r.results || [] });
}

async function updateRosterMember(request, env, id) {
  const member = await env.MEMBERS_DB.prepare("SELECT * FROM existing_members WHERE id=? AND active=1 LIMIT 1").bind(id).first();
  if (!member) return json({ message: "기존 참여자를 찾을 수 없습니다." }, 404);
  const body = await request.json();

  const name = normalizeText(body.name);
  const district = normalizeText(body.district);
  const alias = normalizeText(body.alias);

  if (!name || !district || isPlaceholder(name) || isPlaceholder(district)) return json({ message: "정확한 이름과 거주동을 입력해주세요." }, 400);
  if (!districtLike(district)) return json({ message: "거주동은 '서현동', '판교동'처럼 법정동 이름만 입력해주세요." }, 400);

  const display = name + "/" + district;
  const key = normalizeNickname(display);
  const conflict = await env.MEMBERS_DB.prepare("SELECT id,display_nickname FROM existing_members WHERE nickname_key=? AND id<>? LIMIT 1").bind(key, id).first();
  if (conflict) return json({ message: "같은 표준 식별값의 기존 참여자가 이미 있습니다.", code: "MEMBER_EXISTS", existingMember: conflict }, 409);

  const oldDisplay = member.display_nickname;
  await env.MEMBERS_DB.prepare("UPDATE existing_members SET nickname_key=?,display_nickname=?,name=?,district=? WHERE id=?")
    .bind(key, display, name, district, id).run();

  const who = reviewer(request);
  try {
    if (oldDisplay && normalizeNickname(oldDisplay) !== key) await addAlias(env, id, oldDisplay, "historical", who);
    if (alias && normalizeNickname(alias) !== key) await addAlias(env, id, alias, "current", who);
  } catch (err) {
    return json({ message: err.message || "별칭을 저장할 수 없습니다." }, 409);
  }

  return json({ ok: true, nickname: display });
}

async function onboardingList(url, env) {
  const stage = url.searchParams.get("stage");
  if (!["wait1", "wait2"].includes(stage)) return json({ message: "잘못된 단계입니다." }, 400);
  const r = await env.DB.prepare(`SELECT id,name,phone,district,member_type,reviewed_at,contacted_at,onboarding_stage FROM submissions WHERE request_type='new' AND review_status='verified' AND onboarding_stage=? ORDER BY COALESCE(contacted_at,reviewed_at) ASC`).bind(stage).all();
  return json({ items: r.results || [] });
}

async function markContacted(request, env, id) {
  const row = await env.DB.prepare("SELECT id,onboarding_stage,review_status,request_type FROM submissions WHERE id=? LIMIT 1").bind(id).first();
  if (!row) return json({ message: "대상이 없습니다." }, 404);
  if (row.request_type !== "new" || row.review_status !== "verified" || row.onboarding_stage !== "wait1") return json({ message: "입장 대기-1 대상만 처리할 수 있습니다." }, 409);
  const now = new Date().toISOString(), who = reviewer(request);
  await env.DB.prepare("UPDATE submissions SET onboarding_stage='wait2',contacted_at=?,contacted_by=? WHERE id=? AND onboarding_stage='wait1'").bind(now, who, id).run();
  return json({ ok: true });
}

async function admit(request, env, id) {
  const row = await env.DB.prepare("SELECT * FROM submissions WHERE id=? LIMIT 1").bind(id).first();
  if (!row) return json({ message: "대상이 없습니다." }, 404);
  if (row.request_type !== "new" || row.review_status !== "verified" || row.onboarding_stage !== "wait2") return json({ message: "입장 대기-2 대상만 입장 완료 처리할 수 있습니다." }, 409);
  const now = new Date().toISOString(), who = reviewer(request);
  await env.MEMBERS_DB.prepare(`INSERT INTO admitted_members(id,submission_id,display_nickname,name,district,admitted_at,admitted_by) VALUES(?,?,?,?,?,?,?) ON CONFLICT(submission_id) DO NOTHING`)
    .bind(crypto.randomUUID(), id, row.chat_nickname, row.name, row.district, now, who).run();
  await env.DB.prepare("UPDATE submissions SET onboarding_stage='admitted',admitted_at=?,admitted_by=?,phone=NULL WHERE id=? AND onboarding_stage='wait2'")
    .bind(now, who, id).run();
  return json({ ok: true });
}

function csvCell(v) {
  const s = String(v ?? "");
  return /[\",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

async function wait1CSV(env) {
  const r = await env.DB.prepare("SELECT name,phone FROM submissions WHERE request_type='new' AND review_status='verified' AND onboarding_stage='wait1' ORDER BY reviewed_at ASC").all();
  const lines = ["이름,전화번호", ...(r.results || []).map((x) => csvCell(x.name) + "," + csvCell(x.phone || ""))];
  const body = "\uFEFF" + lines.join("\r\n");
  return new Response(body, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="bunmink-wait1.csv"', "cache-control": "no-store" } });
}

async function members(env) {
  const [existing, newcomers] = await Promise.all([
    env.MEMBERS_DB.prepare(`
      SELECT 'existing' source,e.name,e.district,e.display_nickname nickname,e.legacy_nickname,e.reverified_at completed_at,
        COALESCE((SELECT GROUP_CONCAT(a.nickname, ' · ') FROM member_aliases a WHERE a.member_id=e.id), '') aliases
      FROM existing_members e
      WHERE e.active=1 AND e.reverified_at IS NOT NULL
    `).all(),
    env.MEMBERS_DB.prepare("SELECT 'new' source,name,district,display_nickname nickname,NULL legacy_nickname,admitted_at completed_at,'' aliases FROM admitted_members").all(),
  ]);
  const items = [...(existing.results || []), ...(newcomers.results || [])].sort((a, b) => String(b.completed_at).localeCompare(String(a.completed_at)));
  return json({ items });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;

    try {
      if (request.method === "GET" && p === "/") return new Response(page(), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
      if (request.method === "GET" && p === "/admin.js") return new Response(ADMIN_JS, { headers: { "content-type": "application/javascript; charset=utf-8", "cache-control": "no-store" } });
      if (request.method === "GET" && p === "/api/stats") return stats(request, env);
      if (request.method === "GET" && p === "/api/submissions") return listSubmissions(url, env);
      if (request.method === "GET" && p === "/api/onboarding") return onboardingList(url, env);
      if (request.method === "GET" && p === "/api/onboarding/wait1.csv") return wait1CSV(env);
      if (request.method === "GET" && p === "/api/members") return members(env);
      if (request.method === "GET" && p === "/api/roster/issues") return rosterIssues(env);
      if (request.method === "GET" && p === "/api/roster/members") return rosterMembers(env);

      let m = p.match(/^\/api\/submissions\/([^/]+)\/review$/);
      if (request.method === "POST" && m) return reviewSubmission(request, env, m[1]);

      m = p.match(/^\/api\/submissions\/([^/]+)\/proof$/);
      if (request.method === "GET" && m) return proof(env, m[1]);

      m = p.match(/^\/api\/submissions\/([^/]+)\/link-member$/);
      if (request.method === "POST" && m) return linkSubmissionMember(request, env, m[1]);

      m = p.match(/^\/api\/onboarding\/([^/]+)\/contacted$/);
      if (request.method === "POST" && m) return markContacted(request, env, m[1]);

      m = p.match(/^\/api\/onboarding\/([^/]+)\/admit$/);
      if (request.method === "POST" && m) return admit(request, env, m[1]);

      m = p.match(/^\/api\/roster\/issues\/([^/]+)\/resolve$/);
      if (request.method === "POST" && m) return resolveRosterIssue(request, env, m[1]);

      m = p.match(/^\/api\/roster\/issues\/([^/]+)\/link$/);
      if (request.method === "POST" && m) return linkRosterIssue(request, env, m[1]);

      m = p.match(/^\/api\/roster\/members\/([^/]+)\/update$/);
      if (request.method === "POST" && m) return updateRosterMember(request, env, m[1]);

      if (request.method === "POST" && p === "/api/roster/import") return importRoster(request, env);
      if (request.method === "POST" && p === "/api/roster/manual") return manualRosterAdd(request, env);

      return json({ message: "Not found" }, 404);
    } catch (err) {
      console.error(err);
      return json({ message: err.message || "처리 중 오류가 발생했습니다." }, 500);
    }
  },
};
