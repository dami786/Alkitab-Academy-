import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ADMIN_PAGE, PUBLIC_PAGES, SITE_URL, applyHead, assertSeoPages, htmlFileFor } from "./src/seo.js";

const frontendRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(frontendRoot, "..");

const PUBLIC_ROUTES = PUBLIC_PAGES;

export { SITE_URL };

const LASTMOD_PATTERN = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/;

let gitCommand;
let historyReady = false;
const lastmodCache = new Map();

function gitBin() {
  if (gitCommand !== undefined) return gitCommand;
  const candidates = ["git"];
  if (process.platform === "win32") candidates.push("C:\\Program Files\\Git\\cmd\\git.exe");
  for (const candidate of candidates) {
    try {
      const result = spawnSync(candidate, ["--version"], { encoding: "utf8", windowsHide: true });
      if (result.status === 0) {
        gitCommand = candidate;
        return gitCommand;
      }
    } catch {
      // This candidate is not executable. Try the next one.
    }
  }
  gitCommand = null;
  return null;
}

function gitOutput(args) {
  const git = gitBin();
  if (!git) return "";
  try {
    const result = spawnSync(git, args, { cwd: repoRoot, encoding: "utf8", windowsHide: true });
    if (result.status !== 0) return "";
    return result.stdout?.trim() || "";
  } catch {
    return "";
  }
}

function xmlEscape(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function routeUrl(path) {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

function committedAt(sourcePath) {
  if (lastmodCache.has(sourcePath)) return lastmodCache.get(sourcePath);
  let date = gitOutput(["log", "-1", "--format=%cI", "--", sourcePath]);
  if (!date && !historyReady && gitOutput(["rev-parse", "--is-shallow-repository"]) === "true") {
    historyReady = true;
    const git = gitBin();
    try {
      spawnSync(git, ["fetch", "--unshallow"], { cwd: repoRoot, encoding: "utf8", windowsHide: true, timeout: 60000 });
    } catch {
      // The build can still emit the sitemap without a lastmod for this file.
    }
    date = gitOutput(["log", "-1", "--format=%cI", "--", sourcePath]);
  }
  if (!date) {
    const ageMs = Date.now() - statSync(sourcePath).mtimeMs;
    if (ageMs > 10 * 60 * 1000) date = statSync(sourcePath).mtime.toISOString().replace(/\.\d{3}Z$/, "Z");
  }
  lastmodCache.set(sourcePath, date || null);
  return date || null;
}

export function buildSitemap() {
  const urls = PUBLIC_ROUTES.map((route) => {
    const sourcePath = resolve(frontendRoot, route.source);
    if (!existsSync(sourcePath)) {
      throw new Error(`Sitemap source file is missing: ${route.source}`);
    }
    const loc = xmlEscape(routeUrl(route.path));
    const modified = committedAt(sourcePath);
    const lastmod = modified ? `\n    <lastmod>${xmlEscape(modified)}</lastmod>` : "";
    return `  <url>\n    <loc>${loc}</loc>${lastmod}\n  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

export function buildRobotsTxt() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}

export function validateSitemap(xml) {
  if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
    throw new Error("Sitemap is missing the XML declaration.");
  }
  if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
    throw new Error("Sitemap is missing the sitemap namespace.");
  }
  if (/<changefreq>|<priority>/i.test(xml)) {
    throw new Error("Sitemap includes changefreq or priority.");
  }

  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const expected = PUBLIC_ROUTES.map((route) => routeUrl(route.path));
  if (locs.length !== expected.length || expected.some((url, index) => locs[index] !== url)) {
    throw new Error(`Sitemap URLs do not match the public routes. Expected ${expected.join(", ")}. Received ${locs.join(", ")}.`);
  }

  const seen = new Set();
  for (const loc of locs) {
    if (!loc.startsWith("https://")) throw new Error(`Sitemap URL is not absolute HTTPS: ${loc}`);
    if (seen.has(loc)) throw new Error(`Sitemap URL is duplicated: ${loc}`);
    seen.add(loc);
    const path = new URL(loc).pathname;
    if (path === "/admin" || path.startsWith("/admin/") || path.startsWith("/api")) {
      throw new Error(`Sitemap includes a private URL: ${loc}`);
    }
  }

  const lastmods = [...xml.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)].map((match) => match[1]);
  if (lastmods.length > locs.length) throw new Error("Sitemap has more lastmod values than URLs.");
  for (const value of lastmods) {
    if (!LASTMOD_PATTERN.test(value)) throw new Error(`Invalid lastmod value: ${value}`);
  }
}

export function validateRobots(text) {
  const sitemapLine = `Sitemap: ${SITE_URL}/sitemap.xml`;
  if (!text.includes(sitemapLine)) throw new Error("robots.txt is missing the sitemap reference.");
  if (/^Disallow:\s*\/\s*$/m.test(text)) throw new Error("robots.txt blocks the whole website.");
}

function writeRouteHtml(dist) {
  const shellPath = resolve(dist, "index.html");
  const shell = readFileSync(shellPath, "utf8");
  const titles = new Set();
  for (const page of [...PUBLIC_ROUTES, ADMIN_PAGE]) {
    const html = applyHead(shell, page);
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
    if (!title || titles.has(title)) throw new Error(`Route HTML is missing a unique title for ${page.path}.`);
    titles.add(title);
    if (page.robots.startsWith("noindex") && !html.includes("noindex")) throw new Error(`Noindex is missing from ${page.path}.`);
    if (!page.robots.startsWith("noindex") && !html.includes(`<link rel="canonical" href="${SITE_URL}${page.path === "/" ? "/" : page.path}"`)) {
      throw new Error(`Canonical URL is missing from ${page.path}.`);
    }
    writeFileSync(resolve(dist, htmlFileFor(page.path)), html);
  }
}

export function writeBuildSeoFiles() {
  assertSeoPages();
  const sitemap = buildSitemap();
  const robots = buildRobotsTxt();
  validateSitemap(sitemap);
  validateRobots(robots);
  const dist = resolve(frontendRoot, "dist");
  mkdirSync(dist, { recursive: true });
  writeRouteHtml(dist);
  writeFileSync(resolve(dist, "sitemap.xml"), sitemap);
  writeFileSync(resolve(dist, "robots.txt"), robots);
}
