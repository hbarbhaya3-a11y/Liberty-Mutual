import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Served from https://<user>.github.io/Liberty-Mutual/ on GitHub Pages.
  // NOTE: GitHub Pages project-site paths are case-sensitive and preserve the
  // repo name casing ("Liberty-Mutual"), so base must match exactly or assets 404.
  // Override with BASE_PATH for a custom domain / user site (e.g. "/").
  base: process.env.BASE_PATH || "/Liberty-Mutual/",
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: { port: 5173, host: "127.0.0.1" },
});
