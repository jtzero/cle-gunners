import { expect, test, describe } from "vitest";
import * as getData from "./index";
import type { Logger } from "./index";
import type { Competition } from "../football-data";

const competitionTeamsFactory = (): { [key: string]: any } => ({
  teams: [
    {
      id: 57,
      name: "Arsenal FC",
      shortName: "Arsenal",
      tla: "ARS",
      crest: "https://crests.football-data.org/57.svg",
      address: "Emirates Stadium",
      website: "http://www.arsenal.com",
      founded: 1886,
      clubColors: "Red / White",
      venue: "Emirates Stadium",
      runningCompetitions: [],
    },
  ],
});

const clCompetitionFactory = (): Competition => ({
  area: {
    id: 2077,
    name: "Europe",
    code: "EUR",
    flag: "https://crests.football-data.org/3.svg",
  },
  id: 2001,
  name: "UEFA Champions League",
  code: "CL",
  type: "CUP",
  emblem: "https://crests.football-data.org/CL.png",
  currentSeason: {
    id: 1490,
    startDate: "2022-11-21",
    endDate: "2023-12-18",
    currentMatchday: 1,
    winner: null,
    stages: [],
  },
  seasons: [
    {
      id: 1490,
      startDate: "2022-11-21",
      endDate: "2023-12-18",
      currentMatchday: 1,
      winner: null,
      stages: [],
    },
  ],
});

const matchResponseFactory = (
  dateFrom: string,
  dateTo: string,
): { [key: string]: any } => ({
  resultSet: {
    count: 1,
    competitions: "CL",
  },
  matches: [
    {
      id: 400000001,
      utcDate: "2023-10-24T19:00:00Z",
      status: "TIMED",
      matchday: 3,
      stage: "GROUP_STAGE",
      homeTeam: {
        id: 57,
        name: "Arsenal FC",
        shortName: "Arsenal",
        tla: "ARS",
        crest: "https://crests.football-data.org/57.png",
      },
      awayTeam: {
        id: 5,
        name: "FC Bayern München",
        shortName: "Bayern München",
        tla: "FCB",
        crest: "https://crests.football-data.org/5.png",
      },
      score: {
        winner: null,
        duration: "REGULAR",
        fullTime: { home: null, away: null },
        halfTime: { home: null, away: null },
      },
    },
  ],
});

describe("champions league pipeline", () => {
  test("collects and asserts pipeline logs", async () => {
    const logs: any[][] = [];
    const logger: Logger = {
      log: (...args: any[]) => {
        logs.push(args);
      },
    };

    const fetchFunction = (
      apiEndpoint: string,
      _requestOptions: RequestInit,
    ) => {
      if (
        apiEndpoint.startsWith(
          "https://api.football-data.org/v4/competitions/CL",
        )
      ) {
        return {
          ok: true,
          json: () => clCompetitionFactory(),
        };
      }
      if (
        apiEndpoint.startsWith(
          "https://api.football-data.org/v4/competitions/PL/teams?season=",
        )
      ) {
        return {
          ok: true,
          json: () => competitionTeamsFactory(),
        };
      }
      const idAndPath = apiEndpoint.split(
        "https://api.football-data.org/v4/teams/",
      )[1];
      if (idAndPath.match(/^\d+\/matches/)) {
        const url = new URL(apiEndpoint);
        const dateFrom = url.searchParams.get("dateFrom");
        const dateTo = url.searchParams.get("dateTo");
        return {
          ok: true,
          json: () => matchResponseFactory(dateFrom!, dateTo!),
        };
      }
      throw "unhandled api endpoint:'" + apiEndpoint + "'";
    };

    await getData.run(
      "fake_api_key",
      "CL",
      "2023-10-18",
      fetchFunction,
      () => {},
      logger,
    );

    const messages = logs.map((args) => String(args[0]));
    expect(messages).toEqual([
      "2023-10-18",
      "Fetching team ID...",
      "ID fetched",
      "Season:",
      "Fetching Fixtures from:",
      "Fixtures fetched:",
      "Writing data to file...",
      "Season:",
      "Fetching Fixtures from:",
      "Fixtures fetched:",
      "Writing data to file...",
    ]);

    const idFetched = logs.find((args) => args[0] === "ID fetched");
    expect(idFetched?.[1]).toBe(57);

    expect(logs.length).toBe(11);
  });
});
