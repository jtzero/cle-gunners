import * as seasons from "@/lib/seasons";

import type { APIRoute } from "astro";

const allSeasons = await seasons.fromDate(new Date());

export const GET: APIRoute = async ({ params, request }) => {
  return new Response(JSON.stringify({ seasons: allSeasons }));
};
