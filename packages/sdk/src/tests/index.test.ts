import { describe, expect, it } from 'vitest';
import dotenv from 'dotenv';
import { MyTestConfig } from './config-package/types/all.js';
import { readConfig } from '@typeconf/sdk';
import path from 'path';
import fs from 'fs';

describe('readConfigFromCloud', () => {
  it('should read config from cloud correctly', async () => {
    // Check if .env file exists
    const envPath = path.resolve(__dirname, '.env');
    try {
      const envExists = fs.existsSync(envPath);
      if (!envExists) {
        throw new Error('Missing .env file. Please copy .env.example to .env and fill in your credentials.');
      }
    } catch (err: unknown) {
      throw new Error('Failed to check .env file: ' + (err instanceof Error ? err.message : String(err)));
    }

    dotenv.config({ path: path.resolve(__dirname, '.env'), debug: true });

    // Test the function
    const result = await readConfig<MyTestConfig>('Config1');
    expect(result).toEqual({
      someValue1: 'test',
      someValue2: 123,
      someValue3: ['test1', 'test2'],
      someValue4: [{ key: 'test', val: 123.456 }],
    });
  });

  it('should throw error when config is not found', async () => {
    dotenv.config({ path: path.resolve(__dirname, '.env'), debug: true });

    // Test the function throws for non-existent config
    await expect(readConfig<MyTestConfig>('NonExistentConfig')).rejects.toThrow('Failed to read config from Typeconf Cloud: Error: Config value not found');
  });
}); 