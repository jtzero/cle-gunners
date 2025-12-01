import { getCollection, getEntry, type CollectionEntry } from "astro:content";
import type { APIRoute } from "astro";

const IDPrefix = "cl";

export const GET: APIRoute = async ({ params, request }) => {
  const { date } = params;

  const entry = (await getEntry(
    "fixtures",
    `${IDPrefix}/${date}`,
  )) as CollectionEntry<"fixtures">;
  if (!entry) {
    return new Response(JSON.stringify({ error: "Fixtures not found" }), {
      status: 404,
    });
  }
  return new Response(JSON.stringify(entry.data));
};

export async function getStaticPaths() {
  const allFixtures = await getCollection("fixtures", ({ id }) => {
    return id.startsWith(`${IDPrefix}/`);
  });
  const paths = allFixtures.map((fixture) => {
    return {
      params: {
        date: fixture.id.split("/")[1],
      },
    };
  });
  return paths;
}
