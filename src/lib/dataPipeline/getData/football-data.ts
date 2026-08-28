import * as fs from "fs";
import { formatInTimeZone } from "date-fns-tz";
import appRoot from "app-root-path";
import { startOfWeek } from "date-fns";
import { Effect } from "effect";
import * as date from "../date";
import {
  team,
  competition,
  type Competition,
  type Season,
} from "../football-data";
import { PipelineConfigService, type PipelineState } from "./_pipeline";

export const buildRequestURL = (state: PipelineState) => {
  const { leagueID, startDate, endDate, teamID, seasonYear } = state;
  const startDateStr = formatInTimeZone(startDate, "UTC", "yyyy-MM-dd");
  const endDateStr = formatInTimeZone(endDate, "UTC", "yyyy-MM-dd");

  const requestURL = competition.buildRequestURL(
    teamID!,
    leagueID!,
    seasonYear!,
    startDateStr,
    endDateStr,
  );
  return Effect.succeed({ ...state, firstRoundRequestURL: requestURL });
};

export const buildSecondRoundRequestURL = (state: PipelineState) => {
  const { leagueID, endDate, teamID, secondRoundSeasonYear } = state;
  const startDateStr = formatInTimeZone(endDate, "UTC", "yyyy-MM-dd");
  const endDateStr = formatInTimeZone(
    date.getNextWeek(endDate),
    "UTC",
    "yyyy-MM-dd",
  );
  const requestURL = competition.buildRequestURL(
    teamID!,
    leagueID!,
    secondRoundSeasonYear!,
    startDateStr,
    endDateStr,
  );
  return Effect.succeed({ ...state, secondRoundRequestURL: requestURL });
};

const jsonFromFile = (filePath: string): Competition | null => {
  let comp = null;
  if (fs.existsSync(filePath)) {
    comp = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }
  return comp;
};

const isRequestedEndDateAfterEndDateOfSeason = (
  season: Season,
  requestedDate: Date,
): boolean => new Date(season.endDate).getTime() >= requestedDate.getTime();

export const readCompetitionFromCache =
  (filePath: string, latestDate: Date) => (state: PipelineState) => {
    const comp = jsonFromFile(filePath);
    const latestSeason = comp ? competition.latestSeason(comp) : null;
    if (
      comp &&
      latestSeason &&
      isRequestedEndDateAfterEndDateOfSeason(latestSeason, latestDate)
    ) {
      return Effect.succeed({ ...state, competitionDatum: comp });
    }
    return Effect.fail({ ...state, competitionDatum: comp });
  };

export const logStep =
  (message: string, reference: CallableFunction | undefined = undefined) =>
  (state: PipelineState) =>
    Effect.gen(function* () {
      const config = yield* PipelineConfigService;
      if (reference) {
        config.logger.log(message, reference(state));
      } else {
        config.logger.log(message);
      }
      return state;
    });

export const fetchCompetitionStep =
  (filePath: string, fetchFunction: CallableFunction) =>
  (state: PipelineState) =>
    Effect.gen(function* () {
      const config = yield* PipelineConfigService;

      const comp = jsonFromFile(filePath);
      const latestSeason = comp ? competition.latestSeason(comp) : null;
      if (
        comp &&
        latestSeason &&
        isRequestedEndDateAfterEndDateOfSeason(
          latestSeason,
          state.secondRoundStartDate,
        )
      ) {
        return yield* Effect.succeed({
          ...state,
          competitionDatum: comp,
          leagueID: comp.id.toString(),
        });
      } else {
        const competitionDatum = yield* Effect.promise(() => {
          return fetchFunction(config.apiKey, config.fetchFunction);
        });
        config.writeDataToFileFunction(filePath, competitionDatum);
        return yield* Effect.succeed({
          ...state,
          competitionDatum,
          leagueID: competitionDatum.id.toString(),
        });
      }
    });

export const setSeasonYear = (state: PipelineState) => {
  const seasonYearOrError = competition.getSeasonYear(
    state.competitionDatum!,
    state.startDate,
  );
  if (seasonYearOrError instanceof competition.NoSeasonFoundError) {
    return Effect.succeed({ ...state, errors: seasonYearOrError });
  }
  return Effect.succeed({ ...state, seasonYear: seasonYearOrError });
};

