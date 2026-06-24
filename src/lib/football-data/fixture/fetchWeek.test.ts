import { expect, test, describe } from "vitest";
import { fetchWeek, FetchCallError, FetchResponseError } from "./fetchWeek";
import type { FixtureType } from "@/content.types";

const mockFixture: FixtureType = {
  filters: {
    dateFrom: "2025-08-23",
    dateTo: "2025-08-23",
    permission: "TIER_ONE",
    competitions: 2021,
    limit: 100,
  },
  resultSet: {
    count: 1,
    competitions: "PL",
    first: "2025-08-23",
    last: "2025-08-23",
    played: 0,
  },
  matches: [
    {
      area: { id: 2072, name: "England", code: "ENG", flag: "https://crests.football-data.org/770.svg" },
      competition: { id: 2021, name: "Premier League", code: "PL", type: "LEAGUE", emblem: "https://crests.football-data.org/PL.png" },
      season: { id: 2403, startDate: "2025-08-15", endDate: "2026-05-24", currentMatchday: 1, winner: null },
      id: 537797,
      utcDate: "2025-08-23T16:30:00Z",
      status: "TIMED",
      matchday: 2,
      stage: "REGULAR_SEASON",
      group: null,
      lastUpdated: "2025-08-20T20:20:55Z",
      homeTeam: { id: 57, name: "Arsenal FC", shortName: "Arsenal", tla: "ARS", crest: "https://crests.football-data.org/57.png" },
      awayTeam: { id: 341, name: "Leeds United FC", shortName: "Leeds United", tla: "LEE", crest: "https://crests.football-data.org/341.png" },
      score: { winner: null, duration: "REGULAR", fullTime: { home: null, away: null }, halfTime: { home: null, away: null } },
      odds: { msg: "Activate Odds-Package in User-Panel to retrieve odds." },
      referees: [],
    },
  ],
};

describe("fetchWeek", () => {
  test("returns parsed fixture on 200 response", async () => {
    const fetchFn = async () =>
      new Response(JSON.stringify(mockFixture), { status: 200 });
    const result = await fetchWeek(fetchFn, "https://api.football-data.org/v4/matches");
    expect(result).toEqual(mockFixture);
  });

  test("throws FetchCallError when fetch rejects", async () => {
    const networkError = new Error("Network failure");
    const fetchFn = async () => { throw networkError; };
    await expect(fetchWeek(fetchFn, "https://api.football-data.org/v4/matches")).rejects.toThrow(FetchCallError);
    await expect(fetchWeek(fetchFn, "https://api.football-data.org/v4/matches")).rejects.toThrow("Error calling fixtures:");
    await expect(fetchWeek(fetchFn, "https://api.football-data.org/v4/matches")).rejects.toMatchObject({ error: networkError });
  });

  test("throws FetchResponseError on non-200 response", async () => {
    const fetchFn = async () => new Response(null, { status: 500 });
    await expect(fetchWeek(fetchFn, "https://api.football-data.org/v4/matches")).rejects.toThrow(FetchResponseError);
    await expect(fetchWeek(fetchFn, "https://api.football-data.org/v4/matches")).rejects.toThrow("Error in response from API: 500");
  });
});
