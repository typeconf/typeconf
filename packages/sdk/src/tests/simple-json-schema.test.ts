import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { privateExports } from '../index.js';
import path from 'path';
import fs from 'fs';
import os from 'os';

const { validateConfigWithJsonSchema } = privateExports;

describe('Simple JSON Schema validation test', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'typeconf-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should validate with correct relative path in config-map', async () => {
    // Create test directory structure
    const typesDir = path.join(tempDir, 'types');
    const srcDir = path.join(tempDir, 'src');
    fs.mkdirSync(typesDir, { recursive: true });
    fs.mkdirSync(srcDir, { recursive: true });

    // Create config-map.json with EXACT relative path
    const configMap = {
      'src/test.config.ts': 'TestConfig'
    };
    fs.writeFileSync(path.join(typesDir, 'config-map.json'), JSON.stringify(configMap, null, 2));

    // Create schema.json
    const schema = {
      $defs: {
        TestConfig: {
          type: 'object',
          properties: {
            name: { type: 'string' }
          },
          required: ['name']
        }
      }
    };
    fs.writeFileSync(path.join(typesDir, 'schema.json'), JSON.stringify(schema, null, 2));

    // Create test config file
    fs.writeFileSync(path.join(srcDir, 'test.config.ts'), 'export default { name: "test" };');

    // Test validation
    const validConfig = { name: 'John' };
    const result = await validateConfigWithJsonSchema('src/test.config.ts', validConfig);
    expect(result).toEqual(validConfig);
  });

  it('should debug path resolution', async () => {
    // Create test directory structure
    const typesDir = path.join(tempDir, 'types');
    const srcDir = path.join(tempDir, 'src');
    fs.mkdirSync(typesDir, { recursive: true });
    fs.mkdirSync(srcDir, { recursive: true });

    // Create config-map.json with EXACT relative path
    const configMap = {
      'src/test.config.ts': 'TestConfig'
    };
    fs.writeFileSync(path.join(typesDir, 'config-map.json'), JSON.stringify(configMap, null, 2));

    // Create schema.json
    const schema = {
      $defs: {
        TestConfig: {
          type: 'object',
          properties: {
            name: { type: 'string' }
          },
          required: ['name']
        }
      }
    };
    fs.writeFileSync(path.join(typesDir, 'schema.json'), JSON.stringify(schema, null, 2));

    // Create test config file
    fs.writeFileSync(path.join(srcDir, 'test.config.ts'), 'export default { name: "test" };');

    try {
      const validConfig = { name: 'John' };
      await validateConfigWithJsonSchema('src/test.config.ts', validConfig);
    } catch (error) {
      console.log('Debug error:', (error as Error).message);
      console.log('Temp dir:', tempDir);
      console.log('CWD:', process.cwd());
      
      // List files for debugging
      console.log('Config map contents:', JSON.parse(fs.readFileSync(path.join(typesDir, 'config-map.json'), 'utf8')));
      
      throw error;
    }
  });
});