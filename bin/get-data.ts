import { run } from "@/lib/getData";

const startDateArg = process.argv[2];
console.log("Fetching data from API Sports...");
const apiKey = process.env.FOOTBALL_DATA_API_KEY;
if (!apiKey) {
  throw new Error(
    "API key 'FOOTBALL_DATA_API_KEY' not found in environment variables.",
  );
}

try {
  await run(apiKey, startDateArg);
} catch (error) {
  console.error("Error fetching data:", error);
  process.exit(1);
}
