import { z } from "zod";

export const MyTestConfigSchema = z.object({
  someValue1: z.string(),
  someValue2: z.any(),
  someValue3: z.array(z.string()),
  someValue4: z.array(z.object({ key: z.string(), val: z.any() })),
});

const TYPECONF_SCHEMAS_MAP = {
  "config-package/src/values.config.ts": MyTestConfigSchema,
};

export default TYPECONF_SCHEMAS_MAP;
