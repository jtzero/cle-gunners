import { expect, test, describe } from "vitest";
import * as getData from "./getData";

const competitionTeamsFactory = (): { [key: string]: any } => {
  return {
    resultSet: {
      count: 1,
      competitions: "PL",
      first: "2025-08-23",
      last: "2025-08-23",
      played: 0,
      wins: 0,
      draws: 1,
      losses: 0,
    },
    filters: {
      season: "2025",
    },
    competition: {
      id: 2000,
      name: "Premier League",
      code: "PL",
      type: "LEAGUE",
      emblem: "https://crests.football-data.org/PL.png",
    },
    season: {
      id: 1382,
      startDate: "2022-11-21",
      endDate: "2022-12-18",
      currentMatchday: 1,
      winner: null,
      stages: [],
    },
    teams: [
      {
        area: {
          id: 2072,
          name: "England",
          code: "ENG",
          flag: "https://crests.football-data.org/770.svg",
        },
        id: 57,
        name: "Arsenal FC",
        shortName: "Arsenal",
        tla: "ARS",
        crest: "https://crests.football-data.org/57.svg",
        address: "????",
        website: "http://www.arsenal.com",
        founded: 1900,
        clubColors: "????",
        venue: "The Emirates Stadium",
        runningCompetitions: [],
        coach: {
          id: null,
          firstName: null,
          lastName: null,
          name: null,
          dateOfBirth: null,
          nationality: null,
          contract: {
            start: null,
            until: null,
          },
        },
        marketValue: null,
        squad: [],
        staff: [],
        lastUpdated: "2021-05-22T11:54:30Z",
      },
    ],
  };
};

const competitionsFactory = (): { [key: string]: any } => {
  return {
    filters: {
      season: "2025",
    },
    resultSet: {
      count: 1,
      competitions: "PL",
      first: "2025-08-23",
      last: "2025-08-23",
      played: 0,
      wins: 0,
      draws: 1,
      losses: 0,
    },
    id: 2021,
    name: "Premier League",
    code: "PL",
    type: "LEAGUE",
    emblem: "https://crests.football-data.org/PL.png",
  };
};

const matchResponseFactory = (
  dateFrom: string,
  dateTo: string,
): { [key: string]: any } => {
  return {
    filters: {
      dateFrom: dateFrom,
      dateTo: dateTo,
      permission: "TIER_ONE",
      competitions: "2021",
      limit: 100,
    },
    resultSet: {
      count: 1,
      competitions: "PL",
      first: "2025-08-23",
      last: "2025-08-23",
      played: 0,
      wins: 0,
      draws: 1,
      losses: 0,
    },
    matches: [
      {
        area: {
          id: 2072,
          name: "England",
          code: "ENG",
          flag: "https://crests.football-data.org/770.svg",
        },
        competition: {
          id: 2021,
          name: "Premier League",
          code: "PL",
          type: "LEAGUE",
          emblem: "https://crests.football-data.org/PL.png",
        },
        season: {
          id: 2403,
          startDate: "2025-08-15",
          endDate: "2026-05-24",
          currentMatchday: 1,
          winner: null,
        },
        id: 537797,
        utcDate: "2025-08-23T16:30:00Z",
        status: "TIMED",
        matchday: 2,
        stage: "REGULAR_SEASON",
        group: null,
        lastUpdated: "2025-08-20T20:20:55Z",
        homeTeam: {
          id: 57,
          name: "Arsenal FC",
          shortName: "Arsenal",
          tla: "ARS",
          crest: "https://crests.football-data.org/57.png",
        },
        awayTeam: {
          id: 341,
          name: "Leeds United FC",
          shortName: "Leeds United",
          tla: "LEE",
          crest: "https://crests.football-data.org/341.png",
        },
        score: {
          winner: null,
          duration: "REGULAR",
          fullTime: {
            home: null,
            away: null,
          },
          halfTime: {
            home: null,
            away: null,
          },
        },
        odds: {
          msg: "Activate Odds-Package in User-Panel to retrieve odds.",
        },
        referees: [],
      },
    ],
  };
};

describe("run", () => {
  test("smoke", async () => {
    const competitionTeams = competitionTeamsFactory();
    const competitions = competitionsFactory();
    const fetchFunction = (
      apiEndpoint: string,
      requestOptions: RequestInit,
    ) => {
      if (
        apiEndpoint.startsWith(
          "https://api.football-data.org/v4/competitions/PL/teams?season=",
        )
      ) {
        return {
          ok: true,
          json: () => {
            return competitionTeams;
          },
        };
      } else if (
        apiEndpoint.startsWith(
          "https://api.football-data.org/v4/competitions/PL",
        )
      ) {
        return {
          ok: true,
          json: () => {
            return competitions;
          },
        };
      } else {
        const id_and_path = apiEndpoint.split(
          "https://api.football-data.org/v4/teams/",
        )[1];
        if (id_and_path.match(/^\d+\/matches/)) {
          const url = URL.parse(apiEndpoint)!;
          const dateFrom = url.searchParams.get("dateFrom");
          const dateTo = url.searchParams.get("dateTo");
          return {
            ok: true,
            json: () => {
              return matchResponseFactory(dateFrom!, dateTo!);
            },
          };
        } else {
          throw "unhandled api endpoint:'" + apiEndpoint + "'";
        }
      }
    };
    const data = await getData.run(
      "fake_api_key",
      null,
      fetchFunction,
      () => {},
    );
  });
});
