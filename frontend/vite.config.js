import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function spaFallback() {
  return {
    name: "spa-fallback",
    closeBundle() {
      copyFileSync(resolve("dist/index.html"), resolve("dist/404.html"));
    },
  };
}

export default defineConfig({
  plugins: [react(), spaFallback()],
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
