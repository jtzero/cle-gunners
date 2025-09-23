import * as fs from "fs";
import * as path from "path";
import { format, startOfWeek } from "date-fns";
import appRoot from "app-root-path";

import competition from "@/lib/football-data";
import * as premierLeague from "@/lib/premierLeague";
import * as json from "@/lib/json";

const startDateArg = process.argv[2];

const fetchTeamID = async (api_key: string, season: number) => {
  const headers = new Headers();
  headers.append("X-Auth-Token", api_key);

  const requestOptions: RequestInit = {
    method: "GET",
    headers: headers,
    redirect: "follow",
  };
  const api_endpoint = `https://api.football-data.org/v4/competitions/PL/teams?season=${season}`;
  const response = await fetch(api_endpoint, requestOptions);

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `HTTP error! resonse status:${response.status}: ${data.Message}`,
    );
  }

  return data.teams.filter((team: any) => team.shortName === "Arsenal")[0].id;
};

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

const buildRequestOptions = (api_key: string): RequestInit => {
  const headers = new Headers();
  headers.append("X-Auth-Token", api_key);
  const requestOptions: RequestInit = {
    method: "GET",
    headers: headers,
    redirect: "follow",
  };
  return requestOptions;
};

const fetchJSON = async (requestOptions: RequestInit, requestURL: string) => {
  const response = await fetch(requestURL, requestOptions);

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `HTTP error! resonse status:${response.status}: ${data.Message}`,
    );
  }

  return data;
};

const buildRequestURL = (
  id: string,
  leagueID: string,
  season: number,
  startDate: string,
  endDate: string,
) => {
  return `https://api.football-data.org/v4/teams/${id}/matches?season=${season}&competitions=${leagueID}&dateFrom=${startDate}&dateTo=${endDate}`;
};

const fetchArsenalFixtures = async (api_key: string, requestURL: string) => {
  const headers = new Headers();
  headers.append("X-Auth-Token", api_key);

  const requestOptions: RequestInit = {
    method: "GET",
    headers: headers,
    redirect: "follow",
  };

  const api_endpoint = requestURL;
  const response = await fetch(api_endpoint, requestOptions);

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `HTTP error! resonse status:${response.status}: ${data.Message}`,
    );
  }

  return data;
};

const run = async (
  api_key: string,
  today: Date,
  startDate: Date,
  endDate: Date,
  leagueID: string,
  teamID: string,
  seasonYear: number,
) => {
  console.log("Season:", seasonYear);
  const startDateStr = format(startDate, "yyyy-MM-dd");
  const endDateStr = format(endDate, "yyyy-MM-dd");

  const requestURL = buildRequestURL(
    teamID,
    leagueID,
    seasonYear,
    startDateStr,
    endDateStr,
  );
  console.log("Fetching Fixtures from:", requestURL);
  const results = await fetchArsenalFixtures(api_key, requestURL);
  console.log("Fixtures fetched:", results.resultSet.count);
  const filePath = `${appRoot.path}/src/content/fixtures/${startDateStr}.json`;
  console.log("Writing data to file...", filePath);
  json.stringifyToFile(filePath, results);
};

const latestFile = (fixtureDir: string): string => {
  const files = fs.readdirSync(fixtureDir);
  const sortedFiles = files.sort((fileNameA, fileNameB) => {
    const dateA = new Date(fileNameA.split(".")[0]);
    const dateB = new Date(fileNameB.split(".")[0]);
    return dateA.getTime() - dateB.getTime();
  });
  return sortedFiles[0];
};

const getSeasonEndDate = (jsonStructure: Object): Date => {
  return new Date(jsonStructure.matches[0]["season"]["endDate"]);
};

const isAfterSeasonEnd = (seasonEndDate: Date, date: Date): Boolean => {
  return seasonEndDate.getTime() < date.getTime();
};

const parseFixtureFile = (fixtureFilePath: string): Object => {
  return JSON.parse(fs.readFileSync(fixtureFilePath));
};

const parseJSONFile = (filePath: string): Object => {
  return JSON.parse(fs.readFileSync(filePath));
};

const latestSeasonFromCompetition = (competition: object): object | undefined => {
  return competition.seasons.sort((seasonA: any, seasonB: any) => {
    return seasonA.endDate.getTime() - seasonB.endDate.getTime();
  })[0];
};

const fileNameWithExtToDate = (fileName: string): Date => {
  return new Date(fileName.split(".")[0]);
};

const competitionYearsFile = (competitionDir: string, seasonYears: string): string | undefined => {
  const files = fs.readdirSync(competitionDir).filter((fileName: string) => {
    return fileName.split(".")[0] === seasonYears;
  });
  return files[0];
};

try {
  console.log("Fetching data from API Sports...");
  const api_key = process.env.FOOTBALL_DATA_API_KEY!;
  if (!api_key) {
    throw new Error(
      "API key 'FOOTBALL_DATA_API_KEY' not found in environment variables.",
    );
  }

  const today = new Date();
  // TODO if (!startDateArg) {
  //
  // } else {
  const fixtureDir = `${appRoot.path}/src/content/fixtures/`;
  const latestFixtureFile = latestFile(fixtureDir);
  const latestFixtureDate = fileNameWithExtToDate(latestFixtureFile);
  const latestFixtureFilePath = path.join(fixtureDir, latestFixtureFile);
  const parsedFixtureFile = parseFixtureFile(latestFixtureFilePath);
  const startDate = startDateArg ? new Date(startDateArg) : getNextWeek(today);
  const endDate = startDateArg ? getNextWeek(startDate) : getInTwoWeeks(today);
  const startMonth = startDate.getMonth();
  const seasonYear = premierLeague.getSeasonYear(startDate.getFullYear(), startMonth);
  console.log("Fetching League...");
  const querySeasonYears = premierLeague.seasonYears(startDate.getFullYear(), startMonth);
  const competitionDir = `${appRoot.path}/src/content/competitions/`;
  const seasonFile = competitionYearsFile(competitionDir, querySeasonYears);
  const competitionInfo = await (async () => {
    if (seasonFile) {
      let info =  parseJSONFile(seasonFile);
      json.stringifyToFile(
        `${competitionDir}${querySeasonYears}.json`,
        competitionInfo,
      );
      return info;
    } else {
      return await competition.fetchPremierLeage(api_key);
    }
  })();
  // if no competitionIfno or no latest season is < query startDate
  const latestSeason = latestSeasonFromCompetition(competitionInfo);
  const seasonYearFromLatestSeason = premierLeague.getSeasonYear(
    latestSeason.startDate.getFullYear(),
    latestSeason.startDate.getMonth(),
  );
  if (seasonYearFromLatestSeason > seasonYear) {

  if (new Date(latestSeason.endDate) > )
  const leagueID = competition.id;
  console.log("Fetching team ID...");
  const id = await fetchTeamID(api_key, seasonYear);
  console.log("ID fetched:", id);
  console.log(startDateArg, startDate, endDate, thisMonth);
  run(api_key, today, startDate, endDate, leagueID, id, seasonYear);

  const secondRoundStartDate = endDate;
  const secondRoundMonth = secondRoundStartDate.getMonth();
  const secondRoundSeasonYear = premierLeague.seasonYear(
    secondRoundStartDate.getFullYear(),
    secondRoundMonth,
  );
  console.log(startDateArg, startDate, endDate, thisMonth);
  run(
    api_key,
    today,
    secondRoundStartDate,
    getNextWeek(endDate),
    leagueID,
    id,
    secondRoundSeasonYear,
  );
} catch (error) {
  console.error("Error fetching data:", error);
  process.exit(1);
}
