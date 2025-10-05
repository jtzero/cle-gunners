import { expect, test, describe } from "vitest";
import { fetchArsenalID } from "./team";

describe("fetchArsenalID", () => {
  test("smoke", async () => {
    const response = {
      ok: true,
      json: async () => {
        return {
          id: 1234,
          teams: [
            {
              id: 2021,
              name: "Arsenal",
              shortName: "Arsenal",
              code: "ARS",
            },
          ],
        };
      },
    };
    const id = await fetchArsenalID("1234", 2025, () => {
      return response;
    });
    expect(id).toBe(2021);
  });
});
