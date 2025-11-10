import { getCollection, type CollectionEntry } from "astro:content";
import { type Season } from "@/lib/dataPipeline/football-data";

export const fromDate = async (date: Date): Promise<Season[]> => {
  return (await getCollection(
    "competitions",
  )).flatMap((comp: CollectionEntry<"competitions">): Season[] => {
    return comp.data.seasons.filter((season: Season) => {
      return (
        new Date(season.startDate).getTime() <= date.getTime() &&
        new Date(season.endDate).getTime() >= date.getTime()
      );
    });
  });
};

