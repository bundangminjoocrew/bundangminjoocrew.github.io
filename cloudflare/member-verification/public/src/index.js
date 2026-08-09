const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };
function cors(env){return{"Access-Control-Allow-Origin":env.ALLOWED_ORIGIN,"Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type","Vary":"Origin"}}
function json(data,status,env){return new Response(JSON.stringify(data),{status,headers:{...JSON_HEADERS,...cors(env)}})}
function normalizePhone(v){return String(v||"").replace(/\D/g,"")}
function normalizeNickname(v){return String(v||"").normalize("NFKC").trim().replace(/\s+/g,"").toLowerCase()}
function isoPlusDays(date,days){return new Date(date.getTime()+days*86400000).toISOString()}
function isoPlusYears(date,years){const d=new Date(date);d.setUTCFullYear(d.getUTCFullYear()+years);return d.toISOString()}
function parseNickname(raw){
  const value=String(raw||"").normalize("NFKC").trim();
  const slash=value.indexOf("/");
  if(slash<=0||slash===value.length-1||value.indexOf("/",slash+1)!==-1) return null;
  const name=value.slice(0,slash).trim(); const district=value.slice(slash+1).trim();
  if(!name||!district||name.length>40||district.length>40) return null;
  return {display:`${name}/${district}`,name,district};
}
async function verifyTurnstile(token,ip,secret){if(!secret)return false;const body=new FormData();body.append("secret",secret);body.append("response",token);if(ip)body.append("remoteip",ip);const r=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body});const data=await r.json();return data.success===true}
async function createSubmission(request,env){
  const origin=request.headers.get("Origin")||""; if(origin!==env.ALLOWED_ORIGIN)return json({ok:false,message:"허용되지 않은 출처입니다."},403,env);
  const fd=await request.formData();
  const requestType=String(fd.get("request_type")||""); const memberType=String(fd.get("member_type")||"");
  const parsed=parseNickname(fd.get("chat_nickname")); const phone=normalizePhone(fd.get("phone"));
  const privacyConsent=String(fd.get("privacy_consent")||""); const sensitiveConsent=String(fd.get("sensitive_consent")||""); const materialConfirmation=String(fd.get("material_confirmation")||"");
  const token=String(fd.get("cf-turnstile-response")||""); const proof=fd.get("proof");
  if(!["new","reverify"].includes(requestType)||!["rights","general"].includes(memberType))return json({ok:false,message:"신청 유형과 당원 구분을 확인해주세요."},400,env);
  if(!parsed)return json({ok:false,message:"닉네임을 '이름/거주동' 형식으로 입력해주세요. 예: 홍길동/판교동"},400,env);
  if(requestType==="new"&&phone.length<10)return json({ok:false,message:"신규 입장 신청에는 연락 가능한 전화번호가 필요합니다."},400,env);
  if(privacyConsent!=="yes"||sensitiveConsent!=="yes"||materialConfirmation!=="yes")return json({ok:false,message:"필수 동의 및 확인 항목을 확인해주세요."},400,env);
  if(!(proof instanceof File)||proof.size<1)return json({ok:false,message:"당원 확인자료를 첨부해주세요."},400,env);
  if(proof.size>5*1024*1024)return json({ok:false,message:"인증자료는 5MB 이하만 업로드할 수 있습니다."},400,env);
  const allowed=new Set(["image/jpeg","image/png","image/webp","application/pdf"]); if(!allowed.has(proof.type))return json({ok:false,message:"JPG, PNG, WEBP 또는 PDF만 제출할 수 있습니다."},400,env);
  const turnstileOK=await verifyTurnstile(token,request.headers.get("CF-Connecting-IP"),env.TURNSTILE_SECRET); if(!turnstileOK)return json({ok:false,message:"자동 제출 방지 확인에 실패했습니다."},400,env);
  let roster=null; if(requestType==="reverify"){roster=await env.MEMBERS_DB.prepare("SELECT id, display_nickname FROM existing_members WHERE nickname_key=? AND active=1 LIMIT 1").bind(normalizeNickname(parsed.display)).first()}
  const now=new Date(),id=crypto.randomUUID(); const ext=proof.type==="image/png"?"png":proof.type==="image/webp"?"webp":proof.type==="application/pdf"?"pdf":"jpg"; const proofKey=`proofs/${now.getUTCFullYear()}/${String(now.getUTCMonth()+1).padStart(2,"0")}/${id}.${ext}`; const deleteAfter=new Date(now.getTime()+(7*24-1)*3600000).toISOString(); const initialExpires=isoPlusYears(now,2);
  await env.PROOFS.put(proofKey,proof.stream(),{httpMetadata:{contentType:proof.type},customMetadata:{submissionId:id}});
  try{
    const t=now.toISOString();
    await env.DB.prepare(`INSERT INTO submissions(id,request_type,member_type,chat_nickname,name,district,phone,roster_member_id,roster_match,proof_key,proof_original_name,proof_mime,proof_size,proof_delete_after,review_status,consent_at,privacy_consent_at,sensitive_consent_at,material_confirmation_at,consent_version,submitted_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending',?,?,?,?, 'v3-20260809',?,?)`).bind(id,requestType,memberType,parsed.display,parsed.name,parsed.district,requestType==="new"?phone:null,roster?.id||null,roster?1:0,proofKey,proof.name||null,proof.type,proof.size,deleteAfter,t,t,t,t,t,initialExpires).run();
  }catch(e){await env.PROOFS.delete(proofKey);throw e}
  return json({ok:true,id,rosterMatched:requestType==="reverify"?Boolean(roster):null,message:"당원 확인자료가 접수되었습니다."},201,env)
}
async function cleanup(env){
  const nowIso=new Date().toISOString(); const due=await env.DB.prepare("SELECT id,proof_key FROM submissions WHERE proof_key IS NOT NULL AND proof_delete_after<=? LIMIT 100").bind(nowIso).all();
  for(const row of due.results||[]){try{await env.PROOFS.delete(row.proof_key);await env.DB.prepare(`UPDATE submissions SET proof_key=NULL,proof_original_name=NULL,proof_mime=NULL,proof_size=NULL,proof_deleted_at=?,proof_delete_reason=COALESCE(proof_delete_reason,'7day_expiry') WHERE id=?`).bind(nowIso,row.id).run()}catch(e){console.error("proof cleanup failed",row.id,e)}}
  await env.DB.prepare("DELETE FROM submissions WHERE expires_at IS NOT NULL AND expires_at<=?").bind(nowIso).run();
}
export default{async fetch(request,env){if(request.method==="OPTIONS")return new Response(null,{status:204,headers:cors(env)});const url=new URL(request.url);if(request.method==="POST"&&url.pathname==="/api/submissions"){try{return await createSubmission(request,env)}catch(e){console.error(e);return json({ok:false,message:"접수 처리 중 오류가 발생했습니다."},500,env)}}return json({ok:false,message:"Not found"},404,env)},async scheduled(_controller,env,ctx){ctx.waitUntil(cleanup(env))}};
