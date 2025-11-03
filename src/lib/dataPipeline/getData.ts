import * as fs from "fs";
import { formatInTimeZone } from "date-fns-tz";
import appRoot from "app-root-path";
import * as json from "./json";
import * as date from "./date";
import { team, competition } from "./football-data";

const fetchArsenalFixtures = async (
  api_key: string,
  requestURL: string,
  fetchFunction: Function,
) => {
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

const saveFixturesFromRange = async (
  api_key: string,
  _today: Date,
  startDate: Date,
  endDate: Date,
  leagueID: string,
  teamID: string,
  seasonYear: number,
  fetchFunction: Function,
  writeDataToFileFunction: Function,
) => {
  console.log("Season:", seasonYear);
  const startDateStr = formatInTimeZone(startDate, "UTC", "yyyy-MM-dd");
  const endDateStr = formatInTimeZone(endDate, "UTC", "yyyy-MM-dd");

  const requestURL = competition.buildRequestURL(
    teamID,
    leagueID,
    seasonYear,
    startDateStr,
    endDateStr,
  );
  console.log("Fetching Fixtures from:", requestURL);
  const results = await fetchArsenalFixtures(
    api_key,
    requestURL,
    fetchFunction,
  );
  console.log("Fixtures fetched:", results.resultSet.count);
  const filePath = `${appRoot.path}/src/content/fixtures/${startDateStr}.json`;
  console.log("Writing data to file...", filePath);
  writeDataToFileFunction(filePath, results);
};

export const run = async (
  api_key: string,
  startDateArg: string | null,
  fetchFunction: Function = fetch,
  writeDataToFileFunction: Function = json.stringifyToFile,
) => {
  const today = new Date();
  const startDate = startDateArg
    ? new Date(startDateArg)
    : date.getNextWeek(today);
  const endDate = startDateArg
    ? date.getNextWeek(startDate)
    : date.getInTwoWeeks(today);
  const thisMonth = startDate.getMonth();
  const premierLeagueCompetition = await competition.fetchPremierLeague(
    api_key,
    fetchFunction,
  );
  const seasonYear = competition.getSeasonYear(
    premierLeagueCompetition,
    startDate,
  );
  if (seasonYear instanceof competition.NoSeasonFoundError) {
    console.log(`No season yet for ${startDate}`);
    return;
  }

  console.log("Fetching League ID...");
  const league = await competition.fetchPremierLeague(api_key, fetchFunction);
  const leagueID = league.id;
  console.log("Fetching team ID...");
  const id = await team.fetchArsenalID(api_key, seasonYear, fetchFunction);
  console.log("ID fetched:", id);
  console.log(startDateArg, startDate, endDate, thisMonth);
  await saveFixturesFromRange(
    api_key,
    today,
    startDate,
    endDate,
    leagueID.toString(),
    id,
    seasonYear,
    fetchFunction,
    writeDataToFileFunction,
  );

  const secondRoundStartDate = endDate;
  const secondRoundSeasonYear = competition.getSeasonYear(
    premierLeagueCompetition,
    secondRoundStartDate,
  );
  if (secondRoundSeasonYear instanceof competition.NoSeasonFoundError) {
    console.log(`No season yet for ${secondRoundSeasonYear}`);
    return;
  }
  console.log(startDateArg, startDate, endDate, thisMonth);
  await saveFixturesFromRange(
    api_key,
    today,
    secondRoundStartDate,
    date.getNextWeek(endDate),
    leagueID.toString(),
    id,
    secondRoundSeasonYear,
    fetchFunction,
    writeDataToFileFunction,
  );
};
