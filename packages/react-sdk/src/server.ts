import { readConfigFromFile } from "@typeconf/sdk";
import { cache } from "react";

export function getLocalJSONConfig<T>(path: string): T {
  return cache((): T => {
    return readConfigFromFile<T>(path);
  })();
}