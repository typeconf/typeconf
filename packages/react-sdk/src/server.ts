import { readConfigFromFile, readConfig as sdkReadConfig } from "@typeconf/sdk";

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

const configCache = new Map<string, CacheEntry<any>>();
const ONE_HOUR = 60 * 60 * 1000; 

export function getLocalJSONConfig<T>(path: string): T {
  const cached = configCache.get(path);
  const now = Date.now();

  if (!cached || now - cached.timestamp > ONE_HOUR) {
    const value = readConfigFromFile<T>(path);
    configCache.set(path, { value, timestamp: now });
    return value;
  }

  return cached.value;
}

export async function readConfig<T>(path: string): Promise<T> {
  const cached = configCache.get(path);
  const now = Date.now();

  if (!cached || now - cached.timestamp > ONE_HOUR) {
    const value = await sdkReadConfig<T>(path);
    configCache.set(path, { value, timestamp: now });
    return value;
  }

  return cached.value;
}