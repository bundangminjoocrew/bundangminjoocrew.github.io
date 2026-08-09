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

const parseNickname = (raw) => {
  const v = String(raw || "").normalize("NFKC").trim();
  const i = v.indexOf("/");
  if (i <= 0 || i === v.length - 1 || v.indexOf("/", i + 1) !== -1) return null;
  const name = v.slice(0, i).trim();
  const district = v.slice(i + 1).trim();
  if (!name || !district) return null;
  return { display: name + "/" + district, name, district };
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
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:Inter,Pretendard,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{max-width:1240px;margin:0 auto;padding:36px 20px 80px}.eyebrow{font-size:13px;font-weight:800;color:var(--blue);letter-spacing:.04em}.top{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;margin:8px 0 20px}.top h1{font-size:30px;margin:0}.muted{color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}.metric,.card{background:var(--card);border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow)}.metric{padding:18px}.metric b{display:block;font-size:28px;margin-top:6px}.card{margin-top:16px;padding:18px}.progress{height:10px;background:#edf0f4;border-radius:999px;overflow:hidden}.progress>i{display:block;height:100%;background:var(--blue)}table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:12px 8px;border-bottom:1px solid var(--line);vertical-align:middle}th{color:var(--muted);font-size:12px;white-space:nowrap}.pill{display:inline-block;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:750;background:#eef0f3}.pill.pending{background:#fff4dc;color:#805b00}.pill.verified{background:#e8f7ef;color:var(--ok)}.pill.rejected{background:#ffefed;color:var(--bad)}.pill.wait1,.pill.wait2{background:#eef3ff;color:#2456c7}.pill.admitted{background:#e8f7ef;color:var(--ok)}button,.btn{border:0;border-radius:10px;padding:9px 12px;font-weight:800;cursor:pointer;text-decoration:none;display:inline-block;font:inherit}.ok{background:#e8f7ef;color:var(--ok)}.bad{background:#ffefed;color:var(--bad)}.view{background:var(--blue2);color:var(--blue)}.secondary{background:#f1f2f4;color:#333}.toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center}.danger-note{font-size:12px;color:var(--muted)}dialog{border:0;border-radius:18px;max-width:min(920px,94vw);width:100%;padding:0;box-shadow:0 30px 90px rgba(0,0,0,.25)}dialog::backdrop{background:rgba(0,0,0,.45)}.dlg{padding:18px}.proof{width:100%;max-height:70vh;object-fit:contain;background:#111;border-radius:12px}.import{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.tabs{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0 0}.tabs button{background:#e9ebef;color:#4d535c}.tabs button.active{background:var(--ink);color:#fff}.sectionHead{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:12px}.sectionHead h2{font-size:18px;margin:0}.hidden{display:none!important}.flow{font-size:13px;color:var(--muted);margin-top:6px}.countBadge{font-size:12px;background:#eef0f3;border-radius:999px;padding:4px 8px;margin-left:6px}.subgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}.box{border:1px solid var(--line);border-radius:14px;padding:16px;background:#fbfcfd}.box h3{margin:0 0 6px;font-size:16px}.formrow{display:grid;grid-template-columns:1fr 1fr;gap:10px}.field{display:flex;flex-direction:column;gap:6px;margin-top:10px}.field label{font-size:12px;font-weight:800;color:#555}.field input{border:1px solid var(--line);border-radius:10px;padding:10px 11px;font:inherit;background:#fff}.issue{border-top:1px solid var(--line);padding:14px 0}.issue:first-child{border-top:0}.issueRaw{font-weight:800;word-break:break-all}.issueForm{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;margin-top:8px}.summary{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.summary span{background:#f1f3f6;border-radius:999px;padding:7px 10px;font-size:13px;font-weight:750}.summary .warn{background:#fff4dc;color:#805b00}.successText{color:var(--ok);font-weight:800}.errorText{color:var(--bad);font-weight:800}
@media(max-width:900px){.grid{grid-template-columns:1fr 1fr}.top{align-items:flex-start;flex-direction:column}.card{overflow:auto}.subgrid{grid-template-columns:1fr}.issueForm,.formrow{grid-template-columns:1fr}}
`;

function page() {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>분민크 인증 관리</title><style>${CSS}</style><script defer src="/admin.js"></script></head><body><main>
  <div class="eyebrow">분민크 · MEMBER VERIFICATION</div>
  <div class="top"><div><h1>당원 인증 및 입장 관리</h1><div class="muted">O 확인 즉시 인증 원본 삭제 · 신규 참여자는 입장 대기-1 → 대기-2 → 입장 명부 순으로 관리합니다.</div></div><div id="who" class="muted"></div></div>
  <section class="grid" id="metrics"></section>
  <section class="card"><div style="display:flex;justify-content:space-between;gap:16px;align-items:center;flex-wrap:wrap"><div><b>기존 참여자 재확인</b><div class="muted" id="progressText"></div></div><b id="progressPct">0%</b></div><div class="progress" style="margin-top:12px"><i id="progressBar" style="width:0%"></i></div></section>
  <div class="tabs">
    <button data-tab="review" class="active">인증 검토</button>
    <button data-tab="wait1">입장 대기-1 <span class="countBadge" id="wait1Count">0</span></button>
    <button data-tab="wait2">입장 대기-2 <span class="countBadge" id="wait2Count">0</span></button>
    <button data-tab="members">입장 명부 <span class="countBadge" id="memberCount">0</span></button>
  </div>

  <section class="card tabPanel" id="tab-review">
    <div class="sectionHead"><div><h2>인증 검토</h2><div class="flow">기존 참여자 O → 재확인 완료 / 신규 참여자 O → 입장 대기-1</div></div></div>
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
    <div class="sectionHead"><div><h2>기존 참여자 명부 관리</h2><div class="flow">표준 재확인 키는 <code>이름/거주동</code>입니다. 기존 오픈채팅 닉네임은 별도로 보존할 수 있습니다.</div></div><span class="countBadge" id="issueCount">확인 필요 0</span></div>
    <div class="box">
      <h3>CSV 가져오기</h3>
      <p class="muted">CSV 열은 <code>nickname</code> 하나만 있어도 됩니다. 형식이 맞는 행은 즉시 반영하고, 형식이 다른 행은 삭제하지 않고 ‘확인 필요’ 목록에 보관합니다. 같은 CSV를 다시 가져와도 기존 표준 명부는 갱신됩니다.</p>
      <div class="import"><input type="file" id="csv" accept=".csv,text/csv"><button class="view" id="importBtn">CSV 가져오기</button><span id="importResult" class="muted"></span></div>
      <div id="importSummary" class="summary"></div>
    </div>

    <div class="subgrid">
      <div class="box">
        <h3>확인 필요 명단</h3>
        <p class="muted">형식 오류가 난 기존 닉네임을 확인한 뒤 이름과 거주동을 입력해 등록하세요. 원래 닉네임은 자동으로 보존됩니다.</p>
        <div id="issueList"></div>
      </div>
      <div class="box">
        <h3>기존 참여자 개별 등록</h3>
        <p class="muted">CSV와 무관하게 한 명씩 직접 등록할 수 있습니다. ‘현재/기존 닉네임’은 선택사항입니다.</p>
        <form id="manualForm">
          <div class="formrow">
            <div class="field"><label for="manualName">이름</label><input id="manualName" autocomplete="off" required></div>
            <div class="field"><label for="manualDistrict">거주동</label><input id="manualDistrict" autocomplete="off" required></div>
          </div>
          <div class="field"><label for="manualLegacy">현재/기존 오픈채팅 닉네임 (선택)</label><input id="manualLegacy" autocomplete="off" placeholder="예: 박문석/서현동/부위원장"></div>
          <div class="import" style="margin-top:12px"><button class="view" type="submit">기존 참여자로 등록</button><span id="manualResult" class="muted"></span></div>
        </form>
      </div>
    </div>
  </section>

  <dialog id="dlg"><div class="dlg"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><b>인증자료 확인</b><button id="closeDlg">닫기</button></div><div id="proofBox"></div><p class="danger-note">O 처리 시 원본은 즉시 영구 삭제됩니다.</p></div></dialog>
  </main></body></html>`;
}

