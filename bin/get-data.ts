
import * as fs from 'fs';
import { format, startOfWeek, endOfWeek } from "date-fns";
import * as appRoot from 'app-root-path';

const api_key = process.env.API_SPORTS_API_KEY!;

const fetchTeamID = async (api_key: string) => {
  const headers = new Headers();
  headers.append("x-apisports-key", api_key);

  const requestOptions: RequestInit = {
    method: "GET",
    headers: headers,
    redirect: "follow",
  };
  const API_ENDPOINT = `https://v3.football.api-sports.io/teams?name=arsenal`;
  try {
    const response = await fetch(API_ENDPOINT, requestOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data["team"]["id"];
  }
};

const fetchArsenalFixtures = async (api_key: string, id: string, startOfThisWeek: string, endOfThisWeek: string) => {
  const headers = new Headers();
  headers.append("x-apisports-key", api_key);

  const requestOptions: RequestInit = {
    method: "GET",
    headers: headers,
    redirect: "follow",
  };

  const API_ENDPOINT = `https://v3.football.api-sports.io/fixtures?team=${TEAM_ID}&from=${startOfThisWeek}&to=${endOfThisWeek}`;
  try {
    const response = await fetch(API_ENDPOINT, requestOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data.results
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

const writeDataToFile = async (filePath: string, data: any) => {

  try {
    // Convert the JavaScript object to a JSON string
    // The 'null' and '2' arguments format the JSON with an indentation of 2 spaces, making it readable
    const jsonString = JSON.stringify(data, null, 2);

    // Write the string to the file
    fs.writeFileSync(filePath, jsonString, "utf-8");

    console.log("JSON data has been written to data.json successfully.");
  } catch (error) {
    console.error("Error writing file:", error);
  }
};

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

const results = fetchArsenalFixtures(api_key, id, startOfThisWeek, endOfThisWeek);
const filePath = `${appRoot.path}/src/fixtures/{startOfThisWeek}-{endOfThisWeek}.json`;
writeDataToFile(filePath, results);
