import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Served from https://<user>.github.io/Liberty-Mutual/ on GitHub Pages.
  // The path must match the repo name casing exactly — GitHub Pages paths are
  // case-sensitive, so a lowercase base 404s every asset and blanks the page.
  // Override with BASE_PATH for a custom domain / user site (e.g. "/").
  base: process.env.BASE_PATH || "/Liberty-Mutual/",
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: { port: 5173, host: "127.0.0.1" },
});
