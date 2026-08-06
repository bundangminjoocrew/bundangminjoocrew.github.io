const documents = {
  "operating-rules": {
    title: "운영규칙 개정(안)",
    path: "./content/operating-rules.md"
  }
};

const params = new URLSearchParams(window.location.search);
const docKey = params.get("doc");
const selectedDocument = documents[docKey];
const titleEl = document.querySelector("#document-title");
const metaEl = document.querySelector("#document-meta");
const statusEl = document.querySelector("#viewer-status");
const contentEl = document.querySelector("#markdown-content");
const topButton = document.querySelector("#top-button");
const backLink = document.querySelector("#back-link");

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
  statusEl.hidden = false;
  contentEl.hidden = true;
}

function showContent() {
  statusEl.hidden = true;
  contentEl.hidden = false;
}

function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "section";
}

function resolveFromDocument(value, documentPath) {
  if (!value || value.startsWith("#") || /^(https?:|mailto:|tel:|data:|blob:|\/\/)/i.test(value)) {
    return value;
  }

  return new URL(value, new URL(documentPath, window.location.href)).href;
}

function isExternal(href) {
  if (/^(mailto:|tel:)/i.test(href)) return true;
  try {
    return new URL(href, window.location.href).origin !== window.location.origin;
  } catch {
    return false;
  }
}

function enhanceMarkdown(root, documentPath) {
  const seen = new Map();

  root.querySelectorAll("h1, h2, h3, h4").forEach((heading) => {
    const base = slugify(heading.textContent || "");
    const count = seen.get(base) || 0;
    const id = count ? `${base}-${count + 1}` : base;
    seen.set(base, count + 1);
    heading.id = heading.id || id;

    const anchor = document.createElement("a");
    anchor.className = "anchor-link";
    anchor.href = `#${heading.id}`;
    anchor.setAttribute("aria-label", `${heading.textContent} 섹션 링크`);
    anchor.textContent = "#";
    heading.append(anchor);
  });

  root.querySelectorAll("a[href]").forEach((link) => {
    const rawHref = link.getAttribute("href");
    const href = resolveFromDocument(rawHref, documentPath);
    link.setAttribute("href", href);

    if (isExternal(href)) {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    }
  });

  root.querySelectorAll("img[src]").forEach((image) => {
    const rawSrc = image.getAttribute("src");
    image.setAttribute("src", resolveFromDocument(rawSrc, documentPath));
    if (!image.hasAttribute("alt")) image.setAttribute("alt", "");
    image.loading = "lazy";
  });

  root.querySelectorAll("table").forEach((table) => {
    if (table.parentElement?.classList.contains("table-scroll")) return;
    const wrapper = document.createElement("div");
    wrapper.className = "table-scroll";
    table.parentNode.insertBefore(wrapper, table);
    wrapper.append(table);
  });

  root.querySelectorAll("input").forEach((input) => {
    if (input.getAttribute("type") !== "checkbox") {
      input.remove();
      return;
    }
    input.disabled = true;
  });
}

function formatLastModified(value) {
  if (!value) return "문서를 불러왔습니다.";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "문서를 불러왔습니다.";

  return `최종 수정: ${date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })}`;
}

async function renderDocument() {
  if (!selectedDocument) {
    document.title = "문서를 찾을 수 없습니다 | 분당민주크루";
    titleEl.textContent = "문서를 찾을 수 없습니다";
    metaEl.textContent = "";
    setStatus("요청한 문서를 찾을 수 없습니다", true);
    return;
  }

  titleEl.textContent = selectedDocument.title;
  document.title = `${selectedDocument.title} | 분당민주크루`;
  metaEl.textContent = "마크다운 문서를 불러오는 중입니다.";
  setStatus(`${selectedDocument.title}을 불러오는 중입니다.`);

  try {
    if (!window.marked || !window.DOMPurify) {
      throw new Error("문서 렌더링 라이브러리를 불러오지 못했습니다.");
    }

    const response = await fetch(selectedDocument.path, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`문서를 불러오지 못했습니다. (${response.status})`);
    }

    const markdown = await response.text();
    const markedApi = window.marked.marked || window.marked;
    markedApi.setOptions({
      breaks: false,
      gfm: true
    });

    const dirtyHtml = markedApi.parse(markdown);
    const cleanHtml = window.DOMPurify.sanitize(dirtyHtml, {
      USE_PROFILES: { html: true },
      ADD_TAGS: ["input"],
      ADD_ATTR: ["checked", "disabled", "type"]
    });

    contentEl.innerHTML = cleanHtml;
    enhanceMarkdown(contentEl, selectedDocument.path);
    metaEl.textContent = formatLastModified(response.headers.get("last-modified"));
    showContent();
  } catch (error) {
    metaEl.textContent = "";
    setStatus(error.message || "문서를 읽는 중 문제가 발생했습니다.", true);
  }
}

if (backLink) {
  backLink.addEventListener("click", (event) => {
    const referrerIsSameOrigin = document.referrer && new URL(document.referrer).origin === window.location.origin;
    if (window.history.length > 1 && referrerIsSameOrigin) {
      event.preventDefault();
      window.history.back();
    }
  });
}

if (topButton) {
  topButton.addEventListener("click", () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  window.addEventListener("scroll", () => {
    topButton.classList.toggle("visible", window.scrollY > 400);
  }, { passive: true });
}

renderDocument();
