import * as fs from "fs";

export const stringifyToFile = async (filePath: string, data: any) => {
  // Convert the JavaScript object to a JSON string
  // The 'null' and '2' arguments format the JSON with an indentation of 2 spaces, making it readable
  const jsonString = JSON.stringify(data, null, 2);

  // Write the string to the file
  fs.writeFileSync(filePath, jsonString, "utf-8");
};
