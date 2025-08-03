import fs from "fs";
import path from "path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
const { default: Ajv } = Ajv2020;

export async function validateConfigWithJsonSchema<T>(configId: string, values: any): Promise<T> {
  
  // Resolve config paths to find the config-map.json and schema.json
  const configPath = configId.endsWith('.config.ts') ? configId : `${configId}.config.ts`;
  const absConfigPath = path.resolve(process.cwd(), configPath);

  // Walk up directories looking for types directory
  let currentDir = path.dirname(absConfigPath);
  let configDir = null;
  let configMapPath = null;
  let schemaPath = null;

  while (currentDir !== path.parse(currentDir).root) {
    const potentialConfigMapPath = path.join(currentDir, 'types', 'config-map.json');
    const potentialSchemaPath = path.join(currentDir, 'types', 'schema.json');

    if (fs.existsSync(potentialConfigMapPath) && fs.existsSync(potentialSchemaPath)) {
      configDir = currentDir;
      configMapPath = potentialConfigMapPath;
      schemaPath = potentialSchemaPath;
      break;
    }
    currentDir = path.dirname(currentDir);
  }

  if (!configMapPath || !schemaPath) {
    throw new Error(`Could not find config-map.json and schema.json in parent directories of ${absConfigPath}`);
  }

  // Read config-map.json to get the type name for this config
  const configMap = JSON.parse(fs.readFileSync(configMapPath, 'utf8'));

  // Try different path formats to find the config in the map
  const relativeToConfigDir = path.relative(configDir!, absConfigPath);
  const possiblePaths = [
    configId,
    configPath,
    relativeToConfigDir,
    relativeToConfigDir.replace(/\\/g, '/'), // normalize path separators for cross-platform
    configId.replace(/\\/g, '/'),
    configPath.replace(/\\/g, '/')
  ];

  let typeName = null;
  for (const possiblePath of possiblePaths) {
    if (configMap[possiblePath]) {
      typeName = configMap[possiblePath];
      break;
    }
  }

  if (!typeName) {
    throw new Error(`No type mapping found for config ID. Tried: ${possiblePaths.join(', ')}`);
  }

  // Read the JSON schema
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

  // Get the specific schema definition for the type
  const typeSchema = schema.$defs?.[typeName];
  if (!typeSchema) {
    throw new Error(`No schema definition found for type: ${typeName}`);
  }

  // Create AJV instance and validate
  // Remove problematic $schema and $id references from the type schema
  const cleanTypeSchema = { ...typeSchema };
  delete cleanTypeSchema.$schema;
  delete cleanTypeSchema.$id;
  
  // Fix external JSON references by converting them to internal $defs references
  const fixReferences = (obj: any, visited: Set<any> = new Set()): any => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    // Prevent infinite recursion
    if (visited.has(obj)) return obj;
    visited.add(obj);
    
    if (Array.isArray(obj)) {
      return obj.map(item => fixReferences(item, visited));
    }
    
    const result = { ...obj };
    for (const [key, value] of Object.entries(result)) {
      if (key === '$ref' && typeof value === 'string') {
        // Handle all types of JSON file references
        if (value.includes('.json')) {
          if (value.includes('#/$defs/')) {
            // Convert reference like "Cta.json#/$defs/MarketingCopy" to just "#/$defs/MarketingCopy"
            result[key] = value.substring(value.indexOf('#'));
          } else if (value.endsWith('.json')) {
            // Convert external reference like "Testimonial.json" to internal reference "#/$defs/Testimonial"
            const typeName = value.replace('.json', '');
            result[key] = `#/$defs/${typeName}`;
          }
        }
      } else if (key === '$id' && typeof value === 'string' && value.endsWith('.json')) {
        // Remove problematic $id references that point to JSON files
        delete result[key];
      } else {
        result[key] = fixReferences(value, visited);
      }
    }
    return result;
  };
  
  const ajv = new Ajv({ strict: false });
  (addFormats as any)(ajv);
  
  // Add custom duration format that accepts human-readable durations like "1.5s", "2m", "1h"
  ajv.addFormat("duration", {
    type: "string",
    validate: (value: string) => {
      // Accept both ISO 8601 durations (PT1.5S) and human-readable formats (1.5s, 2m, 1h, etc.)
      const iso8601Duration = /^P(?:\d+Y)?(?:\d+M)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+(?:\.\d+)?S)?)?$/;
      const humanReadable = /^\d+(?:\.\d+)?(ns|us|µs|ms|s|m|h|d)$/;
      return iso8601Duration.test(value) || humanReadable.test(value);
    }
  });
  
  // First, fix all references in the entire schema to avoid resolution issues
  const fixedCompleteSchema = fixReferences(schema);
  
  // Clean the root schema by removing problematic $schema and $id references
  const cleanedSchema = { ...fixedCompleteSchema };
  delete cleanedSchema.$schema;
  delete cleanedSchema.$id;
  
  // Create a complete schema with the target type and all definitions so references can be resolved
  const completeSchema: any = {
    ...cleanedSchema.$defs?.[typeName],
    $defs: cleanedSchema.$defs || {}
  };
  
  const validate = ajv.compile(completeSchema);
  const valid = validate(values);

  if (!valid) {
    throw new Error(`Validation failed: ${ajv.errorsText(validate.errors)}`);
  }

  return values as T;
}