const ADMIN_JS = String.raw`
const $ = (s) => document.querySelector(s);
let reviewRows = [];

async function api(path, opt) {
  const r = await fetch(path, opt);
  const ct = r.headers.get('content-type') || '';
  const j = ct.includes('application/json') ? await r.json() : { message: await r.text() };
  if (!r.ok) throw new Error(j.message || '요청 실패');
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
  const [s, l, w1, w2, m, issues] = await Promise.all([
    api('/api/stats'),
    api('/api/submissions?' + q),
    api('/api/onboarding?stage=wait1'),
    api('/api/onboarding?stage=wait2'),
    api('/api/members'),
    api('/api/roster/issues')
  ]);
  reviewRows = l.items;
  $('#who').textContent = s.reviewer;
  $('#metrics').innerHTML = [
    ['미확인', s.pending], ['O 확인', s.verified], ['X 확인', s.rejected], ['대기-1', s.wait1], ['대기-2', s.wait2]
  ].map((x) => '<div class="metric"><span class="muted">' + x[0] + '</span><b>' + x[1] + '</b></div>').join('');
  const pct = s.rosterTotal ? Math.round(s.rosterReverified * 1000 / s.rosterTotal) / 10 : 0;
  $('#progressText').textContent = s.rosterReverified + ' / ' + s.rosterTotal + '명 완료';
  $('#progressPct').textContent = pct + '%';
  $('#progressBar').style.width = pct + '%';
  $('#wait1Count').textContent = w1.items.length;
  $('#wait2Count').textContent = w2.items.length;
  $('#memberCount').textContent = m.items.length;
  $('#issueCount').textContent = '확인 필요 ' + issues.items.length;
  renderReview();
  renderWait1(w1.items);
  renderWait2(w2.items);
  renderMembers(m.items);
  renderIssues(issues.items);
}

function renderReview() {
  if (!reviewRows.length) {
    $('#reviewTable').innerHTML = '<p class="muted">표시할 접수 내역이 없습니다.</p>';
    return;
  }
  $('#reviewTable').innerHTML = '<table><thead><tr><th>접수</th><th>유형</th><th>닉네임</th><th>이름</th><th>거주동</th><th>명부</th><th>상태</th><th>자료</th><th>판정</th></tr></thead><tbody>' +
    reviewRows.map((r) => {
      let proof = r.proof_key ? '<button class="view" data-action="proof" data-id="' + e(r.id) + '">보기</button>' : '삭제됨';
      let action = '-';
      if (r.review_status === 'pending') {
        action = '<button class="ok" data-action="review" data-decision="verified" data-id="' + e(r.id) + '">O</button> ' +
          '<button class="bad" data-action="review" data-decision="rejected" data-id="' + e(r.id) + '">X</button>';
      } else if (r.request_type === 'new' && r.review_status === 'verified') {
        action = '<span class="pill ' + e(r.onboarding_stage || 'wait1') + '">' + stageName(r.onboarding_stage || 'wait1') + '</span>';
      }
      return '<tr><td>' + fmt(r.submitted_at) + '</td><td>' + (r.request_type === 'reverify' ? '재확인' : '신규') + '</td><td>' + e(r.chat_nickname || '-') + '</td><td>' + e(r.name) + '</td><td>' + e(r.district) + '</td><td>' + (r.request_type === 'reverify' ? (r.roster_match ? '일치' : '불일치') : '-') + '</td><td><span class="pill ' + e(r.review_status) + '">' + ({ pending: '미확인', verified: 'O', rejected: 'X' })[r.review_status] + '</span></td><td>' + proof + '</td><td>' + action + '</td></tr>';
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
  $('#membersTable').innerHTML = '<table><thead><tr><th>구분</th><th>닉네임</th><th>기존 닉네임</th><th>이름</th><th>거주동</th><th>확인/입장일</th></tr></thead><tbody>' +
    rows.map((r) => '<tr><td>' + (r.source === 'existing' ? '기존 참여자' : '신규 입장') + '</td><td>' + e(r.nickname || '-') + '</td><td>' + e(r.legacy_nickname || '-') + '</td><td>' + e(r.name || '-') + '</td><td>' + e(r.district || '-') + '</td><td>' + fmt(r.completed_at) + '</td></tr>').join('') + '</tbody></table>';
}

function suggestion(raw) {
  const parts = String(raw || '').split('/').map((x) => x.trim());
  if (parts.length >= 2 && parts[0] && parts[1]) return { name: parts[0], district: parts[1] };
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
      '<button class="view" data-action="resolve-issue" data-id="' + e(r.id) + '">확인 후 등록</button></div></div>';
  }).join('');
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
    $('#importSummary').innerHTML = '<span>총 ' + r.total + '명</span><span>정상 반영 ' + r.imported + '명</span><span class="warn">확인 필요 ' + r.needsReview + '명</span>';
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
  if (!name || !district) { alert('이름과 거주동을 모두 입력하세요.'); return; }
  try {
    const r = await api('/api/roster/issues/' + id + '/resolve', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, district }) });
    alert(r.nickname + '으로 등록했습니다. 기존 닉네임도 보존했습니다.');
    await loadAll();
  } catch (err) { alert(err.message || '등록에 실패했습니다.'); }
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
    out.textContent = err.message || '등록에 실패했습니다.'; out.className = 'errorText';
  }
}

function switchTab(name) {
  document.querySelectorAll('.tabPanel').forEach((x) => x.classList.add('hidden'));
  document.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('active', x.dataset.tab === name));
  $('#tab-' + name).classList.remove('hidden');
}

async function handleAction(target) {
  const action = target.dataset.action;
  const id = target.dataset.id;
  if (action === 'proof') return proof(id);
  if (action === 'review') return review(id, target.dataset.decision);
  if (action === 'contacted') return contacted(id);
  if (action === 'admit') return admit(id);
  if (action === 'resolve-issue') return resolveIssue(id);
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
$('#closeDlg').addEventListener('click', () => $('#dlg').close());

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

async function upsertExistingMember(env, { name, district, legacyNickname = null, importedAt = null }) {
  name = String(name || "").normalize("NFKC").trim();
  district = String(district || "").normalize("NFKC").trim();
  legacyNickname = String(legacyNickname || "").normalize("NFKC").trim() || null;
  if (!name || !district) throw new Error("이름과 거주동이 필요합니다.");
  if (name.includes("/") || district.includes("/")) throw new Error("이름과 거주동에는 / 문자를 사용할 수 없습니다.");

  const display = name + "/" + district;
  const key = normalizeNickname(display);
  const now = importedAt || new Date().toISOString();
  const id = crypto.randomUUID();

  await env.MEMBERS_DB.prepare(`
    INSERT INTO existing_members(id,nickname_key,display_nickname,name,district,legacy_nickname,active,imported_at)
    VALUES(?,?,?,?,?,?,1,?)
    ON CONFLICT(nickname_key) DO UPDATE SET
      display_nickname=excluded.display_nickname,
      name=excluded.name,
      district=excluded.district,
      legacy_nickname=COALESCE(excluded.legacy_nickname,existing_members.legacy_nickname),
      active=1,
      imported_at=excluded.imported_at
  `).bind(id, key, display, name, district, legacyNickname, now).run();

  const row = await env.MEMBERS_DB.prepare("SELECT id,display_nickname FROM existing_members WHERE nickname_key=? LIMIT 1").bind(key).first();
  return row;
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
  const [a, b, c, d, e, f, g, h] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) n FROM submissions WHERE review_status='pending'").first(),
    env.DB.prepare("SELECT COUNT(*) n FROM submissions WHERE review_status='verified'").first(),
    env.DB.prepare("SELECT COUNT(*) n FROM submissions WHERE review_status='rejected'").first(),
    env.DB.prepare("SELECT COUNT(*) n FROM submissions WHERE proof_key IS NOT NULL").first(),
    env.MEMBERS_DB.prepare("SELECT COUNT(*) total, SUM(CASE WHEN reverified_at IS NOT NULL THEN 1 ELSE 0 END) done FROM existing_members WHERE active=1").first(),
    env.DB.prepare("SELECT COUNT(*) n FROM submissions WHERE request_type='new' AND review_status='verified' AND onboarding_stage='wait1'").first(),
    env.DB.prepare("SELECT COUNT(*) n FROM submissions WHERE request_type='new' AND review_status='verified' AND onboarding_stage='wait2'").first(),
    env.MEMBERS_DB.prepare("SELECT COUNT(*) n FROM admitted_members").first(),
  ]);
  return json({
    pending: a.n || 0,
    verified: b.n || 0,
    rejected: c.n || 0,
    proofsRemaining: d.n || 0,
    rosterTotal: e.total || 0,
    rosterReverified: e.done || 0,
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
    await env.DB.prepare(`UPDATE submissions SET review_status='verified',reviewed_at=?,reviewer=?,onboarding_stage=?,proof_key=NULL,proof_original_name=NULL,proof_mime=NULL,proof_size=NULL,proof_deleted_at=?,proof_delete_reason='verified_immediate',expires_at=? WHERE id=? AND review_status='pending'`).bind(now, who, stage, now, expires, id).run();
    if (row.request_type === "reverify" && row.roster_member_id) {
      await env.MEMBERS_DB.prepare("UPDATE existing_members SET reverified_at=?, reverified_submission_id=? WHERE id=? AND active=1").bind(now, id, row.roster_member_id).run();
    }
  } else {
    await env.DB.prepare("UPDATE submissions SET review_status='rejected',reviewed_at=?,reviewer=?,expires_at=? WHERE id=? AND review_status='pending'").bind(now, who, expires, id).run();
  }
  return json({ ok: true });
}

async function proof(env, id) {
  const row = await env.DB.prepare("SELECT proof_key,proof_mime FROM submissions WHERE id=? LIMIT 1").bind(id).first();
  if (!row?.proof_key) return json({ message: "원본이 이미 삭제되었습니다." }, 404);
  const obj = await env.PROOFS.get(row.proof_key);
  if (!obj) return json({ message: "파일이 없습니다." }, 404);
  return new Response(obj.body, { headers: { "content-type": row.proof_mime || "application/octet-stream", "cache-control": "no-store", "content-disposition": "inline" } });
}

async function importRoster(request, env) {
  const rows = parseCSV(await request.text());
  let total = 0, imported = 0, needsReview = 0;
  const now = new Date().toISOString();

  for (const r of rows) {
    const nickname = String(r.nickname || r.chat_nickname || "").normalize("NFKC").trim();
    if (!nickname) continue;
    total++;
    const parsed = parseNickname(nickname);
    if (parsed) {
      await upsertExistingMember(env, { name: parsed.name, district: parsed.district, importedAt: now });
      imported++;
      continue;
    }

    const issueKey = normalizeNickname(nickname);
    if (!issueKey) continue;
    await env.MEMBERS_DB.prepare(`
      INSERT INTO roster_import_issues(id,issue_key,original_nickname,status,created_at)
      VALUES(?,?,?,'pending',?)
      ON CONFLICT(issue_key) DO UPDATE SET
        original_nickname=excluded.original_nickname
    `).bind(crypto.randomUUID(), issueKey, nickname, now).run();
    needsReview++;
  }

  const pending = await env.MEMBERS_DB.prepare("SELECT COUNT(*) n FROM roster_import_issues WHERE status='pending'").first();
  return json({ ok: true, total, imported, needsReview, pendingIssues: pending.n || 0 });
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
    const member = await upsertExistingMember(env, {
      name: body.name,
      district: body.district,
      legacyNickname: issue.original_nickname,
    });
    const now = new Date().toISOString();
    const who = reviewer(request);
    await env.MEMBERS_DB.prepare("UPDATE roster_import_issues SET status='resolved',resolved_at=?,resolved_by=?,resolved_member_id=? WHERE id=? AND status='pending'").bind(now, who, member.id, id).run();
    return json({ ok: true, nickname: member.display_nickname });
  } catch (err) {
    return json({ message: err.message || "등록할 수 없습니다." }, 400);
  }
}

async function manualRosterAdd(request, env) {
  const body = await request.json();
  try {
    const member = await upsertExistingMember(env, {
      name: body.name,
      district: body.district,
      legacyNickname: body.legacy_nickname,
    });
    return json({ ok: true, nickname: member.display_nickname });
  } catch (err) {
    return json({ message: err.message || "등록할 수 없습니다." }, 400);
  }
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
  await env.MEMBERS_DB.prepare(`INSERT INTO admitted_members(id,submission_id,display_nickname,name,district,admitted_at,admitted_by) VALUES(?,?,?,?,?,?,?) ON CONFLICT(submission_id) DO NOTHING`).bind(crypto.randomUUID(), id, row.chat_nickname, row.name, row.district, now, who).run();
  await env.DB.prepare("UPDATE submissions SET onboarding_stage='admitted',admitted_at=?,admitted_by=?,phone=NULL WHERE id=? AND onboarding_stage='wait2'").bind(now, who, id).run();
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
    env.MEMBERS_DB.prepare("SELECT 'existing' source,name,district,display_nickname nickname,legacy_nickname,reverified_at completed_at FROM existing_members WHERE active=1 AND reverified_at IS NOT NULL").all(),
    env.MEMBERS_DB.prepare("SELECT 'new' source,name,district,display_nickname nickname,NULL legacy_nickname,admitted_at completed_at FROM admitted_members").all(),
  ]);
  const items = [...(existing.results || []), ...(newcomers.results || [])].sort((a, b) => String(b.completed_at).localeCompare(String(a.completed_at)));
  return json({ items });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;
    if (request.method === "GET" && p === "/") return new Response(page(), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    if (request.method === "GET" && p === "/admin.js") return new Response(ADMIN_JS, { headers: { "content-type": "application/javascript; charset=utf-8", "cache-control": "no-store" } });
    if (request.method === "GET" && p === "/api/stats") return stats(request, env);
    if (request.method === "GET" && p === "/api/submissions") return listSubmissions(url, env);
    if (request.method === "GET" && p === "/api/onboarding") return onboardingList(url, env);
    if (request.method === "GET" && p === "/api/onboarding/wait1.csv") return wait1CSV(env);
    if (request.method === "GET" && p === "/api/members") return members(env);
    if (request.method === "GET" && p === "/api/roster/issues") return rosterIssues(env);

    let m = p.match(/^\/api\/submissions\/([^/]+)\/review$/);
    if (request.method === "POST" && m) return reviewSubmission(request, env, m[1]);
    m = p.match(/^\/api\/submissions\/([^/]+)\/proof$/);
    if (request.method === "GET" && m) return proof(env, m[1]);
    m = p.match(/^\/api\/onboarding\/([^/]+)\/contacted$/);
    if (request.method === "POST" && m) return markContacted(request, env, m[1]);
    m = p.match(/^\/api\/onboarding\/([^/]+)\/admit$/);
    if (request.method === "POST" && m) return admit(request, env, m[1]);
    m = p.match(/^\/api\/roster\/issues\/([^/]+)\/resolve$/);
    if (request.method === "POST" && m) return resolveRosterIssue(request, env, m[1]);

    if (request.method === "POST" && p === "/api/roster/import") return importRoster(request, env);
    if (request.method === "POST" && p === "/api/roster/manual") return manualRosterAdd(request, env);
    return json({ message: "Not found" }, 404);
  },
};
