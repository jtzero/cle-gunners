import { describe, it, expect, vi } from "vitest";
import {
  getFACupSeasonString,
  getFACupFullSeasonString,
  getFACupSeasonInfo,
  getFACupArticleTitle,
  buildWikipediaApiUrl,
  cleanWikitext,
  parseFACupFixtures,
  fetchFACupPage,
  getFACupFixturesForYear,
} from "./faCup";

describe("Wikipedia FA Cup Pipeline", () => {
  describe("Season string formatting", () => {
    it("should format season string for 2026 to 2026–27", () => {
      expect(getFACupSeasonString(2026)).toBe("2026–27");
    });

    it("should format season string for 2025 to 2025–26", () => {
      expect(getFACupSeasonString(2025)).toBe("2025–26");
    });

    it("should format century turn year 1999 to 1999–2000", () => {
      expect(getFACupSeasonString(1999)).toBe("1999–2000");
    });

    it("should format year 2000 to 2000–01", () => {
      expect(getFACupSeasonString(2000)).toBe("2000–01");
    });

    it("should format full season string for 2026 to 2026-2027", () => {
      expect(getFACupFullSeasonString(2026)).toBe("2026-2027");
    });

    it("should return complete season info for 2026", () => {
      const info = getFACupSeasonInfo(2026);
      expect(info).toEqual({
        year: 2026,
        seasonString: "2026–27",
        fullSeasonString: "2026-2027",
        articleTitle: "2026–27 FA Cup",
      });
    });

    it("should get Wikipedia article title for 2026", () => {
      expect(getFACupArticleTitle(2026)).toBe("2026–27 FA Cup");
    });
  });

  describe("API URL generation", () => {
    it("should build valid Wikipedia API URL", () => {
      const url = buildWikipediaApiUrl("2026–27 FA Cup");
      expect(url).toContain("action=parse");
      expect(url).toContain("page=2026%E2%80%9327%20FA%20Cup");
      expect(url).toContain("format=json");
    });
  });

  describe("Wikitext cleaning", () => {
    it("should clean wiki links and formatting", () => {
      const raw = "'''[[Arsenal F.C.|Arsenal]] (1)'''";
      expect(cleanWikitext(raw)).toBe("Arsenal");
    });

    it("should remove HTML comments and inline templates", () => {
      const raw = "12 January 2026 <!-- comment --> {{goal|63}}";
      expect(cleanWikitext(raw)).toBe("12 January 2026");
    });
  });

  describe("Fixture parsing", () => {
    it("should parse football box templates into fixture objects", () => {
      const wikitext = `
{{Football box collapsible
|date=12 January 2026
|time=15:00 [[Greenwich Mean Time|GMT]]
|score=2–1
|team1='''[[Arsenal F.C.|Arsenal]] (1)'''
|team2=[[Chelsea F.C.|Chelsea]] (1)
|stadium=[[Emirates Stadium]]
|location=[[London]]
|attendance=60,000
|referee=[[Michael Oliver]]
}}
      `;

      const fixtures = parseFACupFixtures(wikitext);
      expect(fixtures).toHaveLength(1);
      expect(fixtures[0]).toEqual({
        homeTeam: "Arsenal",
        awayTeam: "Chelsea",
        date: "12 January 2026",
        time: "15:00 GMT",
        score: "2–1",
        stadium: "Emirates Stadium",
        location: "London",
        attendance: "60,000",
        referee: "Michael Oliver",
      });
    });
  });

  describe("Wikipedia API Fetching", () => {
    it("should fetch FA Cup page data using custom fetchFunction", async () => {
      const mockWikitext = `
{{Football box collapsible
|date=10 January 2027
|time=15:00 GMT
|score=3–0
|team1=[[Arsenal F.C.|Arsenal]] (1)
|team2=[[Portsmouth F.C.|Portsmouth]] (2)
|stadium=[[Emirates Stadium]]
}}
      `;

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          parse: {
            title: "2026–27 FA Cup",
            pageid: 12345,
            wikitext: { "*": mockWikitext },
          },
        }),
      });

      const pageData = await fetchFACupPage(2026, mockFetch);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("2026%E2%80%9327%20FA%20Cup")
      );
      expect(pageData.parse?.title).toBe("2026–27 FA Cup");
    });

    it("should get FA Cup fixtures for year 2026 (2026-2027 season)", async () => {
      const mockWikitext = `
{{Football box collapsible
|date=10 January 2027
|time=15:00 GMT
|score=2–0
|team1=[[Arsenal F.C.|Arsenal]] (1)
|team2=[[Everton F.C.|Everton]] (1)
|stadium=[[Emirates Stadium]]
}}
      `;

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          parse: {
            title: "2026–27 FA Cup",
            wikitext: { "*": mockWikitext },
          },
        }),
      });

      const result = await getFACupFixturesForYear(2026, mockFetch);

      expect(result.season.year).toBe(2026);
      expect(result.season.seasonString).toBe("2026–27");
      expect(result.season.fullSeasonString).toBe("2026-2027");
      expect(result.pageTitle).toBe("2026–27 FA Cup");
      expect(result.fixtures).toHaveLength(1);
      expect(result.fixtures[0].homeTeam).toBe("Arsenal");
      expect(result.fixtures[0].awayTeam).toBe("Everton");
      expect(result.fixtures[0].score).toBe("2–0");
    });

    it("should throw error if Wikipedia API returns error", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          error: {
            code: "missingtitle",
            info: "The page specified does not exist.",
          },
        }),
      });

      await expect(getFACupFixturesForYear(2099, mockFetch)).rejects.toThrow(
        "Failed to fetch Wikipedia FA Cup page for 2099: The page specified does not exist."
      );
    });
  });
});
