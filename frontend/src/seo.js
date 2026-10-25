import { defaultSettings } from "../../backend/src/defaults.js";

export const SITE_URL = "https://alkitabinternationalacademy.com";
export const SITE_NAME = "Al-Kitab International Quran Academy";
export const OG_IMAGE = `${SITE_URL}/quiz-logo.png`;

const HOME_DESCRIPTION =
  "Seerah quiz for students aged 25 or under, run by Al-Kitab International Quran Academy in Abbottabad. The registration fee is PKR 310.";

export const PUBLIC_PAGES = [
  {
    path: "/",
    source: "src/pages/Home.jsx",
    title: "Rahmat-e-Kainat Seerah Quiz 2026–27 | Al-Kitab International Quran Academy",
    description: HOME_DESCRIPTION,
    robots: "index, follow",
  },
  {
    path: "/register",
    source: "src/pages/Register.jsx",
    title: "Register for the Seerah Quiz | Al-Kitab International Quran Academy",
    description:
      "Apply for the Rahmat-e-Kainat Seerah Quiz 2026–27. Students up to age 25, with 16 years of education or less, can register for PKR 310.",
    robots: "index, follow",
  },
  {
    path: "/status",
    source: "src/pages/Status.jsx",
    title: "Quiz Registration Status | Al-Kitab International Quran Academy",
    description:
      "Look up a Rahmat-e-Kainat Seerah Quiz application with the registration number and the mobile number used on the form.",
    robots: "index, follow",
  },
  {
    path: "/admit-card",
    source: "src/pages/AdmitCard.jsx",
    title: "Download Your Quiz Admit Card | Al-Kitab International Quran Academy",
    description:
      "Download the Rahmat-e-Kainat Seerah Quiz roll number slip after Al-Kitab International Quran Academy accepts the registration.",
    robots: "index, follow",
  },
  {
    path: "/results",
    source: "src/pages/Results.jsx",
    title: "Seerah Quiz Results | Al-Kitab International Quran Academy",
    description: "Check a Rahmat-e-Kainat Seerah Quiz result with the registration number after the academy publishes the score.",
    robots: "index, follow",
  },
  {
    path: "/contact",
    source: "src/pages/Contact.jsx",
    title: "Contact Al-Kitab International Quran Academy",
    description:
      "Contact Al-Kitab International Quran Academy in Abbottabad by phone, WhatsApp, or email. Office hours are Monday to Saturday, 9:00 AM to 5:00 PM.",
    robots: "index, follow",
  },
];

export const ADMIN_PAGE = {
  path: "/admin",
  source: "src/pages/Admin.jsx",
  title: "Academy office | Al-Kitab International Quran Academy",
  description: "Private sign-in for the Al-Kitab International Quran Academy office.",
  robots: "noindex, nofollow",
};

const NOT_FOUND = {
  path: "",
  title: "Page not found | Al-Kitab International Quran Academy",
  description: "This address is not a page on the Al-Kitab International Quran Academy website.",
  robots: "noindex, nofollow",
};

export function absoluteUrl(path) {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

export function htmlFileFor(path) {
  return path === "/" ? "index.html" : `${path.replace(/^\//, "")}.html`;
}

export function pageForPath(pathname) {
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname || "/";
  return PUBLIC_PAGES.find((page) => page.path === path) || (path === ADMIN_PAGE.path ? ADMIN_PAGE : { ...NOT_FOUND, path });
}

function organization() {
  return {
    "@type": "EducationalOrganization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    email: defaultSettings.contact.email,
    telephone: "+923135671167",
    logo: OG_IMAGE,
    image: OG_IMAGE,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Abbottabad",
      addressCountry: "PK",
    },
  };
}

function website() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description: HOME_DESCRIPTION,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

function faqPage(faq) {
  return {
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function structuredData(page, faq = defaultSettings.faq) {
  const graph = [organization(), website()];
  if (page?.path === "/" && Array.isArray(faq) && faq.length) graph.push(faqPage(faq));
  return { "@context": "https://schema.org", "@graph": graph };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function applyHead(html, page) {
  const url = page.robots.startsWith("noindex") ? "" : absoluteUrl(page.path);
  const json = JSON.stringify(structuredData(page)).replaceAll("<", "\\u003c");
  const tags = [
    `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
    url ? `<link rel="canonical" href="${escapeHtml(url)}" />` : "",
    `<meta name="robots" content="${escapeHtml(page.robots)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    url ? `<meta property="og:url" content="${escapeHtml(url)}" />` : "",
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<script type="application/ld+json" id="seo-jsonld">${json}</script>`,
  ]
    .filter(Boolean)
    .join("\n    ");

  const stripped = html
    .replace(/<title>[\s\S]*?<\/title>\s*/gi, "")
    .replace(/<meta\s+name="description"[\s\S]*?>\s*/gi, "")
    .replace(/<link\s+rel="canonical"[\s\S]*?>\s*/gi, "")
    .replace(/<meta\s+name="robots"[\s\S]*?>\s*/gi, "")
    .replace(/<meta\s+property="og:[^"]+"[\s\S]*?>\s*/gi, "")
    .replace(/<meta\s+name="twitter:[^"]+"[\s\S]*?>\s*/gi, "")
    .replace(/<script\s+type="application\/ld\+json"\s+id="seo-jsonld">[\s\S]*?<\/script>\s*/gi, "");

  return stripped
    .replace("</head>", `    ${tags}\n  </head>`)
    .replace('<div id="root"></div>', `<noscript><p>${escapeHtml(page.description)}</p></noscript>\n    <div id="root"></div>`);
}

export function assertSeoPages() {
  const pages = [...PUBLIC_PAGES, ADMIN_PAGE];
  const titles = new Set();
  const descriptions = new Set();
  for (const page of pages) {
    if (titles.has(page.title)) throw new Error(`Duplicate title: ${page.title}`);
    if (descriptions.has(page.description)) throw new Error(`Duplicate description on ${page.path}`);
    titles.add(page.title);
    descriptions.add(page.description);
    if (!page.title.includes("Al-Kitab")) throw new Error(`Title is missing the academy name: ${page.path}`);
    if (page.description.length < 50 || page.description.length > 170) {
      throw new Error(`Description for ${page.path} is ${page.description.length} characters.`);
    }
    if (page.path !== "/admin" && page.robots !== "index, follow") {
      throw new Error(`Public page ${page.path} is not indexable.`);
    }
  }
  if (!ADMIN_PAGE.robots.includes("noindex")) throw new Error("The academy office page must stay noindex.");
}
