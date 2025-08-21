import { format, startOfWeek, endOfWeek } from "date-fns";
import {
  getCollection,
  getEntry,
  getEntries,
  type CollectionEntry,
} from "astro:content";

import { type MatchType } from "@/content.config";

const entryDateRange = (from: Date): string => {
  const startOfThisWeek = format(
    startOfWeek(from, { weekStartsOn: 3 }),
    "yyyy-MM-dd",
  ); // Wednesay
  const endOfThisWeek = format(
    endOfWeek(from, { weekStartsOn: 3 }),
    "yyyy-MM-dd",
  ); // TuesdayNextWeek

  return `${startOfThisWeek}-${endOfThisWeek}`;
};

const tap = (ret: any, closure) => {
  closure(ret);
  return ret;
};

export const getNextFixture = async (
  from: Date = new Date(),
): Promise<MatchType | undefined> => {
  const matchWeek = entryDateRange(from);
  const nextWeek = tap(new Date(from), (dt: Date) => {
    dt.setDate(dt.getDate() + 7);
  });
  const nextMatchWeek = entryDateRange(nextWeek);
  const entry = (await getEntry(
    "fixtures",
    matchWeek,
  )) as CollectionEntry<"fixtures">;
  const ret = await getEntries([
    { collection: "fixtures", id: matchWeek },
    { collection: "fixtures", id: nextMatchWeek },
  ]);
  return [...ret]
    .filter(Boolean)
    .flatMap((e) => e.data.matches)
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate))[0];
};
