import {EmitContext} from "@typespec/compiler";

export async function $onEmit(context: EmitContext) {
    console.log('a')
}
