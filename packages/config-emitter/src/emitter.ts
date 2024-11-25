import { EmitContext, emitFile, resolvePath } from "@typespec/compiler";
import { $onEmit as typescriptEmit } from "@typespec-tools/emitter-typescript";

export async function $onEmit(context: EmitContext) {
  if (context.program.compilerOptions.noEmit) {
    return;
  }
  //await emitFile(context.program, {
  //  path: resolvePath(context.emitterOutputDir, "output.txt"),
  //  content: "Hello world\n",
  //});
  await typescriptEmit(context);
}
