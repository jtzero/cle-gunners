import { format, startOfWeek } from "date-fns";
import { getCollection, getEntry, type CollectionEntry } from "astro:content";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, request }) => {
  const { date } = params;

  const entry = (await getEntry(
    "fixtures",
    date,
  )) as CollectionEntry<"fixtures">;
  return new Response(JSON.stringify(entry.data));
};

export async function getStaticPaths() {
  const allFixtures = await getCollection("fixtures");
  const today = format(
    startOfWeek(new Date(), { weekStartsOn: 3 }),
    "yyyy-MM-dd",
  );
  const paths = allFixtures.map((fixture) => {
    return {
      params: {
        date: fixture.id,
      },
    };
  });
  return paths;
}
