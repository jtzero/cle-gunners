import { getCollection, getEntry, type CollectionEntry } from "astro:content";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, request }) => {
  const { competitionCode } = params;

  const entry = (await getEntry(
    "competitions",
    competitionCode,
  )) as CollectionEntry<"competitions">;
  return new Response(JSON.stringify(entry.data));
};

export async function getStaticPaths() {
  const paths = (await getCollection("competitions")).map((competition) => {
    return {
      params: {
        competitionCode: competition.id,
      },
    };
  });
  return paths;
}
