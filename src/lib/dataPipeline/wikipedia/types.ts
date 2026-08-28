export interface FACupFixture {
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  score: string;
  round?: string;
  stadium?: string;
  location?: string;
  attendance?: string;
  referee?: string;
}

export interface FACupSeasonInfo {
  year: number;
  seasonString: string;
  fullSeasonString: string;
  articleTitle: string;
}

export interface FACupFixturesResult {
  season: FACupSeasonInfo;
  pageTitle: string;
  fixtures: FACupFixture[];
  rawWikitext?: string;
}

export interface WikipediaParseResponse {
  parse?: {
    title: string;
    pageid: number;
    wikitext?: {
      '*': string;
    };
    text?: {
      '*': string;
    };
    sections?: Array<{
      toclevel: number;
      level: string;
      line: string;
      number: string;
      index: string;
      anchor: string;
    }>;
  };
  error?: {
    code: string;
    info: string;
  };
}
