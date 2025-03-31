import { z } from "zod";

export const CatsInventorySchema = z.object({
  cats: z.array(z.string()),
  cutenessRatio: z.number(),
});

export const DebuggingConfigSchema = z.object({
  logLevel: z.number(),
  maxRetries: z.number(),
  timeout: z.any(),
});

export const ProjectConfigSchema = z.object({
  projectName: z.string(),
  inventory: CatsInventorySchema,
  debugging: DebuggingConfigSchema,
});

const TYPECONF_SCHEMAS_MAP = {
  "simple/src/values.config.ts": ProjectConfigSchema,
};

export default TYPECONF_SCHEMAS_MAP;
