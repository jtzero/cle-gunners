import * as json from "../json";
import * as date from "../date";
import { Effect } from "effect";
import * as pl from "./premierLeague";
import * as cl from "./championsLeague";
import * as efl from "./eflCup";
import {
  PipelineConfigService,
  type Logger,
  type PipelineConfig,
  type PipelineState,
} from "./_pipeline";

export {
  fetchCompetitionStep,
  writeDataToFileStep,
  fetchFirstRoundStep,
  fetchSecondRoundStep,
} from "./football-data";

export const LeagueCodes = {
  CHAMPIONS_LEAGUE: cl.LEAGUE_CODE,
  PREMIER_LEAGUE: pl.LEAGUE_CODE,
  EFL_CUP: efl.LEAGUE_CODE,
} as const;

const buildConfig = (
  apiKey: string,
  competitionCode: string,
  startDateArg: string | null,
  fetchFunction: Function,
  writeDataToFileFunction: Function,
  logger: Logger = console,
): { config: PipelineConfig; initialState: PipelineState } => {
  const today = new Date();
  const startDate = startDateArg
    ? new Date(startDateArg)
    : date.getNextWeek(today);
  const endDate = startDateArg
    ? date.getNextWeek(startDate)
    : date.getInTwoWeeks(today);

  const secondRoundStartDate = endDate;
  const secondRoundEndDate = date.getNextWeek(secondRoundStartDate);
  const config: PipelineConfig = {
    apiKey,
    competitionCode,
    startDateArg,
    today,
    fetchFunction,
    writeDataToFileFunction,
    logger,
  };
  const initialState: PipelineState = {
    startDate,
    endDate,
    secondRoundStartDate,
    secondRoundEndDate,
    competitionDatum: null,
    leagueID: null,
    teamID: null,
    seasonYear: null,
    secondRoundSeasonYear: null,
    isFutureSeason: false,
    firstRoundRequestURL: null,
    secondRoundRequestURL: null,
    filePath: null,
    fixtures: null,
  };
  return { config, initialState };
};

export const run = async (
  apiKey: string,
  competitionCode: string,
  startDateArg: string | null,
  fetchFunction: Function = fetch,
  writeDataToFileFunction: Function = json.stringifyToFile,
  logger: Logger = console,
): Promise<void> => {
  const { config, initialState } = buildConfig(
    apiKey,
    competitionCode,
    startDateArg,
    fetchFunction,
    writeDataToFileFunction,
    logger,
  );
  const program =
    competitionCode.toUpperCase() === LeagueCodes.CHAMPIONS_LEAGUE
      ? cl.steps(initialState)
      : pl.steps(initialState);

  await Effect.runPromise(
    program.pipe(Effect.provideService(PipelineConfigService, config)),
  );
};
