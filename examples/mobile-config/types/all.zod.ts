import { z } from "zod";

export const MobileFeatureConfigSchema = z.object({
  platformConfigs: z.map(
    z.string(),
    z.object({
      versionConfigs: z.map(
        z.string(),
        z.object({
          enablePushNotifications: z.boolean(),
          adFrequency: z.number(),
          featureToggles: z.map(z.string(), z.boolean()),
        }),
      ),
    }),
  ),
});
export namespace TypeSpec {}

const TYPECONF_SCHEMAS_MAP = {
  "mobile-config/src/values.config.ts": MobileFeatureConfigSchema,
};

export default TYPECONF_SCHEMAS_MAP;
