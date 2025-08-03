import { readConfig as sdkReadConfig, ReadConfigOptions as SdkReadConfigOptions } from "@typeconf/sdk";
import { AsyncLocalStorage } from 'async_hooks';

interface ReadConfigOptions extends SdkReadConfigOptions {
  disableCache?: boolean;
}

const storage = new AsyncLocalStorage<Map<string, any>>();

export async function readConfig<T>(path: string, options: ReadConfigOptions = {}): Promise<T> {
  const { disableCache, ...sdkOptions } = options;
  const shouldDisableCache = disableCache ?? false;
  
  if (shouldDisableCache) {
    return await sdkReadConfig<T>(path, sdkOptions);
  }

  // Get the request-specific cache or create a new one
  const cache = storage.getStore() || new Map();
  if (!storage.getStore()) {
    storage.enterWith(cache);
  }

  if (!cache.has(path)) {
    const value = await sdkReadConfig<T>(path, sdkOptions);
    cache.set(path, value);
  }

  return cache.get(path);
}