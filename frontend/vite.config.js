import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://alkitab-academy.onrender.com",
        changeOrigin: true,
        secure: true,
        timeout: 180000,
        proxyTimeout: 180000,
      },
    },
  },
});
