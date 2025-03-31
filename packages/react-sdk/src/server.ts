import { readConfigFromFile, readConfig as sdkReadConfig } from "@typeconf/sdk";

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

interface ReadConfigOptions {
  disableCache?: boolean;
}

const configCache = new Map<string, CacheEntry<any>>();
const EXPIRATION_TIME = 60 * 10; 

export function getLocalJSONConfig<T>(path: string): T {
  const cached = configCache.get(path);
  const now = Date.now();

  if (!cached || now - cached.timestamp > EXPIRATION_TIME) {
    const value = readConfigFromFile<T>(path);
    configCache.set(path, { value, timestamp: now });
    return value;
  }

  return cached.value;
}

export async function readConfig<T>(path: string, options: ReadConfigOptions = {}): Promise<T> {
  const cached = configCache.get(path);
  const now = Date.now();
  const disableCache = options.disableCache ?? false;
  if (!cached || now - cached.timestamp > EXPIRATION_TIME || disableCache) {
    const value = await sdkReadConfig<T>(path);
    configCache.set(path, { value, timestamp: now });
    return value;
  }

  return cached.value;
}