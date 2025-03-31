import { z } from "zod";

export const OldServiceSchema = z.object({
  oldParam: z.string(),
  commonValues: z.array(z.number()),
});

export const NewServiceSchema = z.object({
  newAndShinyParam: z.string(),
  commonValues: z.array(z.number()),
});

const TYPECONF_SCHEMAS_MAP = {
  "two-configs/new-service.config.ts": NewServiceSchema,
  "two-configs/old-service.config.ts": OldServiceSchema,
};

export default TYPECONF_SCHEMAS_MAP;
