import { expect, test, describe } from "vitest";
import * as json from "./json";
import appRoot from "app-root-path";

describe("stringifyToFile", () => {
  test("smoke", async () => {
    const result = await json.stringifyToFile(
      `${appRoot.path}/tmp/2025-09-04.json`,
      {
        filters: {
          dateFrom: "2025-09-04",
          dateTo: "2025-09-10",
          permission: "TIER_ONE",
          competitions: "2021",
          limit: 100,
        },
        resultSet: {
          count: 0,
        },
        matches: [],
      },
    );
  });
});
