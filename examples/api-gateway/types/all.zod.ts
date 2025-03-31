import { z } from "zod";

export const RouteSchema = z.object({
  path: z.string(),
  backend: z.string(),
  rateLimit: z.number(),
});

export const APIGatewayConfigSchema = z.object({
  routes: z.map(z.string(), RouteSchema),
});
export namespace TypeSpec {}

const TYPECONF_SCHEMAS_MAP = {
  "/home/ivan/root/data/dev/typeconf/examples/api-gateway/src/values.config.ts":
    APIGatewayConfigSchema,
};

export default TYPECONF_SCHEMAS_MAP;
