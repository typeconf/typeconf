import { z } from "@typeconf/sdk/zod-shim";

export const ProjectConfigSchema = z.object({
  projectName: z.string(),
});

export const PackageExportsSchema = z.object({
  types: z.string(),
  default: z.string(),
});

export const PackageJsonSchema = z.object({
  name: z.string(),
  version: z.string(),
  type: z.string(),
  main: z.string(),
  keywords: z.array(z.string()),
  exports: z.map(z.string(), PackageExportsSchema),
  dependencies: z.map(z.string(), z.string()).optional(),
  devDependencies: z.map(z.string(), z.string()).optional(),
  scripts: z.map(z.string(), z.string()).optional(),
});
export namespace TypeSpec {}
