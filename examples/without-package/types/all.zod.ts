import { z } from "zod";

export const ConfSchema = z.object({
  number: z.number(),
});

const TYPECONF_SCHEMAS_MAP = {
  "/home/ivan/root/data/dev/typeconf/examples/without-package/values.config.ts":
    ConfSchema,
};

export default TYPECONF_SCHEMAS_MAP;
