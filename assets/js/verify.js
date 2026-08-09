const VERIFICATION_API = "https://bunmink-verify-public.YOUR-SUBDOMAIN.workers.dev/api/submissions";

const form = document.querySelector("#verification-form");
const submitButton = document.querySelector("#verification-submit");
const result = document.querySelector("#verification-result");
const proofInput = form.elements.proof;
const selectedFilename = document.querySelector("#selected-filename");
const phoneInput = form.elements.phone;
const phoneField = document.querySelector("#phone-field");
const duesSample = document.querySelector("#dues-sample");

function syncRequestType() {
  const requestType = form.elements.request_type.value;
  const isNew = requestType === "new";

  phoneField.hidden = !isNew;
  phoneInput.required = isNew;

  if (!isNew) {
    phoneInput.value = "";
  }
}

function syncMemberType() {
  const memberType = form.elements.member_type.value;
  duesSample.hidden = memberType === "general";
}

function validateNickname() {
  const input = form.elements.chat_nickname;
  const value = input.value.normalize("NFKC").trim();
  const parts = value.split("/");
  const valid = parts.length === 2 && parts[0].trim().length > 0 && parts[1].trim().length > 0;

  input.setCustomValidity(valid ? "" : "닉네임을 '이름/거주동' 형식으로 입력해주세요. 예: 홍길동/판교동");
  return valid;
}

function resetTurnstile() {
  if (window.turnstile) {
    window.turnstile.reset();
  }
}

form.querySelectorAll('input[name="request_type"]').forEach((input) => {
  input.addEventListener("change", syncRequestType);
});

form.querySelectorAll('input[name="member_type"]').forEach((input) => {
  input.addEventListener("change", syncMemberType);
});

form.elements.chat_nickname.addEventListener("input", () => {
  form.elements.chat_nickname.setCustomValidity("");
});

proofInput.addEventListener("change", () => {
  const file = proofInput.files[0];

  selectedFilename.textContent = file
    ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)}MB`
    : "JPG · PNG · WEBP · PDF / 최대 5MB";
});

document.querySelectorAll("[data-sample-image]").forEach((image) => {
  image.addEventListener("error", () => {
    image.hidden = true;
    const placeholder = image.nextElementSibling;
    if (placeholder) placeholder.hidden = false;
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  result.className = "form-result";
  result.textContent = "";

  syncRequestType();
  syncMemberType();
  validateNickname();

  if (!form.reportValidity()) return;

  const proof = proofInput.files[0];

  if (proof && proof.size > 5 * 1024 * 1024) {
    result.classList.add("error");
    result.textContent = "파일은 5MB 이하로 제출해주세요.";
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "제출 중…";

  try {
    const response = await fetch(VERIFICATION_API, {
      method: "POST",
      body: new FormData(form),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "제출하지 못했습니다.");
    }

    result.classList.add("success");
    result.textContent = data.rosterMatched === false
      ? "접수되었습니다. 기존 참여자 명부와 자동 일치하지 않아 담당자가 직접 확인합니다."
      : "정상적으로 접수되었습니다. 담당자 확인 후 인증자료 원본은 즉시 삭제됩니다.";

    form.reset();
    syncRequestType();
    syncMemberType();
    selectedFilename.textContent = "JPG · PNG · WEBP · PDF / 최대 5MB";
    resetTurnstile();
  } catch (error) {
    result.classList.add("error");
    result.textContent = error.message;
    resetTurnstile();
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "당원 확인자료 제출";
  }
});

syncRequestType();
syncMemberType();
