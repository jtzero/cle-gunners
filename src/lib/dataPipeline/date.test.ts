import { expect, test, describe } from "vitest";
import * as date from "./date";

describe("getNextWeek", () => {
  test("returns next week", () => {
    const day = new Date("2025-09-04T00:00:00.000Z");
    expect(date.getNextWeek(day)).toStrictEqual(
      new Date("2025-09-11T00:00:00.000Z"),
    );
  });
});

describe("getInTwoWeeks", () => {
  test("returns in two weeks", () => {
    const day = new Date("2025-09-04T00:00:00.000Z");
    expect(date.getInTwoWeeks(day)).toStrictEqual(
      new Date("2025-09-18T00:00:00.000Z"),
    );
  });
});

describe("getTomorrow", () => {
  test("returns tomorrow", () => {
    const day = new Date("2025-09-04T00:00:00.000Z");
    expect(date.getTomorrow(day)).toStrictEqual(
      new Date("2025-09-05T00:00:00.000Z"),
    );
  });
});
