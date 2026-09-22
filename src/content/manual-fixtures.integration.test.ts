import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { z } from "zod";

import { manualFixturesSchema, type ManualFixturesType } from "@/content.types";

const isIsoDate = (value: string): boolean => z.iso.date().safeParse(value).success;

const fixturesDir = fileURLToPath(
  new URL("./manual-fixtures", import.meta.url),
);

const fixtureFileNames = async (): Promise<string[]> => {
  const files = (await readdir(fixturesDir, { recursive: true })).filter(
    (name) => name.endsWith(".json"),
  );
  return files.sort();
};

const loadManualFixtures = async (): Promise<ManualFixturesType[]> => {
  const fixtures: ManualFixturesType[] = [];
  for (const file of await fixtureFileNames()) {
    const raw = await readFile(`${fixturesDir}/${file}`, "utf8");
    fixtures.push(manualFixturesSchema.parse(JSON.parse(raw)));
  }
  return fixtures;
};

const referencedImageUrls = (fixture: ManualFixturesType): string[] => {
  const urls: string[] = [];
  for (const match of fixture.matches) {
    urls.push(match.area.flag, match.competition.emblem);
    urls.push(match.homeTeam.crest, match.awayTeam.crest);
  }
  return urls;
};

const knownBrokenImageUrls = new Set([
  "https://crests.football-data.org/FAC.png",
  "https://crests.football-data.org/CARABAO_CUP.png",
]);

test("each manual fixture file is a valid, parseable JSON document", async () => {
  const files = await fixtureFileNames();

  expect(files.length).toBeGreaterThan(0);

  for (const file of files) {
    const raw = await readFile(`${fixturesDir}/${file}`, "utf8");
    expect(() => JSON.parse(raw), `${file} must be valid JSON`).not.toThrow();
  }
});

test("each manual fixture filename is a valid date that ids the API route", async () => {
  const files = await fixtureFileNames();

  for (const file of files) {
    const date = file.replace(/\.json$/, "");
    expect(isIsoDate(date), `${file} must be named by a valid date`).toBe(true);
    expect(date.length).toBe(10);
  }
});

test("each manual fixture conforms to the content collection schema", async () => {
  const fixtures = await loadManualFixtures();

  expect(fixtures.length).toBeGreaterThan(0);
});

test("each manual fixture's match count agrees with its declared result set", async () => {
  const files = await fixtureFileNames();

  for (const file of files) {
    const raw = await readFile(`${fixturesDir}/${file}`, "utf8");
    const fixture = JSON.parse(raw) as {
      resultSet: { count?: number };
      matches?: unknown[];
    };

    if (typeof fixture.resultSet?.count === "number") {
      expect(
        fixture.matches?.length,
        `${file}: resultSet.count must match the matches array length`,
      ).toBe(fixture.resultSet.count);
    }
  }
});

test("every referenced image URL is reachable", async () => {
  const fixtures = await loadManualFixtures();

  const urls = new Set(
    fixtures
      .flatMap(referencedImageUrls)
      .filter((url) => !knownBrokenImageUrls.has(url)),
  );
  expect(urls.size).toBeGreaterThan(0);

  const checkUrlReachability = async (url: string, maxRetries = 2) => {
    let attempts = 0;

    while (attempts <= maxRetries) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "ImageReachabilityTest/1.0 (Automated Test Suite)",
          },
          signal: AbortSignal.timeout(15_000),
        });

        if ((response.status === 429 || response.status === 503) && response.headers.has("Retry-After") && attempts < maxRetries) {
          const retryAfter = response.headers.get("Retry-After");
          let waitMs = 1000;

          if (retryAfter) {
            const seconds = Number(retryAfter);
            if (!isNaN(seconds)) {
              waitMs = seconds * 1000;
            } else {
              const parsedDate = Date.parse(retryAfter);
              if (!isNaN(parsedDate)) {
                waitMs = Math.max(0, parsedDate - Date.now());
              }
            }
          }

          attempts++;
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }

        return { url, reachable: response.ok, detail: response.statusText || String(response.status) };
      } catch (error) {
        if (attempts >= maxRetries) {
          const message = error instanceof Error ? error.message : String(error);
          return { url, reachable: false, detail: message };
        }
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
      }
    }

    return { url, reachable: false, detail: "Max retries exceeded due to rate-limiting" };
  };

  const results = await Promise.all([...urls].map((url) => checkUrlReachability(url)));
  const unreachable = results.filter((result) => !result.reachable);
  const unreachableReport = unreachable.map(
    (result) => `${result.url} (${result.detail})`,
  );

  expect(unreachableReport).toEqual([]);
});
