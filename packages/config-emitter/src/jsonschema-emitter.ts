import { EmitContext } from "@typespec/compiler";
import { $onEmit } from "@typespec/json-schema";

export async function jsonschemaEmit(context: EmitContext) {
  // @ts-expect-error - TODO: fix this
  context.options.emitAllModels = true;
  // @ts-expect-error - TODO: fix this
  context.options.emitAllRefs = true;
  // @ts-expect-error - TODO: fix this
  context.options['file-type'] = "json";
  // @ts-expect-error - TODO: fix this
  context.options.bundleId = "schema.json";
  await $onEmit(context);
}
