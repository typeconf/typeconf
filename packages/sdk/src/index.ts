import fs from "fs";
import { isCloudEnabled, typeconfCloud } from "./cloud/cloud.js";
import path from "path";
import { createJiti } from "jiti";
import { validateConfigWithJsonSchema } from "./json-schema-validator.js";

export type ReadConfigOptions = {
  disableValidation?: boolean;
};

export function readConfigFromFile<T>(filepath: string): T {
  const data = fs.readFileSync(filepath, "utf8");
  return JSON.parse(data) as T;
}

type ConfigInfo = {
  configId: string;
  configDir: string;
  schemasPath: string;
  valuesPath: string;
};

function resolveConfigPathRemote(configId: string): ConfigInfo {
  const configIdResolved = path.normalize(configId.endsWith('.config.ts') ? configId : `${configId}.config.ts`);
  return {
    configId: configIdResolved,
    // TODO: we need to find a way to get information about schemas in the runtime where we don't have access to the file system
    configDir: '',
    schemasPath: '',
    valuesPath: ''
  }
}

function resolveConfigPath(configId: string): ConfigInfo {
  const configPath = configId.endsWith('.config.ts') ? configId : `${configId}.config.ts`;
  const absConfigPath = path.resolve(process.cwd(), configPath);

  if (!fs.existsSync(absConfigPath)) {
    throw new Error(`Config file not found: ${absConfigPath}`);
  }


  // Walk up directories looking for types/all.zod.ts
  let currentDir = path.dirname(absConfigPath);
  let configDir = null;
  let schemasPath = null;
  while (currentDir !== '/') {
    const potentialSchemasPath = path.join(currentDir, 'types', 'all.zod.ts');
    if (fs.existsSync(potentialSchemasPath)) {
      configDir = currentDir;
      schemasPath = potentialSchemasPath;
      break;
    }
    currentDir = path.dirname(currentDir);
  }

  if (!configDir || !schemasPath) {
    throw new Error(`Could not find types/all.zod.ts in parent directories of ${absConfigPath}`);
  }

  const relPath = path.relative(configDir, path.dirname(configPath));
  const configName = path.basename(configPath, '.config.ts');
  const valuesPath = path.join(configDir, 'out', relPath, `${configName}.json`);

  return {
    configId: path.relative(path.dirname(configDir), absConfigPath),
    configDir,
    schemasPath,
    valuesPath
  };
}

async function validateConfig<T>(configInfo: ConfigInfo, values: any): Promise<T> {
  const jiti = createJiti(configInfo.configDir, {
    debug: false,
    fsCache: false,
    moduleCache: false,
  });
  const schemas = await jiti.import(`${configInfo.schemasPath}`) as any;
  const schema = schemas?.default[configInfo.configId];
  return schema.parse(values);
}


export async function readConfig<T>(filepath: string, options: ReadConfigOptions = {}): Promise<T> {
  if (filepath.endsWith('.json')) {
    return readConfigFromFile<T>(filepath);
  }

  if (isCloudEnabled()) {
    const configInfo = resolveConfigPathRemote(filepath);
    const result = await typeconfCloud().readConfig<T>(configInfo.configId);

    if (result.err) throw result.err;

    if (!result.config) throw new Error("No config found");

    // Try to validate cloud config with JSON Schema if available locally (unless disabled)
    if (!options.disableValidation) {
      try {
        await validateConfigWithJsonSchema(configInfo.configId, result.config);
      } catch (error) {
        // Validation is optional for cloud configs, just log and continue
        // This might fail in browser environments or when AJV can't be loaded
        console.warn('Cloud config validation failed:', error);
      }
    }

    return result.config;
  }

  const configInfo = resolveConfigPath(filepath);
  const values = readConfigFromFile<T>(configInfo.valuesPath);

  // If validation is disabled, return values without validation
  if (options.disableValidation) {
    return values;
  }

  // Try to use JSON Schema validation first if config-map.json and schema.json exist
  const configMapPath = path.join(configInfo.configDir, 'types', 'config-map.json');
  const schemaPath = path.join(configInfo.configDir, 'types', 'schema.json');

  let jsonSchemaSuccess = false;
  if (fs.existsSync(configMapPath) && fs.existsSync(schemaPath)) {
    try {
      const result = await validateConfigWithJsonSchema<T>(configInfo.configId, values);
      jsonSchemaSuccess = true;
      return result;
    } catch (error) {
      // If JSON Schema validation fails, fall back to Zod validation
      // This might fail in browser environments or when AJV can't be loaded
      console.warn('JSON Schema validation failed, falling back to Zod validation:', error);
    }
  }

  // Use Zod validation as fallback (this will use JITI) - only if JSON Schema didn't succeed
  if (!jsonSchemaSuccess) {
    return validateConfig<T>(configInfo, values);
  }

  // This should never be reached, but return values as fallback
  return values;
}

export const privateExports = {
  resolveConfigPath,
  validateConfig,
  validateConfigWithJsonSchema,
}
