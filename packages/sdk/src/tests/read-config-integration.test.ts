import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { readConfig } from '../index.js';
import path from 'path';
import fs from 'fs';
import os from 'os';

describe('readConfig with JSON Schema integration', () => {
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

  it('should use JSON Schema validation when config-map.json and schema.json exist', async () => {
    // Create test directory structure
    const typesDir = path.join(tempDir, 'types');
    const srcDir = path.join(tempDir, 'src');
    const outDir = path.join(tempDir, 'out', 'src');
    fs.mkdirSync(typesDir, { recursive: true });
    fs.mkdirSync(srcDir, { recursive: true });
    fs.mkdirSync(outDir, { recursive: true });

    // Create config-map.json
    const configMap = {
      'src/values.config.ts': 'ProjectConfig'
    };
    fs.writeFileSync(path.join(typesDir, 'config-map.json'), JSON.stringify(configMap, null, 2));

    // Create schema.json
    const schema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'schema.json',
      $defs: {
        ProjectConfig: {
          type: 'object',
          properties: {
            projectName: { type: 'string' },
            version: { type: 'string' },
            features: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['projectName', 'version']
        }
      }
    };
    fs.writeFileSync(path.join(typesDir, 'schema.json'), JSON.stringify(schema, null, 2));

    // Create config file
    fs.writeFileSync(path.join(srcDir, 'values.config.ts'), `
      export default {
        projectName: "test-project",
        version: "1.0.0",
        features: ["auth", "analytics"]
      };
    `);

    // Create values.json (the compiled config)
    const configValues = {
      projectName: "test-project",
      version: "1.0.0",
      features: ["auth", "analytics"]
    };
    fs.writeFileSync(path.join(outDir, 'values.json'), JSON.stringify(configValues, null, 2));

    // Create dummy all.zod.ts for fallback (but it shouldn't be used)
    fs.writeFileSync(path.join(typesDir, 'all.zod.ts'), `
      const { z } = require('zod');
      module.exports = {
        default: {
          'src/values.config.ts': z.object({
            projectName: z.string(),
            version: z.string(),
            features: z.array(z.string()).optional()
          })
        }
      };
    `);

    // Test reading config - should use JSON Schema validation
    const result = await readConfig<typeof configValues>('src/values.config.ts');
    expect(result).toEqual(configValues);
  });

  it('should fallback to Zod validation when JSON Schema files are missing', async () => {
    // Create test directory structure without JSON Schema files
    const typesDir = path.join(tempDir, 'types');
    const srcDir = path.join(tempDir, 'src');
    const outDir = path.join(tempDir, 'out', 'src');
    fs.mkdirSync(typesDir, { recursive: true });
    fs.mkdirSync(srcDir, { recursive: true });
    fs.mkdirSync(outDir, { recursive: true });

    // Create config file
    fs.writeFileSync(path.join(srcDir, 'values.config.ts'), `
      export default {
        name: "fallback-test",
        count: 42
      };
    `);

    // Create values.json
    const configValues = {
      name: "fallback-test",
      count: 42
    };
    fs.writeFileSync(path.join(outDir, 'values.json'), JSON.stringify(configValues, null, 2));

    // Create all.zod.ts for Zod validation
    fs.writeFileSync(path.join(typesDir, 'all.zod.ts'), `
      const { z } = require('zod');
      module.exports = {
        default: {
          'src/values.config.ts': z.object({
            name: z.string(),
            count: z.number()
          })
        }
      };
    `);

    // Test reading config - should fallback to Zod validation
    const result = await readConfig<typeof configValues>('src/values.config.ts');
    expect(result).toEqual(configValues);
  });

  it('should fallback to Zod validation when JSON Schema validation fails', async () => {
    // Create test directory structure
    const typesDir = path.join(tempDir, 'types');
    const srcDir = path.join(tempDir, 'src');
    const outDir = path.join(tempDir, 'out', 'src');
    fs.mkdirSync(typesDir, { recursive: true });
    fs.mkdirSync(srcDir, { recursive: true });
    fs.mkdirSync(outDir, { recursive: true });

    // Create config-map.json with wrong mapping
    const configMap = {
      'src/values.config.ts': 'NonExistentConfig'
    };
    fs.writeFileSync(path.join(typesDir, 'config-map.json'), JSON.stringify(configMap, null, 2));

    // Create schema.json without the expected config type
    const schema = {
      $defs: {
        OtherConfig: {
          type: 'object',
          properties: {
            other: { type: 'string' }
          }
        }
      }
    };
    fs.writeFileSync(path.join(typesDir, 'schema.json'), JSON.stringify(schema, null, 2));

    // Create config file
    fs.writeFileSync(path.join(srcDir, 'values.config.ts'), `
      export default {
        name: "fallback-test",
        count: 42
      };
    `);

    // Create values.json
    const configValues = {
      name: "fallback-test",
      count: 42
    };
    fs.writeFileSync(path.join(outDir, 'values.json'), JSON.stringify(configValues, null, 2));

    // Create all.zod.ts for Zod validation fallback
    fs.writeFileSync(path.join(typesDir, 'all.zod.ts'), `
      const { z } = require('zod');
      module.exports = {
        default: {
          'src/values.config.ts': z.object({
            name: z.string(),
            count: z.number()
          })
        }
      };
    `);

    // Test reading config - should fallback to Zod validation after JSON Schema fails
    const result = await readConfig<typeof configValues>('src/values.config.ts');
    expect(result).toEqual(configValues);
  });

  it('should handle complex nested config validation with JSON Schema', async () => {
    // Create test directory structure
    const typesDir = path.join(tempDir, 'types');
    const srcDir = path.join(tempDir, 'src');
    const outDir = path.join(tempDir, 'out', 'src');
    fs.mkdirSync(typesDir, { recursive: true });
    fs.mkdirSync(srcDir, { recursive: true });
    fs.mkdirSync(outDir, { recursive: true });

    // Create config-map.json
    const configMap = {
      'src/complex.config.ts': 'ComplexConfig'
    };
    fs.writeFileSync(path.join(typesDir, 'config-map.json'), JSON.stringify(configMap, null, 2));

    // Create schema.json with complex nested structure
    const schema = {
      $defs: {
        ComplexConfig: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                host: { type: 'string' },
                port: { type: 'number' },
                credentials: {
                  type: 'object',
                  properties: {
                    username: { type: 'string' },
                    password: { type: 'string' }
                  },
                  required: ['username', 'password']
                }
              },
              required: ['host', 'port', 'credentials']
            },
            services: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  enabled: { type: 'boolean' },
                  config: { type: 'object' }
                },
                required: ['name', 'enabled']
              }
            }
          },
          required: ['database', 'services']
        }
      }
    };
    fs.writeFileSync(path.join(typesDir, 'schema.json'), JSON.stringify(schema, null, 2));

    // Create config file
    fs.writeFileSync(path.join(srcDir, 'complex.config.ts'), 'export default {};');

    // Create complex values.json
    const complexConfig = {
      database: {
        host: 'localhost',
        port: 5432,
        credentials: {
          username: 'admin',
          password: 'secret'
        }
      },
      services: [
        {
          name: 'auth',
          enabled: true,
          config: { timeout: 30 }
        },
        {
          name: 'logging',
          enabled: false
        }
      ]
    };
    fs.writeFileSync(path.join(outDir, 'complex.json'), JSON.stringify(complexConfig, null, 2));

    // Create all.zod.ts for potential fallback
    fs.writeFileSync(path.join(typesDir, 'all.zod.ts'), `
      const { z } = require('zod');
      module.exports = {
        default: {
          'src/complex.config.ts': z.object({
            database: z.object({
              host: z.string(),
              port: z.number(),
              credentials: z.object({
                username: z.string(),
                password: z.string()
              })
            }),
            services: z.array(z.object({
              name: z.string(),
              enabled: z.boolean(),
              config: z.object({}).optional()
            }))
          })
        }
      };
    `);

    // Test reading config with complex validation
    const result = await readConfig<typeof complexConfig>('src/complex.config.ts');
    expect(result).toEqual(complexConfig);
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