import { type Competition, type Season } from "./types";

interface HasSeasons {
  seasons: Season[];
}

export const buildRequestURL = (
  id: string,
  leagueID: string,
  season: number,
  startDate: string,
  endDate: string,
) => {
  return `https://api.football-data.org/v4/teams/${id}/matches?season=${season}&competitions=${leagueID}&dateFrom=${startDate}&dateTo=${endDate}`;
};
export const buildURL = (leagueCode: string) => {
  return `https://api.football-data.org/v4/competitions/${leagueCode}`;
};

export const latestSeason = (competition: HasSeasons): Season | undefined => {
  return competition.seasons.sort((seasonA: Season, seasonB: Season) => {
    return (
      new Date(seasonB.endDate).getTime() - new Date(seasonA.endDate).getTime()
    );
  })[0];
};

export const fetchPremierLeague = async (
  api_key: string,
  fetchFunction: Function = fetch,
): Promise<Competition> => {
  const headers = new Headers();
  headers.append("X-Auth-Token", api_key);

  const requestOptions: RequestInit = {
    method: "GET",
    headers: headers,
    redirect: "follow",
  };
  const api_endpoint = `https://api.football-data.org/v4/competitions/PL`;
  const response = await fetchFunction(api_endpoint, requestOptions);

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `HTTP error! response status:${response.status}: ${data.Message}`,
    );
  }

  return data;
};

export class NoSeasonFoundError extends Error {
  constructor(date: Date) {
    super(`No season found for date:'${date}'`);
    this.name = "NoSeasonFoundError";
  }
}

export const getSeasonYear = (
  competition: HasSeasons,
  checkDate: Date,
): number | NoSeasonFoundError => {
  const season = competition.seasons.find((season: Season) => {
    return (
      new Date(season.startDate).getTime() <= checkDate.getTime() &&
      new Date(season.endDate).getTime() >= checkDate.getTime()
    );
  });
  if (!season) {
    return new NoSeasonFoundError(checkDate);
  } else {
    return new Date(season.startDate).getFullYear();
  }
};

export const seasonYears = (
  competition: HasSeasons,
  checkDate: Date,
): string | NoSeasonFoundError => {
  const season = competition.seasons.find((season: Season) => {
    return (
      new Date(season.startDate).getTime() <= checkDate.getTime() &&
      new Date(season.endDate).getTime() >= checkDate.getTime()
    );
  });
  if (!season) {
    return new NoSeasonFoundError(checkDate);
  } else {
    return `${new Date(season.startDate).getFullYear()}-${new Date(season.endDate).getFullYear()}`;
  }
};
