import { createTypeSpecLibrary, JSONSchemaType } from "@typespec/compiler";

export interface EmitterOptions {
  "output-file"?: string;
  "zod-output-file"?: string;
  "schema-prefix"?: string;
  "schema-suffix"?: string;
}

const EmitterOptionsSchema: JSONSchemaType<EmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    "output-file": { type: "string", nullable: true },
    "zod-output-file": { type: "string", nullable: true },
    "schema-prefix": { type: "string", nullable: true },
    "schema-suffix": { type: "string", nullable: true, default: "Schema" },
  },
  required: [],
};


export const $lib = createTypeSpecLibrary({
  name: "config-emitter",
  diagnostics: {},
  emitter: {
    options: EmitterOptionsSchema,
  },
});

export const { reportDiagnostic, createDiagnostic } = $lib;
