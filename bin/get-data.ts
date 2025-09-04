import * as fs from "fs";
import { format } from "date-fns";
import appRoot from "app-root-path";

const startDateArg = process.argv[2];

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
    throw new Error(
      `HTTP error! resonse status:${response.status}: ${data.Message}`,
    );
  }

  return data.id;
};

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

const getSeasonYear = (thisYear: number, month: number): number => {
  if (month < 3) {
    return thisYear - 1;
  } else {
    return thisYear;
  }
};

const getNextWeek = (day: Date) => {
  const init = new Date(day);
  return new Date(init.setDate(init.getDate() + 7));
};

const getInThreeWeeks = (day: Date) => {
  const init = new Date(day);
  return new Date(init.setDate(init.getDate() + 14));
};

const getTomorrow = (day: Date) => {
  const init = new Date(day);
  return new Date(init.setDate(init.getDate() + 1));
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

  const today = new Date();
  const startDate = startDateArg ? new Date(startDateArg) : getNextWeek(today);
  const endDate = startDateArg ? getNextWeek(startDate) : getInThreeWeeks(today);
  const thisMonth = startDate.getMonth();
  const seasonYear = getSeasonYear(startDate.getFullYear(), thisMonth);
  console.log(startDateArg, startDate, endDate, thisMonth);
  console.log("Season:", seasonYear);
  console.log("Fetching League ID...");
  const leagueID = await fetchPremierLeageID(api_key);
  console.log("Fetching team ID...");
  const id = await fetchTeamID(api_key, seasonYear);
  console.log("ID fetched:", id);
  const startDateStr = format(startDate, "yyyy-MM-dd");
  const endDateStr = format(endDate, "yyyy-MM-dd");

  const requestURL = buildRequestURL(
    id,
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
  writeDataToFile(filePath, results);
} catch (error) {
  console.error("Error fetching data:", error);
  process.exit(1);
}
