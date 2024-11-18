import { resolvePath } from "@typespec/compiler";
import { createTestLibrary, TypeSpecTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

export const ConfigEmitterTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "config-emitter",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
