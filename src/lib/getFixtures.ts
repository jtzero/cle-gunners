import { format, startOfWeek, endOfWeek } from "date-fns";
import { getCollection, getEntry, type CollectionEntry } from "astro:content";

import { type MatchType } from "@/content.config";

const matchWeekOf = (from = new Date()): string => {
  const startOfThisWeek = format(
    startOfWeek(from, { weekStartsOn: 1 }),
    "yyyy-MM-dd",
  ); // Monday
  const endOfThisWeek = format(
    endOfWeek(from, { weekStartsOn: 1 }),
    "yyyy-MM-dd",
  ); // Sunday

  return `${startOfThisWeek}-${endOfThisWeek}`;
};

export const getFixtures = async (from = new Date()): Promise<MatchType[]> => {
  const matchWeek = matchWeekOf(from);
  const entry = (await getEntry(
    "fixtures",
    matchWeek,
  )) as CollectionEntry<"fixtures">;
  return entry.data.matches;
};
