import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { privateExports, readConfig } from '../index.js';
import path from 'path';
import fs from 'fs';
import os from 'os';

const { validateConfigWithJsonSchema } = privateExports;

describe('Working JSON Schema validation', () => {
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

  it('should validate directly with JSON Schema', async () => {
    // Create test directory structure
    const typesDir = path.join(tempDir, 'types');
    const srcDir = path.join(tempDir, 'src');
    fs.mkdirSync(typesDir, { recursive: true });
    fs.mkdirSync(srcDir, { recursive: true });

    // Create config-map.json with exact path
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
            name: { type: 'string' },
            age: { type: 'number' }
          },
          required: ['name', 'age']
        }
      }
    };
    fs.writeFileSync(path.join(typesDir, 'schema.json'), JSON.stringify(schema, null, 2));

    // Create test config file
    fs.writeFileSync(path.join(srcDir, 'test.config.ts'), 'export default {};');

    // Test validation directly
    const validConfig = { name: 'John', age: 30 };
    const result = await validateConfigWithJsonSchema('src/test.config.ts', validConfig);
    expect(result).toEqual(validConfig);
  });

  it('should fail validation with invalid data', async () => {
    // Create test directory structure
    const typesDir = path.join(tempDir, 'types');
    const srcDir = path.join(tempDir, 'src');
    fs.mkdirSync(typesDir, { recursive: true });
    fs.mkdirSync(srcDir, { recursive: true });

    // Create config-map.json
    const configMap = {
      'src/test.config.ts': 'TestConfig'
    };
    fs.writeFileSync(path.join(typesDir, 'config-map.json'), JSON.stringify(configMap, null, 2));

    // Create schema.json with required fields
    const schema = {
      $defs: {
        TestConfig: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          },
          required: ['name', 'age']
        }
      }
    };
    fs.writeFileSync(path.join(typesDir, 'schema.json'), JSON.stringify(schema, null, 2));

    // Create test config file
    fs.writeFileSync(path.join(srcDir, 'test.config.ts'), 'export default {};');

    // Test validation with missing required field
    const invalidConfig = { name: 'John' }; // missing age
    await expect(
      validateConfigWithJsonSchema('src/test.config.ts', invalidConfig)
    ).rejects.toThrow('Validation failed');
  });

  it('should read JSON file directly without validation', async () => {
    const configValues = {
      directJson: true,
      value: 123
    };
    
    const jsonPath = path.join(tempDir, 'direct.json');
    fs.writeFileSync(jsonPath, JSON.stringify(configValues, null, 2));

    const result = await readConfig<typeof configValues>(jsonPath);
    expect(result).toEqual(configValues);
  });
});