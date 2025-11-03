import { expect, test, describe } from "vitest";
import { fetchPremierLeague, latestSeason } from "./_competition";

describe("fetchPremierLeague", () => {
  test("smoke", async () => {
    const response = {
      ok: true,
      json: () => {
        return {
          id: 2021,
          name: "Premier League",
          code: "PL",
          type: "LEAGUE",
          emblem: "https://crests.football-data.org/PL.png",
        };
      },
    };
    const result = await fetchPremierLeague("1234", () => {
      return response;
    });
    expect(result).toEqual(response.json());
  });
});

describe("latestSeason", () => {
  test("gets the latest season", async () => {
    const seasons = [
      {
        id: 1,
        startDate: "2025-08-25",
        endDate: "2026-05-24",
        currentMatchday: 12,
        winner: null,
        stages: [],
      },
      {
        id: 2,
        startDate: "2024-08-15",
        endDate: "2025-08-24",
        currentMatchday: 12,
        winner: null,
        stages: [],
      },
    ];
    const expected = seasons.find((season) => season.endDate === "2026-05-24");
    const result = latestSeason({
      seasons: seasons,
    });

    expect(result).toEqual(expected);
  });
});
import { getSeasonYear, seasonYears } from "./_competition";

describe("getSeasonYear", () => {
  const seasons = [
    {
      id: 1,
      startDate: "2025-08-25",
      endDate: "2026-05-24",
      currentMatchday: 12,
      winner: null,
      stages: [],
    },
    {
      id: 2,
      startDate: "2024-08-15",
      endDate: "2025-08-24",
      currentMatchday: 12,
      winner: null,
      stages: [],
    },
  ];
  test("2025-01", async () => {
    const result = getSeasonYear({ seasons: seasons }, new Date("2025-09-10"));

    expect(result).toEqual(2025);
  });
});

describe("seasonYears", () => {
  const seasons = [
    {
      id: 1,
      startDate: "2025-08-25",
      endDate: "2026-05-24",
      currentMatchday: 12,
      winner: null,
      stages: [],
    },
    {
      id: 2,
      startDate: "2024-08-15",
      endDate: "2025-08-24",
      currentMatchday: 12,
      winner: null,
      stages: [],
    },
  ];
  test("2025-01", async () => {
    const result = seasonYears({ seasons: seasons }, new Date("2025-09-10"));

    expect(result).toEqual("2025-2026");
  });
});
