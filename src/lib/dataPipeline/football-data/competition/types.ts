import { type Team } from '../types';

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
