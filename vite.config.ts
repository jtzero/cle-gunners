// without this file vite will fail to reference astro and vitest will fail
// I.E. "Cannot find package 'astro:content'"
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    exclude: ["__tests__/e2e/**", "node_modules/**"],
  },
});
