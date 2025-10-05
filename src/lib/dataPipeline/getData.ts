import * as fs from "fs";
import { format } from "date-fns";
import appRoot from "app-root-path";
import * as json from "./json";
import * as premierLeague from "./premierLeague";
import * as competition from "./football-data/competition";
import * as team from "./football-data/team";

const getNextWeek = (day: Date) => {
  const init = new Date(day);
  return new Date(init.setDate(init.getDate() + 7));
};

const getInTwoWeeks = (day: Date) => {
  const init = new Date(day);
  return new Date(init.setDate(init.getDate() + 14));
};

const getTomorrow = (day: Date) => {
  const init = new Date(day);
  return new Date(init.setDate(init.getDate() + 1));
};

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
  today: Date,
  startDate: Date,
  endDate: Date,
  leagueID: string,
  teamID: string,
  seasonYear: number,
  fetchFunction: Function,
  writeDataToFileFunction: Function,
) => {
  console.log("Season:", seasonYear);
  const startDateStr = format(startDate, "yyyy-MM-dd");
  const endDateStr = format(endDate, "yyyy-MM-dd");

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
  const startDate = startDateArg ? new Date(startDateArg) : getNextWeek(today);
  const endDate = startDateArg ? getNextWeek(startDate) : getInTwoWeeks(today);
  const thisMonth = startDate.getMonth();
  const seasonYear = premierLeague.getSeasonYear(
    startDate.getFullYear(),
    thisMonth,
  );
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
    leagueID,
    id,
    seasonYear,
    fetchFunction,
    writeDataToFileFunction,
  );

  const secondRoundStartDate = endDate;
  const secondRoundMonth = secondRoundStartDate.getMonth();
  const secondRoundSeasonYear = premierLeague.getSeasonYear(
    secondRoundStartDate.getFullYear(),
    secondRoundMonth,
  );
  console.log(startDateArg, startDate, endDate, thisMonth);
  await saveFixturesFromRange(
    api_key,
    today,
    secondRoundStartDate,
    getNextWeek(endDate),
    leagueID,
    id,
    secondRoundSeasonYear,
    fetchFunction,
    writeDataToFileFunction,
  );
};
