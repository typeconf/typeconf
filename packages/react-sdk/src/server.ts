import { readConfig as sdkReadConfig } from "@typeconf/sdk";
import { AsyncLocalStorage } from 'async_hooks';

interface ReadConfigOptions {
  disableCache?: boolean;
}

const storage = new AsyncLocalStorage<Map<string, any>>();

export async function readConfig<T>(path: string, options: ReadConfigOptions = {}): Promise<T> {
  const disableCache = options.disableCache ?? false;
  
  if (disableCache) {
    return await sdkReadConfig<T>(path);
  }

  // Get the request-specific cache or create a new one
  const cache = storage.getStore() || new Map();
  if (!storage.getStore()) {
    storage.enterWith(cache);
  }

  if (!cache.has(path)) {
    const value = await sdkReadConfig<T>(path);
    cache.set(path, value);
  }

  return cache.get(path);
}