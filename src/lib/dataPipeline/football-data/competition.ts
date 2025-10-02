export const buildURL = (leagueCode: string) => {
  return `https://api.football-data.org/v4/competitions/${leagueCode}`;
};

export const fetchPremierLeague = async (
  api_key: string,
  fetchFunction: Function = fetch,
) => {
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
