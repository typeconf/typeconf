import { readConfigFromFile } from "@typeconf/sdk";
import { cache } from "react";

export async function getLocalJSONConfig<T>(path: string): Promise<T> {
  return cache((): T => {
    return readConfigFromFile<T>(path);
  })();
}