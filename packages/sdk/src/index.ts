import fs from "fs";

export type Config = {
  configs: Array<string>;
};

export function readConfigFromFile<T>(filepath: string): T {
  const data = fs.readFileSync(filepath, "utf8");
  return JSON.parse(data) as T;
}
