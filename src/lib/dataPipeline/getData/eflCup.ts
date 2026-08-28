import appRoot from "app-root-path";
import { addDays, format, startOfWeek } from "date-fns";
import { pipe, Effect } from "effect";
import wtf from "wtf_wikipedia";

import type { MatchType } from "@/content.types";
import {
  PipelineConfigService,
  type PipelineConfig,
  type PipelineState,
} from "./_pipeline";

import { logStep, writeDataToFileStep } from "./football-data";

export const LEAGUE_CODE = "FLC";

interface EFLPipelineState extends PipelineState {
  page: unknown;
  wikiRows: unknown[];
}

type WikiDocument = ReturnType<typeof wtf>;

export interface EflCupConfig {
  fixtureDir: string;
  fetchPage: (title: string) => Promise<WikiDocument>;
  writeFile: (filePath: string, data: unknown) => Promise<void>;
}

export interface RoundFixture {
  stage: string;
  box: Record<string, string>;
}

const ROUNDS = [
  "Preliminary round",
  "First round",
  "Second round",
  "Third round",
  "Fourth round",
  "Quarter-finals",
  "Semi-finals",
  "Final",
] as const;

export const normalizeTeamName = (name: string): string =>
  name
    .replace(/'''/g, "")
    .replace(/\s*\(\d+\)\s*$/, "")
    .trim();

export const parseScore = (
  score: string | undefined,
): { fullTimeHome: number | null; fullTimeAway: number | null } | null => {
  if (!score || !score.trim()) {
    return null;
  }
  const parts = score.split(/[–-]/);
  if (parts.length !== 2) {
    return null;
  }
  const home = Number(parts[0].trim());
  const away = Number(parts[1].trim());
  if (Number.isNaN(home) || Number.isNaN(away)) {
    return null;
  }
  return { fullTimeHome: home, fullTimeAway: away };
};

export const toUtcDate = (date: string, time: string): string | null => {
  const timeMatch = time.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!timeMatch) {
    return null;
  }
  const parsed = new Date(`${date} ${timeMatch[1]}:${timeMatch[2]} UTC`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
};

const startYearFor = (today: Date): number =>
  today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;

export const seasonLabel = (today: Date = new Date()): string => {
  const startYear = startYearFor(today);
  return `${startYear}–${String(startYear + 1).slice(2)} EFL Cup`;
};

const eflCupSeason = (today: Date = new Date()) => {
  const startYear = startYearFor(today);
  return {
    id: 2483,
    startDate: `${startYear}-08-05`,
    endDate: `${startYear + 1}-03-15`,
  };
};

const buildTeam = (
  name: string,
  id: number,
  crest: string,
): MatchType["homeTeam"] => ({
  id,
  name,
  shortName: name,
  tla: "N/A",
  crest,
});

const ARSENAL_TEAM = buildTeam(
  "Arsenal FC",
  57,
  "https://crests.football-data.org/57.png",
);

const buildCompetition = (): MatchType["competition"] => ({
  id: 2483,
  name: "EFL Cup",
  code: LEAGUE_CODE,
  type: "CUP",
  emblem: "https://crests.football-data.org/EFLC.png",
});

export const resolveWinner = (
  scores: { fullTimeHome: number | null; fullTimeAway: number | null } | null,
): string | null => {
  if (!scores || scores.fullTimeHome === null || scores.fullTimeAway === null) {
    return null;
  }
  if (scores.fullTimeHome === scores.fullTimeAway) {
    return null;
  }
  return scores.fullTimeHome > scores.fullTimeAway ? "HOME_TEAM" : "AWAY_TEAM";
};

const isArsenalTeam = (name: string): boolean =>
  name.toLowerCase().includes("arsenal");

export const toFixture = (wikiRow: RoundFixture): MatchType | null => {
  const { stage, box } = wikiRow;
  const homeTeam = box.team1;
  const awayTeam = box.team2;
  const utcDate = toUtcDate(box.date, box.time);
  const scores = parseScore(box.score);
  const home = normalizeTeamName(homeTeam);
  const away = normalizeTeamName(awayTeam);
  const arsenalAtHome = isArsenalTeam(homeTeam);
  const arsenalAway = isArsenalTeam(awayTeam);
  const winner = resolveWinner(scores);
  const season = eflCupSeason();
  return {
    area: {
      id: 2072,
      name: "UK",
      code: "UK",
      flag: "https://thumb.wikimedia.org/wikipedia/en/thumb/0/0c/EFL_%28Carabao%29_Cup_Logo.svg/500px-EFL_%28Carabao%29_Cup_Logo.svg.png",
    },
    competition: buildCompetition(),
    season: {
      id: season.id,
      startDate: season.startDate,
      endDate: season.endDate,
      currentMatchday: null,
      winner: null,
    },
    id: 0,
    utcDate,
    status: scores ? "FINISHED" : "TIMED",
    matchday: 0,
    stage,
    group: null,
    lastUpdated: new Date().toISOString(),
    homeTeam: arsenalAtHome
      ? ARSENAL_TEAM
      : buildTeam(
          home,
          0,
          "https://upload.wikimedia.org/wikipedia/en/placeholder.png",
        ),
    awayTeam: arsenalAway
      ? ARSENAL_TEAM
      : buildTeam(
          away,
          0,
          "https://upload.wikimedia.org/wikipedia/en/placeholder.png",
        ),
    score: {
      winner,
      duration: "REGULAR",
      fullTime: {
        home: scores ? scores.fullTimeHome : null,
        away: scores ? scores.fullTimeAway : null,
      },
      halfTime: {
        home: null,
        away: null,
      },
    },
    referees: [],
  };
};

const fetchEflCupPage = async (title: string): Promise<WikiDocument> => {
  const doc = await wtf.fetch(title);
  if (!doc || !doc.wikitext) {
    throw new Error(`Failed to fetch EFL Cup page: ${title}`);
  }
  return doc;
};

export const fetchPageStep = (state: EFLPipelineState) =>
  Effect.gen(function* () {
    const eflConfig = defaultConfig();
    const doc = yield* Effect.promise(() =>
      eflConfig.fetchPage(state.wikiTitle),
    );
    return yield* Effect.succeed({ ...state, page: doc });
  });

export const fetchWikiRowsStep = (state: EFLPipelineState) =>
  Effect.gen(function* () {
    const wikiRows: RoundFixture[] = [];
    for (const roundName of ROUNDS) {
      const section = state.page.section(roundName);
      if (!section || typeof section.templates !== "function") {
        continue;
      }
      const boxes = section.templates("Football box collapsible") as Array<{
        json: () => Record<string, string>;
      }>;
      for (const box of boxes) {
        wikiRows.push({ stage: roundName, box: box.json() });
      }
    }
    const nxtState = { ...state, wikiRows };
    return yield* Effect.succeed(nxtState);
  });

// TODO centralize with github action
const WEEK_STARTS_ON = 4;

const windowBounds = (from: Date): Date[] => {
  const thisWeek = startOfWeek(from, { weekStartsOn: WEEK_STARTS_ON });
  return [thisWeek, addDays(thisWeek, 14)];
};

const isWithinWindow = (match: MatchType, bounds: Date[]): boolean => {
  const matchDate = new Date(match.utcDate);
  return matchDate >= bounds[0] && matchDate < bounds[1];
};

const wikiRowIsArsenal = (row: RoundFixture): boolean => {
  const team1 = row.box.team1;
  const team2 = row.box.team2;
  return Boolean(isArsenalTeam(team1) || isArsenalTeam(team2));
};

export const toFixturesStep = (state: EFLPipelineState) => {
  const bounds = windowBounds(state.startDate);
  const fixtures = state.wikiRows
    // TODO
    //.filter((match) => isWithinWindow(match, bounds))
    .filter(wikiRowIsArsenal)
    .map(toFixture)
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate));
  return Effect.succeed({ ...state, fixtures });
};

const isWithinWeek = (match: MatchType, weekStart: Date): boolean => {
  const matchDate = new Date(match.utcDate);
  return matchDate >= weekStart && matchDate < addDays(weekStart, 7);
};

export const writeFixturesStep = (state: EFLPipelineState) =>
  Effect.gen(function* () {
    const eflConfig = defaultConfig();
    state.fixtures.sort((a, b) => a.utcDate.localeCompare(b.utcDate));
    // TODO unlikely there will be more than one in a week, buuut
    for (const fixture of state.fixtures) {
      const weekKey = format(fixture.utcDate, "yyyy-MM-dd");
      const filePath = `${eflConfig.fixtureDir}/${weekKey}.json`;
      const payload = buildWeekPayload(weekKey, [fixture]);
      yield* Effect.promise(() => eflConfig.writeFile(filePath, payload));
      yield* Effect.log(`Wrote EFL fixtures: ${filePath}`);
    }
    return state;
  });

const buildWeekPayload = (weekKey: string, matches: MatchType[]) => {
  const dateTo = matches[matches.length - 1].utcDate.slice(0, 10);
  return {
    filters: {
      dateFrom: weekKey,
      dateTo,
    },
    resultSet: buildWeekResultSet(matches),
    matches,
  };
};

const buildWeekResultSet = (matches: MatchType[]) => {
  const counts = matches.map(buildResultCounts).reduce(
    (acc, count) => ({
      wins: acc.wins + count.wins,
      draws: acc.draws + count.draws,
      losses: acc.losses + count.losses,
    }),
    { wins: 0, draws: 0, losses: 0 },
  );
  return {
    count: matches.length,
    competitions: "EFLC",
    first: matches[0].utcDate.slice(0, 10),
    last: matches[matches.length - 1].utcDate.slice(0, 10),
    played: matches.filter((match) => match.status === "FINISHED").length,
    wins: counts.wins,
    draws: counts.draws,
    losses: counts.losses,
  };
};

interface ResultCounts {
  wins: number;
  draws: number;
  losses: number;
}

export const buildResultCounts = (match: MatchType): ResultCounts => {
  if (match.status !== "FINISHED") {
    return { wins: 0, draws: 0, losses: 0 };
  }
  const arsenalIsHome = match.homeTeam.name === "Arsenal FC";
  const arsenalGoals = arsenalIsHome
    ? match.score.fullTime.home
    : match.score.fullTime.away;
  const opponentGoals = arsenalIsHome
    ? match.score.fullTime.away
    : match.score.fullTime.home;
  if (arsenalGoals === null || opponentGoals === null) {
    return { wins: 0, draws: 0, losses: 0 };
  }
  if (arsenalGoals > opponentGoals) {
    return { wins: 1, draws: 0, losses: 0 };
  }
  if (arsenalGoals === opponentGoals) {
    return { wins: 0, draws: 1, losses: 0 };
  }
  return { wins: 0, draws: 0, losses: 1 };
};

export const steps = (
  initialState: EFLPipelineState,
): Effect.Effect<never, PipelineConfigService> => {
  return pipe(
    Effect.succeed({ ...initialState, competitionDatum: { code: "FLC" } }),
    Effect.andThen(
      logStep("Starting EFL pipeline...", (s: EFLPipelineState) => s.wikiTitle),
    ),
    Effect.andThen(fetchPageStep),
    Effect.andThen(fetchWikiRowsStep),
    Effect.andThen(toFixturesStep),
    // Effect.forEach
    Effect.andThen(writeFixturesStep),
  );
};

export const defaultConfig = (): EflCupConfig => ({
  fixtureDir: `${appRoot.path}/src/content/fixtures/efl`,
  fetchPage: fetchEflCupPage,
  writeFile: async (filePath, data) => {
    const { mkdir, writeFile: write } = await import("node:fs/promises");
    const { dirname } = await import("node:path");
    await mkdir(dirname(filePath), { recursive: true });
    await write(filePath, JSON.stringify(data, null, 2), "utf-8");
  },
});
