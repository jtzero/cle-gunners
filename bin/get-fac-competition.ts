import appRoot from "app-root-path";
import { basename } from "node:path";
import { Effect } from "effect";

import {
  getFACupFixturesForYear,
  type FACupFixturesResult,
} from "@/lib/dataPipeline/wikipedia";
import type { Competition, Season } from "@/lib/dataPipeline/types";
import { stringifyToFile } from "@/lib/dataPipeline/json";

const MONTH_INDEX_BY_NAME: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

export const competitionId = 2013;

export const parseWikipediaDate = (value: string): Date | null => {
  const match = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const day = Number(match[1]);
  const month = MONTH_INDEX_BY_NAME[match[2].toLowerCase()];
  const year = Number(match[3]);
  if (month === undefined) {
    return null;
  }
  return new Date(Date.UTC(year, month, day));
};

export const toISODate = (date: Date): string => date.toISOString().slice(0, 10);

export interface GetFACupCompetitionDependencies {
  getFACupFixturesForYear: (
    startYear: number,
  ) => Promise<FACupFixturesResult>;
  stringifyToFile: (filePath: string, data: unknown) => Promise<void>;
  competitionId: number;
  log: (...messages: unknown[]) => void;
  logError: (...messages: unknown[]) => void;
}

export interface GetFACupCompetitionInput {
  cliArguments: Array<string>;
  currentYear?: number;
}

export const defaultDependencies: GetFACupCompetitionDependencies = {
  getFACupFixturesForYear: (startYear: number): Promise<FACupFixturesResult> =>
    Effect.runPromise(getFACupFixturesForYear(startYear)),
  stringifyToFile,
  competitionId,
  log: (...messages: unknown[]): void => console.log(...messages),
  logError: (...messages: unknown[]): void => console.error(...messages),
};

interface SeasonDerivationFailure {
  startYear: number;
  message: string;
}

const deriveSeasonFromFixtures = (
  fixtures: FACupFixturesResult["fixtures"],
): Season | null => {
  const dates = fixtures
    .map((fixture) => parseWikipediaDate(fixture.date))
    .filter((date: Date | null): date is Date => date !== null);
  if (dates.length === 0) {
    return null;
  }
  const startTimes = dates.map((date: Date) => date.getTime());
  return {
    startDate: toISODate(new Date(Math.min(...startTimes))),
    endDate: toISODate(new Date(Math.max(...startTimes))),
  };
};

const resolveYearRange = (
  input: GetFACupCompetitionInput,
): { startYear: number; endYear: number } => {
  const currentYear = input.currentYear ?? new Date().getFullYear();
  const [startYearArgument, endYearArgument] = input.cliArguments;
  const startYear = startYearArgument ? Number(startYearArgument) : currentYear - 2;
  const endYear = endYearArgument ? Number(endYearArgument) : currentYear;
  if (!Number.isInteger(startYear) || !Number.isInteger(endYear)) {
    throw new Error("Year arguments must be integers.");
  }
  if (startYear > endYear) {
    throw new Error("Start year must not be after end year.");
  }
  return { startYear, endYear };
};

const fetchSeasonForYear = async (
  dependencies: GetFACupCompetitionDependencies,
  startYear: number,
): Promise<Season> => {
  dependencies.log(`Fetching FA Cup ${startYear} season from Wikipedia...`);
  const { pageTitle, fixtures } =
    await dependencies.getFACupFixturesForYear(startYear);
  const season = deriveSeasonFromFixtures(fixtures);
  if (!season) {
    throw new Error(`No dated fixtures found on "${pageTitle}"`);
  }
  dependencies.log(
    `FA Cup ${startYear}: ${fixtures.length} fixtures span ${season.startDate} → ${season.endDate}`,
  );
  return season;
};

export const fetchFACup = async (
  dependencies: GetFACupCompetitionDependencies,
  input: GetFACupCompetitionInput,
): Promise<Competition> => {
  const { startYear, endYear } = resolveYearRange(input);
  const seasons: Array<Season> = [];
  const failures: Array<SeasonDerivationFailure> = [];
  for (let startYearIterator = startYear; startYearIterator <= endYear; startYearIterator++) {
    try {
      const season = await fetchSeasonForYear(dependencies, startYearIterator);
      seasons.push(season);
    } catch (error) {
      failures.push({
        startYear: startYearIterator,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
  if (failures.length > 0) {
    for (const failure of failures) {
      dependencies.logError(
        `Failed to derive FA Cup ${failure.startYear} season:`,
        failure.message,
      );
    }
    throw new Error("Failed to derive one or more FA Cup seasons");
  }
  const sortedSeasons = [...seasons].sort(
    (seasonA: Season, seasonB: Season) =>
      new Date(seasonA.startDate).getTime() -
      new Date(seasonB.startDate).getTime(),
  );
  return {
    id: dependencies.competitionId,
    seasons: sortedSeasons,
  };
};

export const runGetFACupCompetition = async (
  dependencies: GetFACupCompetitionDependencies,
  input: GetFACupCompetitionInput,
): Promise<number> => {
  try {
    const { startYear, endYear } = resolveYearRange(input);
    const seasons: Array<Season> = [];
    const failures: Array<SeasonDerivationFailure> = [];
    for (let startYearIterator = startYear; startYearIterator <= endYear; startYearIterator++) {
      try {
        seasons.push(
          await fetchSeasonForYear(dependencies, startYearIterator),
        );
      } catch (error) {
        failures.push({
          startYear: startYearIterator,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
    if (failures.length > 0) {
      for (const failure of failures) {
        dependencies.logError(
          `Failed to derive FA Cup ${failure.startYear} season:`,
          failure.message,
        );
      }
      return 1;
    }
    const sortedSeasons = [...seasons].sort(
      (seasonA: Season, seasonB: Season) =>
        new Date(seasonA.startDate).getTime() -
        new Date(seasonB.startDate).getTime(),
    );
    const competition: Competition = {
      id: dependencies.competitionId,
      seasons: sortedSeasons,
    };
    const filePath = `${appRoot.path}/src/content/competitions/wikipedia/fac.json`;
    await dependencies.stringifyToFile(filePath, competition);
    dependencies.log(
      `Wrote ${sortedSeasons.length} FA Cup seasons to ${filePath}`,
    );
    return 0;
  } catch (error) {
    dependencies.logError("Error fetching FA Cup data:", error);
    return 1;
  }
};

const loadDotEnvIfAvailable = async (): Promise<void> => {
  try {
    const dotenv = await import("dotenv");
    dotenv.config();
  } catch {}
};

const isInvokedAsScript = (): boolean => {
  const invokedScript = process.argv[1];
  if (!invokedScript) {
    return false;
  }
  return basename(invokedScript) === basename(import.meta.url);
};

if (isInvokedAsScript()) {
  await loadDotEnvIfAvailable();
  const exitCode = await runGetFACupCompetition(defaultDependencies, {
    cliArguments: process.argv.slice(2),
  });
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}
