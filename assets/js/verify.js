const VERIFICATION_API = "https://bunmink-verify-public.directorjjun.workers.dev/api/submissions";

const form = document.querySelector("#verification-form");
const submitButton = document.querySelector("#verification-submit");
const result = document.querySelector("#verification-result");
const proofInput = form.elements.proof;
const selectedFilename = document.querySelector("#selected-filename");
const phoneInput = form.elements.phone;
const phoneField = document.querySelector("#phone-field");
const duesSample = document.querySelector("#dues-sample");
const nicknameTitle = document.querySelector("#nickname-title");
const nicknameLabel = document.querySelector("#nickname-label");
const nicknameHelp = document.querySelector("#nickname-help");
const nicknameInput = form.elements.chat_nickname;

function syncRequestType() {
  const requestType = form.elements.request_type.value;
  const isNew = requestType === "new";
  const isReverify = requestType === "reverify";

  phoneField.hidden = !isNew;
  phoneInput.required = isNew;

  if (!isNew) {
    phoneInput.value = "";
  }

  if (isNew) {
    nicknameTitle.textContent = "실명/거주동";
    nicknameLabel.textContent = "실명/거주동";
    nicknameInput.placeholder = "예: 홍길동/판교동";
    nicknameHelp.textContent = "별명·활동명이 아닌 실명을 사용해 '실명/거주동' 형식으로 입력해주세요. 입장 후에도 같은 형식으로 닉네임을 설정해주세요.";
  } else if (isReverify) {
    nicknameTitle.textContent = "현재 오픈채팅방 닉네임";
    nicknameLabel.textContent = "현재 닉네임";
    nicknameInput.placeholder = "예: 홍길동/판교동";
    nicknameHelp.textContent = "현재 오픈채팅방에서 사용하는 닉네임을 '이름/거주동' 형식으로 입력해주세요. 직책이 있다면 거주동 뒤에 띄어 적어도 됩니다.";
  } else {
    nicknameTitle.textContent = "이름/거주동";
    nicknameLabel.textContent = "이름/거주동";
    nicknameInput.placeholder = "예: 홍길동/판교동";
    nicknameHelp.textContent = "신규 신청자는 실명/거주동을, 기존 참여자는 현재 오픈채팅방 닉네임을 입력해주세요.";
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
  const requestType = form.elements.request_type.value;
  const message = requestType === "new"
    ? "실명과 거주동을 '실명/거주동' 형식으로 입력해주세요. 예: 홍길동/판교동"
    : "현재 닉네임을 '이름/거주동' 형식으로 입력해주세요. 예: 홍길동/판교동";

  input.setCustomValidity(valid ? "" : message);
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

// verification sample lightbox v6
const sampleImages = Array.from(document.querySelectorAll("[data-sample-image]"));
let sampleLightbox = null;
let sampleLightboxImage = null;
let sampleLightboxClose = null;
let sampleLightboxPreviousFocus = null;

function ensureSampleLightbox() {
  if (sampleLightbox) return;

  sampleLightbox = document.createElement("div");
  sampleLightbox.className = "sample-lightbox";
  sampleLightbox.hidden = true;
  sampleLightbox.setAttribute("role", "dialog");
  sampleLightbox.setAttribute("aria-modal", "true");
  sampleLightbox.setAttribute("aria-label", "확인자료 예시 이미지 크게 보기");

  sampleLightbox.innerHTML = `
    <button class="sample-lightbox-close" type="button" aria-label="확대 이미지 닫기">×</button>
    <img class="sample-lightbox-image" alt="">
  `;

  document.body.appendChild(sampleLightbox);

  sampleLightboxImage = sampleLightbox.querySelector(".sample-lightbox-image");
  sampleLightboxClose = sampleLightbox.querySelector(".sample-lightbox-close");

  sampleLightboxClose.addEventListener("click", closeSampleLightbox);

  sampleLightbox.addEventListener("click", (event) => {
    if (event.target === sampleLightbox) {
      closeSampleLightbox();
    }
  });
}

function openSampleLightbox(image) {
  if (image.hidden || (!image.currentSrc && !image.src)) return;

  ensureSampleLightbox();

  sampleLightboxPreviousFocus = document.activeElement;
  sampleLightboxImage.src = image.currentSrc || image.src;
  sampleLightboxImage.alt = image.alt || "확인자료 예시 이미지";

  sampleLightbox.hidden = false;
  document.body.classList.add("sample-lightbox-open");
  sampleLightboxClose.focus();
}

function closeSampleLightbox() {
  if (!sampleLightbox || sampleLightbox.hidden) return;

  sampleLightbox.hidden = true;
  document.body.classList.remove("sample-lightbox-open");

  sampleLightboxImage.removeAttribute("src");
  sampleLightboxImage.alt = "";

  if (
    sampleLightboxPreviousFocus &&
    typeof sampleLightboxPreviousFocus.focus === "function"
  ) {
    sampleLightboxPreviousFocus.focus();
  }
}

sampleImages.forEach((image) => {
  image.setAttribute("tabindex", "0");
  image.setAttribute("role", "button");
  image.setAttribute("aria-label", `${image.alt || "확인자료 예시"} 크게 보기`);

  image.addEventListener("click", () => {
    openSampleLightbox(image);
  });

  image.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openSampleLightbox(image);
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && sampleLightbox && !sampleLightbox.hidden) {
    closeSampleLightbox();
  }
});

