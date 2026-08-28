import { run } from "@/lib/dataPipeline/getData";
import { LeagueCodes } from "@/lib/dataPipeline";
try {
  require.resolve("dotenv");
  require("dotenv").config();
} catch {}

const leagueCodeArg = process.argv[2];
const startDateArg = process.argv[3];
console.log("starting datapipeline from API");
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
  const leagueCodes = Object.values(LeagueCodes);
  if (!leagueCodes.includes(leagueCodeArg.toUpperCase())) {
    throw new Error(
      `Invalid league code provided. Valid league codes are: ${leagueCodes.join(
        ", ",
      )}`,
    );
  }
  await run(apiKey, leagueCodeArg.toLowerCase(), startDateArg);
} catch (error) {
  console.error("Error fetching data:", error);
  process.exit(1);
}
