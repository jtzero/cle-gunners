import type { FetchFunction } from "@/lib/utils/fetchFunction";
import { type FixtureType } from "@/content.types";

export class FetchCallError extends Error {
  public error: Error;
  constructor(message: string, error: Error) {
    super(message);
    this.error = error;
    this.name = "FetchCallError";
    Object.setPrototypeOf(this, FetchCallError.prototype);
  }
}

export class FetchResponseError extends Error {
  public response: Response;
  constructor(message: string, response: Response) {
    super(message);
    this.response = response;
    this.name = "FetchResponseError";
    Object.setPrototypeOf(this, FetchResponseError.prototype);
  }
}

export const fetchWeek = async (
  fetchFunction: FetchFunction,
  url: string,
): Promise<FixtureType> => {
  return fetchFunction(url)
    .catch((error: Error) => {
      throw new FetchCallError("Error calling fixtures: " + url, error);
    })
    .then(async (response: Response) => {
      if (response.status === 200) {
        return response.json();
      } else {
        throw new FetchResponseError(
          "Error in response from API: " + response.status,
          response,
        );
      }
    });
};
