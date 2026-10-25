import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useContent } from "../content.jsx";
import { OG_IMAGE, SITE_NAME, absoluteUrl, pageForPath, structuredData } from "../seo.js";

function upsertMeta(attribute, key, content) {
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.head.querySelector(selector);
  if (!content) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

export default function Seo() {
  const { pathname } = useLocation();
  const { content } = useContent();
  const page = pageForPath(pathname);
  const canonical = page.robots.startsWith("noindex") ? "" : absoluteUrl(page.path);
  const json = JSON.stringify(structuredData(page, page.path === "/" ? content?.faq : undefined)).replaceAll("<", "\\u003c");

  useEffect(() => {
    document.title = page.title;
    upsertMeta("name", "description", page.description);
    upsertMeta("name", "robots", page.robots);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:title", page.title);
    upsertMeta("property", "og:description", page.description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:image", OG_IMAGE);
    upsertMeta("name", "twitter:card", "summary");

    let canonicalLink = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonicalLink?.remove();
    } else {
      if (!canonicalLink) {
        canonicalLink = document.createElement("link");
        canonicalLink.setAttribute("rel", "canonical");
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute("href", canonical);
    }

    let script = document.getElementById("seo-jsonld");
    if (!script) {
      script = document.createElement("script");
      script.id = "seo-jsonld";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = json;
  }, [page.title, page.description, page.robots, canonical, json]);

  return null;
}
