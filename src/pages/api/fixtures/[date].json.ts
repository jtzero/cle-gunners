import _ from "lodash";
import { getCollection, getEntry, type CollectionEntry } from "astro:content";
import type { APIRoute } from "astro";
import type { MatchType } from "../../../content.types";

interface Fixtures {
  matches: Array<MatchType>;
}

export const GET: APIRoute = async ({ params }) => {
  const { date } = params;

  const pl_entry = (await getEntry(
    "fixtures",
    `pl/${date}`,
  )) as CollectionEntry<"fixtures">;
  const cl_entry = (await getEntry(
    "fixtures",
    `cl/${date}`,
  )) as CollectionEntry<"fixtures">;

  const fixtures = [pl_entry?.data, cl_entry?.data].filter(Boolean).reduce(
    (memo: Fixtures, entry: Fixtures) => {
      const matches = memo.matches.concat(entry.matches);
      return { matches: matches };
    },
    { matches: [] },
  );
  return new Response(JSON.stringify(fixtures));
};

interface HasId {
  id: string;
}

export async function getStaticPaths() {
  const allFixtures = await getCollection("fixtures");
  const filtered = _.uniqWith(
    allFixtures,
    (fixtureA: HasId, fixtureB: HasId) => {
      return fixtureA.id.split("/")[1] === fixtureB.id.split("/")[1];
    },
  );
  const paths = filtered.map((fixture: HasId) => {
    const date = fixture.id.split("/")[1];
    if ((date || "").length == 0) {
      throw new Error(`Unexpected id format:'${fixture.id}'`);
    }
    return {
      params: {
        date: date,
      },
    };
  });
  return paths;
}
