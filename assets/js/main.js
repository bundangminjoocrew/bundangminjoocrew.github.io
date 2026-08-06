const socialLinks = [
  {
    label: "이메일 문의",
    url: "mailto:bundangminjoocrew@gmail.com",
    icon: "mail",
    external: true
  }
];

const linkSections = [
  {
    title: "안내",
    links: [
      {
        title: "운영규칙 개정(안)",
        description: "의견 수렴 중인 참여 및 운영 기준",
        url: "./viewer.html?doc=operating-rules",
        icon: "document",
        external: false,
        featured: true
      },
      {
        title: "최근 안내",
        description: "주요 공지와 업데이트",
        url: "#notice",
        icon: "megaphone",
        external: false,
        featured: false
      }
    ]
  },
  {
    title: "참여",
    links: [
      {
        title: "가입 문의",
        description: "참여 방법과 기본 안내를 문의하세요",
        url: "mailto:bundangminjoocrew@gmail.com?subject=%EB%B6%84%EB%8B%B9%EB%AF%BC%EC%A3%BC%ED%81%AC%EB%A3%A8%20%EA%B0%80%EC%9E%85%20%EB%AC%B8%EC%9D%98",
        icon: "people",
        external: true,
        featured: false
      },
      {
        title: "제안 보내기",
        description: "행사, 의제, 운영 개선 의견",
        url: "mailto:bundangminjoocrew@gmail.com?subject=%EB%B6%84%EB%8B%B9%EB%AF%BC%EC%A3%BC%ED%81%AC%EB%A3%A8%20%EC%A0%9C%EC%95%88",
        icon: "message",
        external: true,
        featured: false
      }
    ]
  },
  {
    title: "바로가기",
    links: [
      {
        title: "더불어민주당",
        description: "공식 홈페이지",
        url: "https://www.theminjoo.kr",
        icon: "globe",
        external: true,
        featured: false
      },
      {
        title: "국민응답센터",
        description: "청원과 제안 확인",
        url: "https://petitions.theminjoo.kr",
        icon: "external",
        external: true,
        featured: false
      }
    ]
  }
];

const icons = {
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-6-6 6 6-6 6"/></svg>',
  document: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 3h7l5 5v13H7zM14 3v6h5M9 13h6M9 17h6"/></svg>',
  external: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 4h6v6M20 4l-9 9M19 14v5H5V5h5"/></svg>',
  globe: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3.6 9h16.8M3.6 15h16.8M12 3c2.2 2.4 3.4 5.4 3.4 9S14.2 18.6 12 21c-2.2-2.4-3.4-5.4-3.4-9S9.8 5.4 12 3Z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16v12H4z"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4 7 8 6 8-6"/></svg>',
  megaphone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 13h3l10 5V6L7 11H4zM7 13l2 7h3l-2-6"/></svg>',
  message: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5h14v10H8l-3 4zM8 9h8M8 12h5"/></svg>',
  people: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2.5 21a6.5 6.5 0 0 1 13 0M17 10a3 3 0 1 0 0-6M16.5 14.5A5.5 5.5 0 0 1 21.5 20"/></svg>'
};

function icon(name) {
  return icons[name] || icons.external;
}

function isExternalUrl(url) {
  return /^(https?:)?\/\//.test(url);
}

function linkAttrs(link) {
  const external = link.external || isExternalUrl(link.url);
  return external && isExternalUrl(link.url) ? ' target="_blank" rel="noopener noreferrer"' : "";
}

function renderSocialLinks() {
  const container = document.querySelector("#social-links");
  if (!container) return;

  container.innerHTML = socialLinks
    .map((link) => {
      return `<a class="social-link" href="${link.url}" aria-label="${link.label}"${linkAttrs(link)}>
        ${icon(link.icon)}
      </a>`;
    })
    .join("");
}

function renderLinkSections() {
  const container = document.querySelector("#link-sections");
  if (!container) return;

  container.innerHTML = linkSections
    .map((section) => {
      const links = section.links
        .map((link) => {
          const classes = link.featured ? "link-card featured" : "link-card";
          return `<a class="${classes}" href="${link.url}"${linkAttrs(link)}>
            <span class="link-icon" aria-hidden="true">${icon(link.icon)}</span>
            <span class="link-text">
              <strong>${link.title}</strong>
              <span>${link.description}</span>
            </span>
            <span class="link-arrow" aria-hidden="true">${icon("arrow")}</span>
          </a>`;
        })
        .join("");

      return `<section class="link-section">
        <h2>${section.title}</h2>
        ${links}
      </section>`;
    })
    .join("");
}

function setCurrentYear() {
  const year = document.querySelector("#current-year");
  if (year) year.textContent = String(new Date().getFullYear());
}

renderSocialLinks();
renderLinkSections();
setCurrentYear();
