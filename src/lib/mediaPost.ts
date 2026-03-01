export const parseDimensions = (dimensions: string): number[] => {
  const [width, height] = dimensions.split("x");
  return [parseInt(width), parseInt(height)];
};
