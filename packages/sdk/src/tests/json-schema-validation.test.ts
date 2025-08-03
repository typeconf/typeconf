import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { privateExports } from '../index.js';
import path from 'path';
import fs from 'fs';
import os from 'os';

const { validateConfigWithJsonSchema } = privateExports;

describe('validateConfigWithJsonSchema', () => {
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

  it('should validate config successfully with JSON schema', async () => {
    // Create test directory structure
    const typesDir = path.join(tempDir, 'types');
    const srcDir = path.join(tempDir, 'src');
    fs.mkdirSync(typesDir, { recursive: true });
    fs.mkdirSync(srcDir, { recursive: true });

    // Create config-map.json - use relative path from temp directory
    const configMap = {
      'src/test.config.ts': 'TestConfig'
    };
    fs.writeFileSync(path.join(typesDir, 'config-map.json'), JSON.stringify(configMap, null, 2));

    // Create schema.json
    const schema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'schema.json',
      $defs: {
        TestConfig: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
            active: { type: 'boolean' }
          },
          required: ['name', 'age']
        }
      }
    };
    fs.writeFileSync(path.join(typesDir, 'schema.json'), JSON.stringify(schema, null, 2));

    // Create test config file
    fs.writeFileSync(path.join(srcDir, 'test.config.ts'), 'export default { name: "test", age: 25, active: true };');

    // Test valid config
    const validConfig = { name: 'John', age: 30, active: true };
    const result = await validateConfigWithJsonSchema('src/test.config.ts', validConfig);
    expect(result).toEqual(validConfig);
  });

  it('should throw error when config-map.json is missing', async () => {
    const srcDir = path.join(tempDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'test.config.ts'), 'export default {};');

    await expect(
      validateConfigWithJsonSchema('src/test.config.ts', {})
    ).rejects.toThrow('Could not find config-map.json and schema.json');
  });

  it('should throw error when schema.json is missing', async () => {
    const typesDir = path.join(tempDir, 'types');
    const srcDir = path.join(tempDir, 'src');
    fs.mkdirSync(typesDir, { recursive: true });
    fs.mkdirSync(srcDir, { recursive: true });

    // Only create config-map.json, not schema.json
    const configMap = { 'src/test.config.ts': 'TestConfig' };
    fs.writeFileSync(path.join(typesDir, 'config-map.json'), JSON.stringify(configMap, null, 2));
    fs.writeFileSync(path.join(srcDir, 'test.config.ts'), 'export default {};');

    await expect(
      validateConfigWithJsonSchema('src/test.config.ts', {})
    ).rejects.toThrow('Could not find config-map.json and schema.json');
  });

  it('should throw error when config ID is not found in config-map', async () => {
    const typesDir = path.join(tempDir, 'types');
    const srcDir = path.join(tempDir, 'src');
    fs.mkdirSync(typesDir, { recursive: true });
    fs.mkdirSync(srcDir, { recursive: true });

    // Create config-map.json without the test config
    const configMap = { 'src/other.config.ts': 'OtherConfig' };
    fs.writeFileSync(path.join(typesDir, 'config-map.json'), JSON.stringify(configMap, null, 2));

    // Create empty schema.json
    const schema = { $defs: {} };
    fs.writeFileSync(path.join(typesDir, 'schema.json'), JSON.stringify(schema, null, 2));

    fs.writeFileSync(path.join(srcDir, 'test.config.ts'), 'export default {};');

    await expect(
      validateConfigWithJsonSchema('src/test.config.ts', {})
    ).rejects.toThrow('No type mapping found for config ID');
  });

  it('should throw error when schema definition is not found', async () => {
    const typesDir = path.join(tempDir, 'types');
    const srcDir = path.join(tempDir, 'src');
    fs.mkdirSync(typesDir, { recursive: true });
    fs.mkdirSync(srcDir, { recursive: true });

    // Create config-map.json
    const configMap = { 'src/test.config.ts': 'TestConfig' };
    fs.writeFileSync(path.join(typesDir, 'config-map.json'), JSON.stringify(configMap, null, 2));

    // Create schema.json without TestConfig definition
    const schema = { $defs: { OtherConfig: { type: 'object' } } };
    fs.writeFileSync(path.join(typesDir, 'schema.json'), JSON.stringify(schema, null, 2));

    fs.writeFileSync(path.join(srcDir, 'test.config.ts'), 'export default {};');

    await expect(
      validateConfigWithJsonSchema('src/test.config.ts', {})
    ).rejects.toThrow('No schema definition found for type: TestConfig');
  });

  it('should throw validation error for invalid config data', async () => {
    const typesDir = path.join(tempDir, 'types');
    const srcDir = path.join(tempDir, 'src');
    fs.mkdirSync(typesDir, { recursive: true });
    fs.mkdirSync(srcDir, { recursive: true });

    // Create config-map.json
    const configMap = { 'src/test.config.ts': 'TestConfig' };
    fs.writeFileSync(path.join(typesDir, 'config-map.json'), JSON.stringify(configMap, null, 2));

    // Create schema.json with strict validation
    const schema = {
      $defs: {
        TestConfig: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          },
          required: ['name', 'age'],
          additionalProperties: false
        }
      }
    };
    fs.writeFileSync(path.join(typesDir, 'schema.json'), JSON.stringify(schema, null, 2));

    fs.writeFileSync(path.join(srcDir, 'test.config.ts'), 'export default {};');

    // Test with missing required properties
    const invalidConfig = { name: 'John' }; // missing 'age'
    await expect(
      validateConfigWithJsonSchema('src/test.config.ts', invalidConfig)
    ).rejects.toThrow('Validation failed');
  });

  it('should work with nested directory structure', async () => {
    const nestedDir = path.join(tempDir, 'project', 'configs');
    const typesDir = path.join(tempDir, 'types');
    fs.mkdirSync(nestedDir, { recursive: true });
    fs.mkdirSync(typesDir, { recursive: true });

    // Create config-map.json
    const configMap = { 'project/configs/nested.config.ts': 'NestedConfig' };
    fs.writeFileSync(path.join(typesDir, 'config-map.json'), JSON.stringify(configMap, null, 2));

    // Create schema.json
    const schema = {
      $defs: {
        NestedConfig: {
          type: 'object',
          properties: {
            value: { type: 'string' }
          },
          required: ['value']
        }
      }
    };
    fs.writeFileSync(path.join(typesDir, 'schema.json'), JSON.stringify(schema, null, 2));

    fs.writeFileSync(path.join(nestedDir, 'nested.config.ts'), 'export default {};');

    const validConfig = { value: 'test' };
    const result = await validateConfigWithJsonSchema('project/configs/nested.config.ts', validConfig);
    expect(result).toEqual(validConfig);
  });

  it('should handle complex schema with arrays and objects', async () => {
    const typesDir = path.join(tempDir, 'types');
    const srcDir = path.join(tempDir, 'src');
    fs.mkdirSync(typesDir, { recursive: true });
    fs.mkdirSync(srcDir, { recursive: true });

    // Create config-map.json
    const configMap = { 'src/complex.config.ts': 'ComplexConfig' };
    fs.writeFileSync(path.join(typesDir, 'config-map.json'), JSON.stringify(configMap, null, 2));

    // Create schema.json with complex structure
    const schema = {
      $defs: {
        ComplexConfig: {
          type: 'object',
          properties: {
            users: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  settings: {
                    type: 'object',
                    properties: {
                      theme: { type: 'string', enum: ['light', 'dark'] },
                      notifications: { type: 'boolean' }
                    },
                    required: ['theme']
                  }
                },
                required: ['id', 'name', 'settings']
              }
            }
          },
          required: ['users']
        }
      }
    };
    fs.writeFileSync(path.join(typesDir, 'schema.json'), JSON.stringify(schema, null, 2));

    fs.writeFileSync(path.join(srcDir, 'complex.config.ts'), 'export default {};');

    const complexConfig = {
      users: [
        {
          id: 1,
          name: 'Alice',
          settings: {
            theme: 'dark',
            notifications: true
          }
        },
        {
          id: 2,
          name: 'Bob',
          settings: {
            theme: 'light'
          }
        }
      ]
    };

    const result = await validateConfigWithJsonSchema('src/complex.config.ts', complexConfig);
    expect(result).toEqual(complexConfig);
  });

  it('should handle config files with .config.ts extension in path', async () => {
    const typesDir = path.join(tempDir, 'types');
    const srcDir = path.join(tempDir, 'src');
    fs.mkdirSync(typesDir, { recursive: true });
    fs.mkdirSync(srcDir, { recursive: true });

    // Create config-map.json
    const configMap = { 'src/test.config.ts': 'TestConfig' };
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

    fs.writeFileSync(path.join(srcDir, 'test.config.ts'), 'export default {};');

    const validConfig = { name: 'test' };
    
    // Test both with and without .config.ts extension
    const result1 = await validateConfigWithJsonSchema('src/test.config.ts', validConfig);
    const result2 = await validateConfigWithJsonSchema('src/test', validConfig);
    
    expect(result1).toEqual(validConfig);
    expect(result2).toEqual(validConfig);
  });
});