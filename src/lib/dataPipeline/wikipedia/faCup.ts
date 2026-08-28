import type {
  FACupFixture,
  FACupSeasonInfo,
  FACupFixturesResult,
  WikipediaParseResponse,
} from "./types";

/**
 * Returns the Wikipedia season string given a starting year.
 * E.g., 2026 -> "2026–27", 1999 -> "1999–2000"
 */
export const getFACupSeasonString = (startYear: number): string => {
  const endYear = startYear + 1;
  if (endYear % 100 === 0) {
    return `${startYear}–${endYear}`;
  }
  const endYearTwoDigit = (endYear % 100).toString().padStart(2, "0");
  return `${startYear}–${endYearTwoDigit}`;
};

/**
 * Returns the full season string format given a starting year.
 * E.g., 2026 -> "2026-2027"
 */
export const getFACupFullSeasonString = (startYear: number): string => {
  return `${startYear}-${startYear + 1}`;
};

/**
 * Returns complete season info for a starting year.
 */
export const getFACupSeasonInfo = (startYear: number): FACupSeasonInfo => {
  const seasonString = getFACupSeasonString(startYear);
  const fullSeasonString = getFACupFullSeasonString(startYear);
  return {
    year: startYear,
    seasonString,
    fullSeasonString,
    articleTitle: `${seasonString} FA Cup`,
  };
};

/**
 * Returns the standard Wikipedia article title for an FA Cup season.
 * E.g., 2026 -> "2026–27 FA Cup"
 */
export const getFACupArticleTitle = (startYear: number): string => {
  return `${getFACupSeasonString(startYear)} FA Cup`;
};

/**
 * Builds the Wikipedia API URL for fetching parsed wikitext of a page.
 */
export const buildWikipediaApiUrl = (pageTitle: string): string => {
  return `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(
    pageTitle
  )}&prop=wikitext|sections&format=json&origin=*`;
};

/**
 * Cleans Wikipedia wikitext markup (links, bold/italic, templates, comments).
 */
