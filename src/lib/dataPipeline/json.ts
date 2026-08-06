import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export const stringifyToFile = async (
  filePath: string,
  data: unknown,
): Promise<void> => {
  const jsonString = JSON.stringify(data, null, 2);

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, jsonString, "utf-8");
};
