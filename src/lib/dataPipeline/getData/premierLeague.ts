import appRoot from "app-root-path";
import { competition, type Competition } from "../football-data";
import { type PipelineState } from "./_pipeline";
import {
  fetchCompetitionStep,
  buildRequestURL,
  buildSecondRoundRequestURL,
  fetchArsenalIDStep,
  fetchFirstRoundStep,
  fetchSecondRoundStep,
  getSeasonStep,
  logStep,
  setSeasonYear,
  setSecondRoundSeasonYear,
  writeDataToFileStep,
} from "./football-data";
import { Effect, pipe } from "effect";

export const LEAGUE_CODE = "PL";

export const steps = (initialState: PipelineState) => {
  return pipe(
    Effect.succeed(initialState),
    Effect.flatMap(
      fetchCompetitionStep(
        `${appRoot.path}/src/content/competitions/football-data/pl.json`,
        competition.fetchPremierLeague,
      ),
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