export const getSeasonStep = (state: PipelineState) =>
  Effect.gen(function* () {
    const config = yield* PipelineConfigService;
    if (state.seasonYear instanceof competition.NoSeasonFoundError) {
      config.logger.log(
        `No season matched for ${state.startDate}, ${state.endDate}, checking future season`,
      );
      const futureSeason = competition.getFutureSeason(
        state.competitionDatum!,
        state.endDate,
      );
      if (futureSeason instanceof competition.NoSeasonFoundError) {
        config.logger.log(`No future season found for ${state.endDate}`);
        return yield* Effect.fail(state);
      }
      const futureStartDate = startOfWeek(futureSeason.startDate, {
        weekStartsOn: 4,
      });
      const futureSeasonYear = new Date(futureStartDate).getFullYear();
      const futureEndDate = date.getNextWeek(futureStartDate);
      config.logger.log(
        "checking: ",
        config.startDateArg,
        futureStartDate,
        futureEndDate,
      );
      return yield* Effect.succeed({
        ...state,
        isFutureSeason: true,
        startDate: futureStartDate,
        endDate: futureEndDate,
        seasonYear: futureSeasonYear,
      });
    }
    config.logger.log(
      config.startDateArg,
      state.startDate,
      state.endDate,
      state.startDate.getMonth(),
    );
    return yield* Effect.succeed({ ...state });
  });

export const setSecondRoundSeasonYear = (state: PipelineState) => {
  const seasonYearOrError = competition.getSeasonYear(
    state.competitionDatum!,
    state.secondRoundStartDate,
  );
  if (seasonYearOrError instanceof competition.NoSeasonFoundError) {
    return Effect.fail({ ...state, errors: seasonYearOrError });
  }
  return Effect.succeed({ ...state, secondRoundSeasonYear: seasonYearOrError });
};

export const logNoSeasonFoundError = (state: PipelineState) =>
  Effect.gen(function* () {
    const config = yield* PipelineConfigService;
    config.logger.log(
      `No season matched for ${state.secondRoundStartDate}, ${state.secondRoundEndDate}`,
    );
    return yield* Effect.fail(state);
  });

export const fetchArsenalIDStep = (state: PipelineState) =>
  Effect.gen(function* () {
    const config = yield* PipelineConfigService;
    const teamID = yield* Effect.promise(() =>
      team.fetchArsenalID(
        config.apiKey,
        state.seasonYear!,
        config.fetchFunction,
      ),
    );
    return yield* Effect.succeed({ ...state, teamID });
  });

export interface FixtureResponse {
  filters: {
    dateFrom: string;
    dateTo: string;
    permission: string;
    competitions: string;
    limit: number;
  };
  resultSet: {
    count: number;
  };
  matches: unknown[];
}

export const fetchArsenalFixtures = async (
  api_key: string,
  requestURL: string,
  fetchFunction: Function,
): Promise<FixtureResponse> => {
  const headers = new Headers();
  headers.append("X-Auth-Token", api_key);

  const requestOptions: RequestInit = {
    method: "GET",
    headers: headers,
    redirect: "follow",
  };

  const api_endpoint = requestURL;
  const response = await fetchFunction(api_endpoint, requestOptions);

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `HTTP error! response status:${response.status}: ${data.Message}`,
    );
  }
  return data;
};

export const fetchFirstRoundStep = (state: PipelineState) =>
  Effect.gen(function* () {
    const config = yield* PipelineConfigService;
    const data = yield* Effect.promise(() =>
      fetchArsenalFixtures(
        config.apiKey,
        state.firstRoundRequestURL!,
        config.fetchFunction,
      ),
    );
    return yield* Effect.succeed({
      ...state,
      fixtures: data.matches,
    });
  });

export const fetchSecondRoundStep = (state: PipelineState) =>
  Effect.gen(function* () {
    const config = yield* PipelineConfigService;
    const data = yield* Effect.promise(() =>
      fetchArsenalFixtures(
        config.apiKey,
        state.firstRoundRequestURL!,
        config.fetchFunction,
      ),
    );
    return yield* Effect.succeed({
      ...state,
      fixtures: data.matches,
    });
  });

export const writeDataToFileStep = (state: PipelineState) =>
  Effect.gen(function* () {
    const config = yield* PipelineConfigService;
    const startDateStr = formatInTimeZone(state.startDate, "UTC", "yyyy-MM-dd");
    const filePath = `${appRoot.path}/src/content/fixtures/${state.competitionDatum!.code!.toLowerCase()}/${startDateStr}.json`;
    config.logger.log("Writing data to file...", filePath);
    try {
      config.writeDataToFileFunction(filePath, state.fixtures);
    } catch (error) {
      return yield* Effect.fail(state);
    }
  });
