// TODO change to checking against the competition list
export const getSeasonYear = (thisYear: number, month: number): number => {
  if (month < 6) {
    return thisYear - 1;
  } else {
    return thisYear;
  }
};

export const seasonYears = (year: number, month: number): string => {
  if (month < 6) {
    return `${year - 1}-${year}`;
  } else {
    return `${year}-${year + 1}`;
  }
};
