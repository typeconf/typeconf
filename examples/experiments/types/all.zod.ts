import { z } from "zod";

export const ProjectConfigSchema = z.object({
  enable_new_way_of_routing: z.boolean(),
  rollout_this_feature_by_user: z.map(z.string(), z.boolean()),
  mobile_rollout: z.map(z.string(), z.boolean()),
});
export namespace TypeSpec {}

const TYPECONF_SCHEMAS_MAP = {
  "/home/ivan/root/data/dev/typeconf/examples/experiments/src/values.config.ts":
    ProjectConfigSchema,
};

export default TYPECONF_SCHEMAS_MAP;
