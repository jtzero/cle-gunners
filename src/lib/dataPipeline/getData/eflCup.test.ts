import { describe, expect, test } from "vitest";

import {
  buildResultCounts,
  isArsenalTeam,
  normalizeTeamName,
  parseScore,
  resolveWinner,
  seasonLabel,
  toMatch,
  toUtcDate,
  type RoundFixture,
} from "./eflCup";

const arsenalBox = (overrides: Partial<Record<string, string>> = {}) => ({
  date: "24 September 2025",
  time: "20:00 BST",
  score: "0–2",
  team1: "Port Vale (3)",
  team2: "Arsenal (1)",
  ...overrides,
});

describe("normalizeTeamName", () => {
  test("strips bold markup and tier suffix", () => {
    expect(normalizeTeamName("'''Arsenal''' (1)")).toBe("Arsenal");
    expect(normalizeTeamName("Port Vale (3)")).toBe("Port Vale");
  });
});

describe("seasonLabel", () => {
  test("uses the current season while today is within its range", () => {
    expect(seasonLabel(new Date(2026, 0, 15))).toBe("2025–26 EFL Cup");
    expect(seasonLabel(new Date(2026, 2, 10))).toBe("2025–26 EFL Cup");
    expect(seasonLabel(new Date(2025, 11, 1))).toBe("2025–26 EFL Cup");
  });

  test("moves to the next season once the cup range has passed", () => {
    expect(seasonLabel(new Date(2026, 3, 1))).toBe("2026–27 EFL Cup");
    expect(seasonLabel(new Date(2026, 7, 28))).toBe("2026–27 EFL Cup");
  });
});

describe("isArsenalTeam", () => {
  test("matches arsenal regardless of markup or tier", () => {
    expect(isArsenalTeam("'''Arsenal''' (1)")).toBe(true);
    expect(isArsenalTeam("Arsenal (1)")).toBe(true);
    expect(isArsenalTeam("Port Vale (3)")).toBe(false);
  });
});

describe("parseScore", () => {
  test("parses en-dash and hyphen scores", () => {
    expect(parseScore("0–2")).toEqual({
      fullTimeHome: 0,
      fullTimeAway: 2,
    });
    expect(parseScore("2-0")).toEqual({
      fullTimeHome: 2,
      fullTimeAway: 0,
    });
  });

  test("returns null for empty or unparseable scores", () => {
    expect(parseScore(undefined)).toBeNull();
    expect(parseScore("")).toBeNull();
    expect(parseScore("abc")).toBeNull();
  });
});

describe("resolveWinner", () => {
  test("returns home team winner", () => {
    expect(resolveWinner({ fullTimeHome: 2, fullTimeAway: 0 })).toBe(
      "HOME_TEAM",
    );
  });

  test("returns away team winner and null on draw", () => {
    expect(resolveWinner({ fullTimeHome: 0, fullTimeAway: 2 })).toBe(
      "AWAY_TEAM",
    );
    expect(resolveWinner({ fullTimeHome: 1, fullTimeAway: 1 })).toBeNull();
  });

  test("returns null for missing scores", () => {
    expect(resolveWinner(null)).toBeNull();
    expect(
      resolveWinner({ fullTimeHome: null, fullTimeAway: null }),
    ).toBeNull();
  });
});

describe("toUtcDate", () => {
  test("parses date and time into iso string", () => {
    expect(toUtcDate("24 September 2025", "20:00 BST")).toBe(
      "2025-09-24T20:00:00.000Z",
    );
  });

  test("returns null for invalid dates", () => {
    expect(toUtcDate("TBC", "20:00")).toBeNull();
  });
});

describe("toMatch", () => {
  test("maps an arsenal away fixture", () => {
    const match = toMatch({ stage: "Third round", box: arsenalBox() });
    expect(match).not.toBeNull();
    expect(match!.homeTeam.name).toBe("Port Vale");
    expect(match!.awayTeam.name).toBe("Arsenal FC");
    expect(match!.stage).toBe("Third round");
    expect(match!.score.fullTime).toEqual({ home: 0, away: 2 });
    expect(match!.score.winner).toBe("AWAY_TEAM");
  });

  test("returns null for fixtures without arsenal", () => {
    const match = toMatch({
      stage: "Third round",
      box: arsenalBox({
        team1: "Chelsea (1)",
        team2: "Liverpool (1)",
      }),
    });
    expect(match).toBeNull();
  });

  test("returns null for fixtures without a parseable date", () => {
    const match = toMatch({
      stage: "Third round",
      box: { ...arsenalBox(), date: "TBC", time: "TBC" },
    } as RoundFixture);
    expect(match).toBeNull();
  });
});

describe("buildResultCounts", () => {
  test("counts an arsenal win when away", () => {
    const match = toMatch({ stage: "Third round", box: arsenalBox() })!;
    expect(buildResultCounts(match)).toEqual({
      wins: 1,
      draws: 0,
      losses: 0,
    });
  });

  test("counts a draw", () => {
    const match = toMatch({
      stage: "Quarter-finals",
      box: arsenalBox({
        team1: "Arsenal (1)",
        team2: "Crystal Palace (1)",
        score: "1–1",
      }),
    })!;
    expect(buildResultCounts(match)).toEqual({
      wins: 0,
      draws: 1,
      losses: 0,
    });
  });
});
