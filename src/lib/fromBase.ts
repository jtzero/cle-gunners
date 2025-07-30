export const fromBase = (path: string | undefined): string => {
  if (!path) {
    return import.meta.env.BASE_URL;
  }
  if (path.startsWith("http")) {
    return path;
  }
  if (path.startsWith("/") && import.meta.env.BASE_URL === "/")  {
    return path;
  }
  return [import.meta.env.BASE_URL, path].filter(Boolean).join("/");
};
