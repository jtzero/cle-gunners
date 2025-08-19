import * as fs from "fs";
import { format, startOfWeek, endOfWeek } from "date-fns";
import * as appRoot from "app-root-path";

const fetchTeamID = async (api_key: string) => {
  const headers = new Headers();
  headers.append("x-apisports-key", api_key);

  const requestOptions: RequestInit = {
    method: "GET",
    headers: headers,
    redirect: "follow",
  };
  const api_endpoint = `https://v3.football.api-sports.io/teams?name=arsenal`;
  const response = await fetch(api_endpoint, requestOptions);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log(data);
  return data["team"]["id"];
};

const fetchArsenalFixtures = async (
  api_key: string,
  id: string,
  startOfThisWeek: string,
  endOfThisWeek: string,
) => {
  const headers = new Headers();
  headers.append("x-apisports-key", api_key);

  const requestOptions: RequestInit = {
    method: "GET",
    headers: headers,
    redirect: "follow",
  };

  const api_endpoint = `https://v3.football.api-sports.io/fixtures?team=${id}&from=${startOfThisWeek}&to=${endOfThisWeek}`;
  const response = await fetch(api_endpoint, requestOptions);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  return data.results;
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
  const api_key = process.env.API_SPORTS_API_KEY!;
  if (!api_key) {
    throw new Error("API key not found in environment variables.");
  }

  console.log("Fetching team ID...");
  const id = await fetchTeamID(api_key);
  //https://media.api-sports.io/football/teams/{team_id}.png
  // Get the start and end of the current week (Sunday to Saturday)
  const today = new Date();
  const startOfThisWeek = format(
    startOfWeek(today, { weekStartsOn: 1 }),
    "yyyy-MM-dd",
  ); // Monday
  const endOfThisWeek = format(
    endOfWeek(today, { weekStartsOn: 1 }),
    "yyyy-MM-dd",
  ); // Sunday

  console.log("Fetching Fixtures...");
  const results = fetchArsenalFixtures(
    api_key,
    id,
    startOfThisWeek,
    endOfThisWeek,
  );
  const filePath = `${appRoot.path}/src/fixtures/{startOfThisWeek}-{endOfThisWeek}.json`;
  console.log("Writing data to file...");
  writeDataToFile(filePath, results);
} catch (error) {
  console.error("Error fetching data:", error);
  process.exit(1);
}
