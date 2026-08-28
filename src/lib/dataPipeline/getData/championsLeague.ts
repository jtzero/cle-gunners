import appRoot from "app-root-path";
import { competition, type Competition } from "../football-data";
import { pipe, Effect } from "effect";
import {
  buildRequestURL,
  buildSecondRoundRequestURL,
  setSeasonYear,
  setSecondRoundSeasonYear,
  fetchCompetitionStep,
  getSeasonStep,
  fetchArsenalIDStep,
  fetchFirstRoundStep,
  fetchSecondRoundStep,
  writeDataToFileStep,
  logStep,
} from "./football-data";

import { PipelineConfigService, type PipelineState } from "./_pipeline";

export const LEAGUE_CODE = "CL";

export const steps = (
  initialState: PipelineState,
): Effect.Effect<never, PipelineConfigService> => {
  console.log(
    "CL steps state startDate:",
    initialState.startDate,
    "endDate:",
    initialState.endDate,
    "leagueID:",
    initialState.leagueID,
    "teamID:",
    initialState.teamID,
    "seasonYear:",
    initialState.seasonYear,
  );
  const competitionPath = `${appRoot.path}/src/content/competitions/football-data/cl.json`;
  // TODO: why does everything need an andThen?
  return pipe(
    Effect.succeed(initialState),
    Effect.flatMap(
      fetchCompetitionStep(competitionPath, competition.fetchChampionsLeague),
    ),
    Effect.andThen(setSeasonYear),
    Effect.andThen(getSeasonStep),
    Effect.andThen(
      logStep("Fetching team ID...", (s: PipelineState) => s.seasonYear),
    ),
    Effect.andThen(fetchArsenalIDStep),
    Effect.andThen(
      logStep("ID fetched", (s: PipelineState): string | null => s.teamID),
    ),
    Effect.andThen(buildRequestURL),
    Effect.andThen(
      logStep("Using URL:", (s: PipelineState) => s.firstRoundRequestURL),
    ),
    Effect.andThen(fetchFirstRoundStep),
    Effect.andThen(
      logStep("Fixtures found: ", (s: PipelineState) => s.fixtures.length),
    ),
    Effect.andThen(setSecondRoundSeasonYear),
    Effect.andThen(
      logStep("Season:", (s: PipelineState) => s.secondRoundSeasonYear),
    ),
    //Effect.andThen(getSeasonStep),
    Effect.andThen(buildSecondRoundRequestURL),
    Effect.andThen(
      logStep("Using URL:", (s: PipelineState) => s.secondRoundRequestURL),
    ),
    Effect.andThen(fetchSecondRoundStep),
    // TODO: reusing fixtures will overwrite the original
    Effect.andThen(
      logStep("Fixtures found: ", (s: PipelineState) => s.fixtures.length),
    ),
    Effect.andThen(writeDataToFileStep),
  );
};
