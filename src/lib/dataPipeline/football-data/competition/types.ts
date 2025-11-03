export type Competition = {
  area: {
    id: number;
    name: string;
    code: string;
    flag: string;
  };
  id: number;
  name: string;
  code: string;
  type: string;
  emblem: string;
  currentSeason: {
    id: number;
    startDate: string;
    endDate: string;
    currentMatchday: number;
    winner: null;
    stages: Array<string>;
  };
  seasons: Array<Season>;
};

export type Season = {
  id: number;
  startDate: string;
  endDate: string;
  currentMatchday: number;
  winner: null;
  stages: Array<string>;
};
