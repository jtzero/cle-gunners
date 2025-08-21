import * as fs from "fs";
import { format } from "date-fns";
import appRoot from "app-root-path";

const startDateArg = process.argv[0];

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
    throw new Error(`HTTP error! resonse: ${data.Message}`);
  }

  return data.teams.filter((team: any) => team.shortName === "Arsenal")[0].id;
};

const fetchPremierLeageID = async (api_key: string) => {
  const headers = new Headers();
  headers.append("X-Auth-Token", api_key);

  const requestOptions: RequestInit = {
    method: "GET",
    headers: headers,
    redirect: "follow",
  };
  const api_endpoint = `https://api.football-data.org/v4/competitions/PL`;
  const response = await fetch(api_endpoint, requestOptions);

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`HTTP error! resonse: ${data.Message}`);
  }

  return data.id;
};

const getSeasonYear = (thisYear: number, month: number): number => {
  if (month < 3) {
    return thisYear - 1;
  } else {
    return thisYear;
  }
};

const getNextWeek = (day: Date) => {
  const init = new Date();
  init.setDate(day.getDate() + 7);
  return init;
};

const getTomorrow = (day: Date) => {
  const init = new Date();
  init.setDate(day.getDate() + 1);
  return init;
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

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  return data;
};

const writeDataToFile = async (filePath: string, data: any) => {
  // Convert the JavaScript object to a JSON string
  // The 'null' and '2' arguments format the JSON with an indentation of 2 spaces, making it readable
  const jsonString = JSON.stringify(data, null, 2);

  // Write the string to the file
  fs.writeFileSync(filePath, jsonString, "utf-8");
};

try {
  console.log("Fetching data from API Sports...");
  const api_key = process.env.FOOTBALL_DATA_API_KEY!;
  if (!api_key) {
    throw new Error(
      "API key 'FOOTBALL_DATA_API_KEY' not found in environment variables.",
    );
  }

  const initialDate = startDateArg ? new Date(startDateArg) : new Date();
  const nextWeek = getNextWeek(initialDate);
  const startDate = getTomorrow(initialDate);
  const thisMonth = nextWeek.getMonth();
  const seasonYear = getSeasonYear(nextWeek.getFullYear(), thisMonth);
  console.log("Fetching League ID...");
  const leagueID = await fetchPremierLeageID(api_key);
  console.log("Fetching team ID...");
  const id = await fetchTeamID(api_key, seasonYear);
  console.log("ID fetched:", id);
  const startDateStr = format(startDate, "yyyy-MM-dd");
  const nextWeekStr = format(nextWeek, "yyyy-MM-dd");

  const requestURL = buildRequestURL(
    id,
    leagueID,
    seasonYear,
    startDateStr,
    nextWeekStr,
  );
  console.log("Fetching Fixtures from:", requestURL);
  const results = await fetchArsenalFixtures(api_key, requestURL);
  console.log("Fixtures fetched:", results.resultSet.count);
  const filePath = `${appRoot.path}/src/content/fixtures/${startDateStr}.json`;
  console.log("Writing data to file...", filePath);
  writeDataToFile(filePath, results);
} catch (error) {
  console.error("Error fetching data:", error);
  process.exit(1);
}
