import { expect, test, describe } from "vitest";
import { getSeasonYear, seasonYears } from "./index";

describe("getSeasonYear", () => {
  test("2025-01", async () => {
    const result = getSeasonYear(2025, 1);

    expect(result).toEqual(2024);
  });
  test("2025-05", async () => {
    const result = getSeasonYear(2025, 5);

    expect(result).toEqual(2024);
  });
  test("2025-06", async () => {
    const result = getSeasonYear(2025, 6);

    expect(result).toEqual(2025);
  });
});

describe("seasonYears", () => {
  test("2025-01", async () => {
    const result = seasonYears(2025, 1);

    expect(result).toEqual("2024-2025");
  });
  test("2025-08", async () => {
    const result = seasonYears(2025, 8);

    expect(result).toEqual("2025-2026");
  });
});
