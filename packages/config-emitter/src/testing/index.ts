import { createTestLibrary, findTestPackageRoot } from "@typespec/compiler/testing";

export const TypeconfTestLibrary = createTestLibrary({
  name: "@typeconf/config-emitter",
  packageRoot: await findTestPackageRoot(import.meta.url),
});