import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./competitions.json";

describe("API /api/competitions.json", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return 404 if date is not provided", async () => {
    const request = new Request("http://localhost/api/competitions.json");
    const response = await GET({ request } as any);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({ competitions: [] });
  });

  it("should return competitions for a given date", async () => {
    const mockCompetitions = [
      {
        id: "PL",
        name: "Premier League",
        seasons: [
          {
            startDate: "2024-08-17",
            endDate: "2025-05-25",
          },
        ],
      },
      {
        id: "CL",
        name: "Champions League",
        seasons: [
          {
            startDate: "2024-09-17",
            endDate: "2025-05-31",
          },
        ],
      },
    ];
    const fakeGetCollection = (_: string, filter) => {
      return Promise.resolve(mockCompetitions.filter(filter));
    };

    const request = new Request(
      "http://localhost/api/competitions.json?date=2025-01-01",
    );
    const response = await GET({ request } as any, fakeGetCollection);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.competitions).toHaveLength(2);
    expect(data.competitions.map((c: any) => c.id)).toEqual(
      expect.arrayContaining(["PL", "CL"]),
    );
  });

  it("should return an empty competitions array if no competitions match the date", async () => {
    const mockCompetitions = [
      {
        id: "PL",
        name: "Premier League",
        seasons: [
          {
            startDate: "2024-08-17",
            endDate: "2025-05-25",
          },
        ],
      },
      {
        id: "CL",
        name: "Champions League",
        seasons: [
          {
            startDate: "2024-09-17",
            endDate: "2025-05-31",
          },
        ],
      },
    ];
    const fakeGetCollection = (_: string, filter) => {
      return Promise.resolve(mockCompetitions.filter(filter));
    };

    const request = new Request(
      "http://localhost/api/competitions.json?date=2026-01-01",
    );
    const response = await GET({ request } as any, fakeGetCollection);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.competitions).toEqual([]);
  });
});
