import { z } from "zod";

export const MobileFeatureConfigSchema = z.object({
  platformConfigs: z.record(
    z.string(),
    z.object({
      versionConfigs: z.record(
        z.string(),
        z.object({
          enablePushNotifications: z.boolean(),
          adFrequency: z.number(),
          featureToggles: z.record(z.string(), z.boolean()),
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
