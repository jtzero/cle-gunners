export const getNextWeek = (day: Date) => {
  const init = new Date(day);
  return new Date(init.setDate(init.getDate() + 7));
};

export const getInTwoWeeks = (day: Date) => {
  const init = new Date(day);
  return new Date(init.setDate(init.getDate() + 14));
};

export const getTomorrow = (day: Date) => {
  const init = new Date(day);
  return new Date(init.setDate(init.getDate() + 1));
};
