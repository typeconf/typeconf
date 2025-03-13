import { z } from "zod";

export const ProductSettingsSchema = z.object({
  breakEverything: z.boolean(),
  randomnessRatio: z.number(),
  formulaCoeff: z.number(),
  tags: z.array(z.string()),
});

export const CountrySettingsSchema = z.object({
  byCountryAndRegion: z.map(
    z.string(),
    z.map(z.string(), ProductSettingsSchema),
  ),
});
export namespace TypeSpec {}

const TYPECONF_SCHEMAS_MAP = {
  "/home/ivan/root/data/dev/typeconf/examples/country-based-conf/src/values.config.ts":
    CountrySettingsSchema,
};

export default TYPECONF_SCHEMAS_MAP;
