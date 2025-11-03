import { getCollection, getEntry, type CollectionEntry } from "astro:content";
import { competition, type Season } from "@/lib/dataPipeline/football-data";
import type { APIRoute } from "astro";

export const GET: APIRoute = async (
  { request },
  getCollectionFunction = getCollection,
) => {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  if (!searchParams.has("date")) {
    return new Response(JSON.stringify({ competitions: [] }), {
      status: 404,
    });
  }
  const dateObj = new Date(searchParams.get("date"));

  const competitions = await getCollectionFunction(
    "competitions",
    (comp: CollectionEntry<"competitions">): boolean => {
      return (
        comp.seasons.find((season: Season) => {
          return (
            new Date(season.startDate).getTime() <= dateObj.getTime() &&
            new Date(season.endDate).getTime() >= dateObj.getTime()
          );
        }) !== undefined
      );
    },
  );
  return new Response(JSON.stringify({ competitions: competitions }));
};
