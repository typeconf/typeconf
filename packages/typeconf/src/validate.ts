import { Ajv2020 as Ajv } from 'ajv/dist/2020.js';

interface ValidationError {
  message: string;
  path?: string;
}

export function validateConfig<T>(config: any, schema: any): ValidationError[] {
  const ajv = new Ajv({
    allErrors: true,
    verbose: true,
    strict: true,
    schemas: [schema],
  });

  const name = (typeof T)['name'] + '.json';
  const validate = ajv.getSchema(name);
  if (!validate) {
    throw new Error("Schema not found");
  }
  const valid = validate(config);

  if (valid) {
    return [];
  }

  return (validate.errors || []).map((error: any) => ({
    message: error.message || 'Unknown validation error',
    path: error.instancePath
  }));
}