export const cleanWikitext = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, "$1")
    .replace(/\(\d+\)/g, "")
    .replace(/'''/g, "")
    .replace(/''/g, "")
    .replace(/\{\{[^}]*\}\}/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Extracts nested match templates (Football box, Football box collapsible, etc.) from wikitext.
 */
export const extractMatchTemplates = (wikitext: string): string[] => {
  const templates: string[] = [];
  let pos = 0;
  while (pos < wikitext.length - 2) {
    if (wikitext[pos] === "{" && wikitext[pos + 1] === "{") {
      const sub = wikitext.slice(pos, pos + 35).toLowerCase();
      if (
        sub.startsWith("{{football box") ||
        sub.startsWith("{{footballbox") ||
        sub.startsWith("{{matchbox")
      ) {
        let depth = 0;
        const startIdx = pos;
        let matched = false;
        for (let i = startIdx; i < wikitext.length - 1; i++) {
          if (wikitext[i] === "{" && wikitext[i + 1] === "{") {
            depth++;
            i++;
          } else if (wikitext[i] === "}" && wikitext[i + 1] === "}") {
            depth--;
            i++;
            if (depth === 0) {
              templates.push(wikitext.slice(startIdx, i + 1));
              pos = i + 1;
              matched = true;
              break;
            }
          }
        }
        if (!matched) {
          pos++;
        }
      } else {
        pos++;
      }
    } else {
      pos++;
    }
  }
  return templates;
};

/**
 * Parses top-level parameters from a MediaWiki template block.
 */
export const parseTemplateParams = (
  tplContent: string
): Record<string, string> => {
  const inner = tplContent.slice(2, -2);
  let depthBraces = 0;
  let depthBrackets = 0;
  let currentToken = "";
  const tokens: string[] = [];

  for (let i = 0; i < inner.length; i++) {
    const char = inner[i];
    const nextChar = inner[i + 1];

    if (char === "{" && nextChar === "{") {
      depthBraces++;
      currentToken += char + nextChar;
      i++;
      continue;
    }
    if (char === "}" && nextChar === "}") {
      depthBraces--;
      currentToken += char + nextChar;
      i++;
      continue;
    }
    if (char === "[" && nextChar === "[") {
      depthBrackets++;
      currentToken += char + nextChar;
      i++;
      continue;
    }
    if (char === "]" && nextChar === "]") {
      depthBrackets--;
      currentToken += char + nextChar;
      i++;
      continue;
    }

    if (char === "|" && depthBraces === 0 && depthBrackets === 0) {
      tokens.push(currentToken);
      currentToken = "";
    } else {
      currentToken += char;
    }
  }
  tokens.push(currentToken);

  const params: Record<string, string> = {};
  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];
    const eqIdx = token.indexOf("=");
    if (eqIdx !== -1) {
      const key = token.slice(0, eqIdx).trim().toLowerCase();
      const val = token.slice(eqIdx + 1).trim();
      params[key] = val;
    }
  }
  return params;
};

/**
 * Parses wikitext string to extract FA Cup fixtures.
 */
export const parseFACupFixtures = (wikitext: string): FACupFixture[] => {
  const matchBlocks = extractMatchTemplates(wikitext);
  const fixtures: FACupFixture[] = [];

  for (const block of matchBlocks) {
    const params = parseTemplateParams(block);
    const homeTeam = cleanWikitext(params["team1"] || params["home"]);
    const awayTeam = cleanWikitext(params["team2"] || params["away"]);
    const date = cleanWikitext(params["date"]);
    const time = cleanWikitext(params["time"]);
    const score = cleanWikitext(params["score"]);
    const stadium = cleanWikitext(params["stadium"]);
    const location = cleanWikitext(params["location"]);
    const attendance = cleanWikitext(params["attendance"]);
    const referee = cleanWikitext(params["referee"]);
    const round = cleanWikitext(params["round"]);

    if (homeTeam && awayTeam) {
      fixtures.push({
        homeTeam,
        awayTeam,
        date,
        time,
        score,
        ...(round && { round }),
        ...(stadium && { stadium }),
        ...(location && { location }),
        ...(attendance && { attendance }),
        ...(referee && { referee }),
      });
    }
  }

  return fixtures;
};

/**
 * Calls Wikipedia API to fetch page data for a given FA Cup year.
 */
export const fetchFACupPage = async (
  startYear: number,
  fetchFunction: Function = fetch
): Promise<WikipediaParseResponse> => {
  const primaryTitle = getFACupArticleTitle(startYear);
  const primaryUrl = buildWikipediaApiUrl(primaryTitle);

  const response = await fetchFunction(primaryUrl);
  if (!response.ok) {
    throw new Error(
      `Wikipedia API HTTP error: ${response.status} ${response.statusText}`
    );
  }

  const data: WikipediaParseResponse = await response.json();
  if (data.error) {
    // Attempt fallback with hyphen or alternative full title format if en-dash title had an error
    const fallbackTitle = `${startYear}-${(startYear + 1) % 100} FA Cup`;
    const fallbackUrl = buildWikipediaApiUrl(fallbackTitle);
    const fallbackResponse = await fetchFunction(fallbackUrl);
    if (fallbackResponse.ok) {
      const fallbackData: WikipediaParseResponse = await fallbackResponse.json();
      if (!fallbackData.error) {
        return fallbackData;
      }
    }
  }

  return data;
};

/**
 * Gets FA Cup fixtures for a specific starting year (e.g. 2026 gets 2026-2027 season).
 */
export const getFACupFixturesForYear = async (
  startYear: number,
  fetchFunction: Function = fetch
): Promise<FACupFixturesResult> => {
  const season = getFACupSeasonInfo(startYear);
  const pageData = await fetchFACupPage(startYear, fetchFunction);

  if (pageData.error) {
    throw new Error(
      `Failed to fetch Wikipedia FA Cup page for ${startYear}: ${pageData.error.info}`
    );
  }

  const wikitext = pageData.parse?.wikitext?.["*"] || "";
  const pageTitle = pageData.parse?.title || season.articleTitle;
  const fixtures = parseFACupFixtures(wikitext);

  return {
    season,
    pageTitle,
    fixtures,
    rawWikitext: wikitext,
  };
};
