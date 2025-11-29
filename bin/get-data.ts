import { run } from "@/lib/dataPipeline/getData";
import { LEAGUE_CODES } from "@/lib/dataPipeline/football-data/competition";

const leagueCodeArg = process.argv[2];
const startDateArg = process.argv[3];
console.log("Fetching data from API Sports...");
const apiKey = process.env.FOOTBALL_DATA_API_KEY;
if (!apiKey) {
  throw new Error(
    "API key 'FOOTBALL_DATA_API_KEY' not found in environment variables.",
  );
}

try {
  if (!leagueCodeArg) {
    throw new Error("No league code provided.");
  }
  if (!LEAGUE_CODES.includes(leagueCodeArg.toUpperCase())) {
    throw new Error(
      `Invalid league code provided. Valid league codes are: ${LEAGUE_CODES.join(
        ", ",
      )}`,
    );
  }
  await run(apiKey, leagueCodeArg.toLowerCase(), startDateArg);
} catch (error) {
  console.error("Error fetching data:", error);
  process.exit(1);
}
