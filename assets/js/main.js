async function loadOperatingRulesMeta() {
  const metaEl = document.querySelector("#operating-rules-meta");
  if (!metaEl) return;

  try {
    const response = await fetch("./content/operating-rules.md", {
      cache: "no-cache"
    });

    if (!response.ok) return;

    const markdown = await response.text();
    const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);

    if (!match) return;

    const metadata = {};

    match[1].split("\n").forEach((line) => {
      const separator = line.indexOf(":");
      if (separator === -1) return;

      const key = line.slice(0, separator).trim();
      let value = line.slice(separator + 1).trim();

      value = value.replace(/^["']|["']$/g, "");
      metadata[key] = value;
    });

    if (metadata.version) {
      metaEl.textContent =
        `참여 및 운영 기준 · ver. ${metadata.version}`;
    }
  } catch (error) {
    console.warn("운영규칙 버전 정보를 불러오지 못했습니다.", error);
  }
}

function setCurrentYear() {
  const year = document.querySelector("#current-year");

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }
}

setCurrentYear();
loadOperatingRulesMeta();