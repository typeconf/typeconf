import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "config-emitter",
  diagnostics: {},
});

export const { reportDiagnostic, createDiagnostic } = $lib;
