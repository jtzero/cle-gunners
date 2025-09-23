import { expect, test, describe } from "vitest";
import { buildURL, fetchPremierLeage } from "./competition";

describe("buildURL", () => {
  test("smoke", async () => {
    const leagueCode = "PL";
    const result = buildURL(leagueCode);

    expect(result).toContain(leagueCode);
  });
});

describe("fetchPremierLeage", () => {
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
    const result = await fetchPremierLeage("1234", () => {
      return response;
    });
    expect(result).toEqual(response.json());
  });
});
