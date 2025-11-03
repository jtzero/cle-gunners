export type Team = {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  address: string;
  website: string;
  founded: number;
  clubColors: string;
  venue: string;
  lastUpdated: string;
};

export type Competition = {
  area: {
    id: number;
    name: string;
    code: string;
    flag: string; //URL;
  };
  id: number;
  name: string;
  code: string;
  type: string;
  emblem: string; //URL
  currentSeason: {
    id: number;
    startDate: string;
    endDate: string;
    currentMatchday: number;
    winner: Team | null;
    stages: Array<string>;
  };
  seasons: Array<Season>;
};

export type Season = {
  id: number;
  startDate: string;
  endDate: string;
  currentMatchday: number;
  winner: Team | null;
  stages: Array<string>;
};
