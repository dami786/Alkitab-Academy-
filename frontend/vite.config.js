import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { buildRobotsTxt, buildSitemap, validateRobots, validateSitemap, writeBuildSeoFiles } from "./sitemap.mjs";

function spaFallback() {
  return {
    name: "spa-fallback",
    closeBundle() {
      copyFileSync(resolve("dist/index.html"), resolve("dist/404.html"));
    },
  };
}

function seoFiles() {
  const serve = (server) => {
    server.middlewares.use((req, res, next) => {
      const pathname = req.url?.split("?")[0];
      if (pathname === "/sitemap.xml") {
        const body = buildSitemap();
        validateSitemap(body);
        res.setHeader("Content-Type", "application/xml; charset=utf-8");
        res.end(body);
        return;
      }
      if (pathname === "/robots.txt") {
        const body = buildRobotsTxt();
        validateRobots(body);
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end(body);
        return;
      }
      next();
    });
  };

  return {
    name: "seo-files",
    configureServer: serve,
    configurePreviewServer: serve,
    closeBundle() {
      writeBuildSeoFiles();
    },
  };
}

export default defineConfig({
  plugins: [react(), seoFiles(), spaFallback()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4000",
        changeOrigin: true,
      },
    },
  },
});
