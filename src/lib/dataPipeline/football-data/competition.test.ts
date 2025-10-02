import { expect, test, describe } from "vitest";
import { buildURL, fetchPremierLeague } from "./competition";

describe("buildURL", () => {
  test("smoke", async () => {
    const leagueCode = "PL";
    const result = buildURL(leagueCode);

    expect(result).toContain(leagueCode);
  });
});

describe("fetchPremierLeague", () => {
  test("smoke", async () => {
    const response = {
      ok: true,
      json: async () => {
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
    expect(result).toEqual(await response.json());
  });
});
