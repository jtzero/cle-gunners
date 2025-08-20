import * as fs from "fs";
import { format, startOfWeek, endOfWeek } from "date-fns";
import appRoot from "app-root-path";

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

const buildRequestURL = (
  id: string,
  leagueID: string,
  season: number,
  startOfThisWeek: string,
  endOfThisWeek: string,
) => {
  return `https://api.football-data.org/v4/teams/${id}/matches?season=${season}&competitions=${leagueID}&dateFrom=${startOfThisWeek}&dateTo=${endOfThisWeek}`;
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

  const today = new Date();
  const startOfThisWeek = format(
    startOfWeek(today, { weekStartsOn: 1 }),
    "yyyy-MM-dd",
  ); // Monday
  const endOfThisWeek = format(
    endOfWeek(today, { weekStartsOn: 1 }),
    "yyyy-MM-dd",
  ); // Sunday
  console.log("Fetching League ID...");
  const leagueID = await fetchPremierLeageID(api_key);
  console.log("Fetching team ID...");
  const id = await fetchTeamID(api_key, today.getFullYear());
  console.log("ID fetched:", id);

  const requestURL = buildRequestURL(
    id,
    leagueID,
    today.getFullYear(),
    startOfThisWeek,
    endOfThisWeek,
  );
  console.log("Fetching Fixtures from:", requestURL);
  const results = await fetchArsenalFixtures(api_key, requestURL);
  console.log("Fixtures fetched:", results.resultSet.count);
  const filePath = `${appRoot.path}/src/content/fixtures/${startOfThisWeek}-${endOfThisWeek}.json`;
  console.log("Writing data to file...", filePath);
  writeDataToFile(filePath, results);
} catch (error) {
  console.error("Error fetching data:", error);
  process.exit(1);
}
