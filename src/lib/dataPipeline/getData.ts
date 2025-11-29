import * as fs from "fs";
import { readFile } from "node:fs/promises";
import { formatInTimeZone } from "date-fns-tz";
import appRoot from "app-root-path";
import * as json from "./json";
import * as date from "./date";
import { team, competition, type Competition } from "./football-data";

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
  competitionCode: string,
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
  const filePath = `${appRoot.path}/src/content/fixtures/${competitionCode}/${startDateStr}.json`;
  console.log("Writing data to file...", filePath);
  writeDataToFileFunction(filePath, results);
};

const readCompetitionFromCache = (filePath: string): Competition | null => {
  let comp = null;
  if (fs.existsSync(filePath)) {
    comp = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }
  return comp;
};

const getChampionsLeague = async (
  apiKey: string,
  latestDate: Date,
  fetchFunction: Function,
  writeDataToFileFunction: Function,
): Promise<Competition> => {
  const filePath = `${appRoot.path}/src/content/competitions/cl.json`;
  const comp = readCompetitionFromCache(filePath);
  const latestSeason = comp ? competition.latestSeason(comp) : null;
  if (
    comp &&
    latestSeason &&
    new Date(latestSeason.endDate).getTime() >= latestDate.getTime()
  ) {
    return comp;
  } else {
    return competition
      .fetchChampionsLeague(apiKey, fetchFunction)
      .then((data: Competition) => {
        writeDataToFileFunction(filePath, data);
        return data;
      });
  }
};

const getPremierLeague = async (
  apiKey: string,
  latestDate: Date,
  fetchFunction: Function,
  writeDataToFileFunction: Function,
): Promise<Competition> => {
  const filePath = `${appRoot.path}/src/content/competitions/pl.json`;
  const comp = readCompetitionFromCache(filePath);
  const latestSeason = comp ? competition.latestSeason(comp) : null;
  if (
    comp &&
    latestSeason &&
    new Date(latestSeason.endDate).getTime() >= latestDate.getTime()
  ) {
    return comp;
  } else {
    return competition
      .fetchPremierLeague(apiKey, fetchFunction)
      .then((data: Competition) => {
        writeDataToFileFunction(filePath, data);
        return data;
      });
  }
};

export const run = async (
  api_key: string,
  competitionCode: string,
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
  const secondRoundStartDate = endDate;
  console.log("Fetching League Info...");
  let competitionDatum = null;
  if (competitionCode.toLowerCase() === "cl") {
    competitionDatum = await getChampionsLeague(
      api_key,
      secondRoundStartDate,
      fetchFunction,
      writeDataToFileFunction,
    );
  } else {
    competitionDatum = await getPremierLeague(
      api_key,
      secondRoundStartDate,
      fetchFunction,
      writeDataToFileFunction,
    );
  }

  const seasonYear = competition.getSeasonYear(competitionDatum, startDate);
  if (seasonYear instanceof competition.NoSeasonFoundError) {
    console.log(`No season yet for ${startDate}`);
    return;
  }

  const leagueID = competitionDatum.id;
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
    competitionCode,
    fetchFunction,
    writeDataToFileFunction,
  );

  const secondRoundSeasonYear = competition.getSeasonYear(
    competitionDatum,
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
    competitionCode,
    fetchFunction,
    writeDataToFileFunction,
  );
};
