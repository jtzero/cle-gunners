import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import AutoImport from "astro-auto-import";
import { defineConfig } from "astro/config";
import scope from "astro-scope";
import remarkCollapse from "remark-collapse";
import remarkToc from "remark-toc";
import config from "./src/config/config.js";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let highlighter;
async function getHighlighter() {
  if (!highlighter) {
    const { getHighlighter } = await import("shiki");
    highlighter = await getHighlighter({ theme: "one-dark-pro" });
  }
  return highlighter;
}

// https://astro.build/config
export default defineConfig({
  site: "https://clevelandgooners.com",
  base: process.env.BASE || "",
  trailingSlash: false ? "always" : "never",
  vite: {
    plugins: [tailwindcss(), tsconfigPaths()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  },
  integrations: [react(), sitemap(), mdx(), scope()],
  markdown: {
    remarkPlugins: [
      remarkToc,
      [
        remarkCollapse,
        {
          test: "Table of contents",
        },
      ],
    ],
    shikiConfig: {
      theme: "one-dark-pro",
      wrap: true,
    },
    extendDefaultPlugins: true,
    highlighter: getHighlighter,
  },
});
