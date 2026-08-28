import { Context } from "effect";
import type { Competition, NoSeasonFoundError } from "../football-data";

export interface Logger {
  log(...args: any[]): void;
}

export interface PipelineConfig {
  apiKey: string;
  competitionCode: string;
  startDateArg: string | null;
  today: Date;
  fetchFunction: Function;
  writeDataToFileFunction: Function;
  logger: Logger;
}

export class PipelineConfigService extends Context.Tag("PipelineConfigService")<
  PipelineConfigService,
  PipelineConfig
>() {}

export interface PipelineState {
  startDate: Date;
  endDate: Date;
  secondRoundStartDate: Date;
  secondRoundEndDate: Date;
  competitionDatum: Competition | null;
  leagueID: string | null;
  teamID: string | null;
  seasonYear: number | NoSeasonFoundError | null;
  secondRoundSeasonYear: number | NoSeasonFoundError | null;
  isFutureSeason: boolean;
  firstRoundRequestURL: string | null;
  secondRoundRequestURL: string | null;
  filePath: string | null;
  fixtures: any | null;
}
