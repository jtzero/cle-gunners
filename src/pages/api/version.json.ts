import { execSync } from "child_process";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, request }) => {
  const revision = execSync("git rev-parse HEAD").toString().trim();

  return new Response(JSON.stringify({ commit: revision }));
};
