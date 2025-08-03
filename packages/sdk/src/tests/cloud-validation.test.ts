import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { readConfig } from '../index.js';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Mock the cloud module
const mockReadConfig = vi.fn();

vi.mock('../cloud/cloud.js', () => ({
  isCloudEnabled: () => true,
  typeconfCloud: () => ({
    readConfig: mockReadConfig
  })
}));

describe('Cloud config validation', () => {
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
    mockReadConfig.mockClear();
  });

  it('should validate cloud config with local JSON Schema when available', async () => {
    // Mock cloud response
    const mockCloudResponse = {
      err: undefined,
      config: {
        projectName: "cloud-project",
        version: "2.0.0",
        features: ["auth", "analytics", "logging"]
      }
    };
    
    mockReadConfig.mockResolvedValue(mockCloudResponse);

    // Create local schema files for validation
    const typesDir = path.join(tempDir, 'types');
    fs.mkdirSync(typesDir, { recursive: true });

    // Create config-map.json
    const configMap = {
      'Config1': 'ProjectConfig'
    };
    fs.writeFileSync(path.join(typesDir, 'config-map.json'), JSON.stringify(configMap, null, 2));

    // Create schema.json
    const schema = {
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

    // Test reading cloud config
    const result = await readConfig('Config1');
    expect(result).toEqual(mockCloudResponse.config);
    expect(mockReadConfig).toHaveBeenCalledWith('Config1.config.ts');
  });

  it('should handle cloud config without local schema files', async () => {
    // Mock cloud response
    const mockCloudResponse = {
      err: undefined,
      config: {
        someValue: "test-value"
      }
    };
    
    mockReadConfig.mockResolvedValue(mockCloudResponse);

    // No local schema files created - should still work without validation
    const result = await readConfig('SomeConfig');
    expect(result).toEqual(mockCloudResponse.config);
    expect(mockReadConfig).toHaveBeenCalledWith('SomeConfig.config.ts');
  });

  it('should handle cloud config validation errors gracefully', async () => {
    // Mock cloud response with data that won't match schema
    const mockCloudResponse = {
      err: undefined,
      config: {
        invalidField: "this doesn't match schema"
      }
    };
    
    mockReadConfig.mockResolvedValue(mockCloudResponse);

    // Create local schema files that won't match the cloud data
    const typesDir = path.join(tempDir, 'types');
    fs.mkdirSync(typesDir, { recursive: true });

    const configMap = {
      'TestConfig': 'StrictConfig'
    };
    fs.writeFileSync(path.join(typesDir, 'config-map.json'), JSON.stringify(configMap, null, 2));

    const schema = {
      $defs: {
        StrictConfig: {
          type: 'object',
          properties: {
            requiredField: { type: 'string' }
          },
          required: ['requiredField'],
          additionalProperties: false
        }
      }
    };
    fs.writeFileSync(path.join(typesDir, 'schema.json'), JSON.stringify(schema, null, 2));

    // Should still return the config even if validation fails
    const result = await readConfig('TestConfig');
    expect(result).toEqual(mockCloudResponse.config);
  });
});