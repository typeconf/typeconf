import * as prettier from "prettier";
import prettierPluginTypescript from "prettier/plugins/typescript";
import prettierPluginEstree from "prettier/plugins/estree";
import {
  BooleanLiteral,
  EmitContext,
  Enum,
  EnumMember,
  getDoc,
  getNamespaceFullName,
  Interface,
  IntrinsicType,
  Model,
  ModelProperty,
  Namespace,
  NumericLiteral,
  Operation,
  Scalar,
  StringLiteral,
  Tuple,
  Type,
  Union,
  UnionVariant,
} from "@typespec/compiler";

import {
  code,
  CodeTypeEmitter,
  Context,
  createAssetEmitter,
  Declaration,
  EmittedSourceFile,
  EmitterOutput,
  Scope,
  SourceFile,
  SourceFileScope,
  StringBuilder,
  TypeSpecDeclaration,
} from "@typespec/compiler/emitter-framework";
import { EmitterOptions } from "./lib.js";

export function isArrayType(m: Model) {
  return m.name === "Array";
}

export const intrinsicNameToTSType = new Map<string, string>([
  ["string", "string"],
  ["int32", "number"],
  ["int16", "number"],
  ["float16", "number"],
  ["float32", "number"],
  ["int64", "bigint"],
  ["boolean", "boolean"],
  ["unknown", "unknown"],
  ["null", "null"],
  ["never", "never"],
  ["void", "void"],
]);

export class TypescriptEmitter<
  TEmitterOptions extends object = EmitterOptions,
> extends CodeTypeEmitter<TEmitterOptions> {
  protected nsByName: Map<string, Scope<string>> = new Map();

  emitNamespaces(scope: Scope<string>) {
    let res = "";
    for (const childScope of scope.childScopes) {
      res += this.emitNamespace(childScope);
    }
    return res;
  }
  emitNamespace(scope: Scope<string>) {
    let ns = `export namespace ${scope.name} {\n`;
    for (const decl of scope.declarations) {
      ns += decl.value + "\n";
    }
    ns += this.emitNamespaces(scope);
    ns += `}\n`;

    return ns;
  }

  declarationContext(
    decl: TypeSpecDeclaration & { namespace?: Namespace }
  ): Context {
    const name = decl.namespace?.name;
    if (!name) return {};

    const namespaceChain = decl.namespace
      ? getNamespaceFullName(decl.namespace).split(".")
      : [];

    let nsScope = this.nsByName.get(name);
    if (!nsScope) {
      // If there is no scope for the namespace, create one for each
      // namespace in the chain.
      let parentScope: Scope<string> | undefined;
      while (namespaceChain.length > 0) {
        const ns = namespaceChain.shift();
        if (!ns) {
          break;
        }
        nsScope = this.nsByName.get(ns);
        if (nsScope) {
          parentScope = nsScope;
          continue;
        }
        nsScope = this.emitter.createScope(
          {},
          ns,
          parentScope ?? this.emitter.getContext().scope
        );
        this.nsByName.set(ns, nsScope);
        parentScope = nsScope;
      }
    }

    return {
      scope: nsScope,
    };
  }

  modelDeclarationContext(model: Model): Context {
    return this.declarationContext(model);
  }

  modelInstantiationContext(model: Model): Context {
    return this.declarationContext(model);
  }

  unionDeclarationContext(union: Union): Context {
    return this.declarationContext(union);
  }

  unionInstantiationContext(union: Union): Context {
    return this.declarationContext(union);
  }

  enumDeclarationContext(en: Enum): Context {
    return this.declarationContext(en);
  }

  arrayDeclarationContext(array: Model): Context {
    return this.declarationContext(array);
  }

  interfaceDeclarationContext(iface: Interface): Context {
    return this.declarationContext(iface);
  }

  operationDeclarationContext(operation: Operation): Context {
    return this.declarationContext(operation);
  }

  // type literals
  booleanLiteral(boolean: BooleanLiteral): EmitterOutput<string> {
    return JSON.stringify(boolean.value);
  }

  numericLiteral(number: NumericLiteral): EmitterOutput<string> {
    return JSON.stringify(number.value);
  }

  stringLiteral(string: StringLiteral): EmitterOutput<string> {
    return JSON.stringify(string.value);
  }

  scalarDeclaration(scalar: Scalar, scalarName: string): EmitterOutput<string> {
    if (!intrinsicNameToTSType.has(scalarName) && scalar.baseScalar) {
      return this.emitter.result.declaration(
        scalarName,
        code`export type ${scalarName} = ${this.emitter.emitTypeReference(scalar.baseScalar)}`
      );
    } else if (!intrinsicNameToTSType.has(scalarName)) {
      // TODO: Add a warning here
      return this.emitter.result.rawCode("any");
    }

    const typeCode = intrinsicNameToTSType.get(scalarName)!;
    return this.emitter.result.rawCode(typeCode);
  }

  intrinsic(intrinsic: IntrinsicType, name: string): EmitterOutput<string> {
    if (!intrinsicNameToTSType.has(name)) {
      // TODO: Add a warning here
      return this.emitter.result.rawCode("any");
    }

    const code = intrinsicNameToTSType.get(name)!;
    return this.emitter.result.rawCode(code);
  }

  modelLiteral(model: Model): EmitterOutput<string> {
    return this.emitter.result.rawCode(
      code`{ ${this.emitter.emitModelProperties(model)} }`
    );
  }

  modelDeclaration(model: Model, name: string): EmitterOutput<string> {
    let extendsClause;

    if (model.baseModel) {
      extendsClause = code`${this.emitter.emitTypeReference(model.baseModel)} &`;
    } else {
      extendsClause = "";
    }

    const comment = getDoc(this.emitter.getProgram(), model);
    let commentCode = "";

    if (comment) {
      commentCode = `
        /**
         * ${comment}
         */`;
    }

    return this.emitter.result.declaration(
      name,
      code`${commentCode}\nexport type ${name} = ${extendsClause} {
        ${this.emitter.emitModelProperties(model)}
      }`
    );
  }

  modelInstantiation(model: Model, name: string): EmitterOutput<string> {
    if (this.emitter.getProgram().checker.isStdType(model, "Record")) {
      const indexerValue = model.indexer!.value;
      return code`Record<string, ${this.emitter.emitTypeReference(indexerValue)}>`;
    }
    return this.modelDeclaration(model, name);
  }

  modelPropertyLiteral(property: ModelProperty): EmitterOutput<string> {
    const name = property.name === "_" ? "statusCode" : property.name;
    const doc = getDoc(this.emitter.getProgram(), property);
    let docString = "";

    if (doc) {
      docString = `
      /**
       * ${doc}
       */
      `;
    }

    return this.emitter.result.rawCode(
      code`${docString}${name}${property.optional ? "?" : ""}: ${this.emitter.emitTypeReference(
        property.type
      )}`
    );
  }

  arrayDeclaration(
    array: Model,
    name: string,
    elementType: Type
  ): EmitterOutput<string> {
    return this.emitter.result.declaration(
      name,
      code`export type ${name} = Array<${this.emitter.emitTypeReference(elementType)}>;`
    );
  }

  arrayLiteral(array: Model, elementType: Type): EmitterOutput<string> {
    // we always parenthesize here as prettier will remove the unneeded parens.
    return this.emitter.result.rawCode(
      code`(${this.emitter.emitTypeReference(elementType)})[]`
    );
  }

  operationDeclaration(
    operation: Operation,
    name: string
  ): EmitterOutput<string> {
    return this.emitter.result.declaration(
      name,
      code`
        export type ${name} = (${this.emitter.emitOperationParameters(
          operation
        )}) => ${this.emitter.emitOperationReturnType(operation)}
        export type ${name}Params = Parameters<${name}>;
        export type ${name}ReturnType = ReturnType<${name}>;
      `
    );
  }

  operationParameters(
    operation: Operation,
    parameters: Model
  ): EmitterOutput<string> {
    const cb = new StringBuilder();
    for (const prop of parameters.properties.values()) {
      cb.push(
        code`${prop.name}${prop.optional ? "?" : ""}: ${this.emitter.emitTypeReference(prop.type)},`
      );
    }
    return cb;
  }

  operationReturnType(
    operation: Operation,
    returnType: Type
  ): EmitterOutput<string> {
    return this.emitter.emitTypeReference(returnType);
  }

  interfaceDeclaration(iface: Interface, name: string): EmitterOutput<string> {
    return this.emitter.result.declaration(
      name,
      code`
      export type ${name} = {
        ${this.emitter.emitInterfaceOperations(iface)}
      }
    `
    );
  }

  interfaceOperationDeclaration(
    operation: Operation,
    name: string
  ): EmitterOutput<string> {
    return code`${name}(${this.emitter.emitOperationParameters(operation)}): ${this.emitter.emitOperationReturnType(operation)}`;
  }

  enumDeclaration(en: Enum, name: string): EmitterOutput<string> {
    return this.emitter.result.declaration(
      name,
      code`export enum ${name} {
        ${this.emitter.emitEnumMembers(en)}
      }`
    );
  }

  enumMember(member: EnumMember): EmitterOutput<string> {
    // should we just fill in value for you?
    const value = !member.value ? member.name : member.value;

    return `
      ${member.name} = ${JSON.stringify(value)}
    `;
  }

  enumMemberReference(member: EnumMember): EmitterOutput<string> {
    return `${this.emitter.emitDeclarationName(member.enum)}.${member.name}`;
  }

  unionDeclaration(union: Union, name: string): EmitterOutput<string> {
    return this.emitter.result.declaration(
      name,
      code`export type ${name} = ${this.emitter.emitUnionVariants(union)}`
    );
  }

  unionInstantiation(union: Union, name: string): EmitterOutput<string> {
    return this.unionDeclaration(union, name);
  }

  unionLiteral(union: Union) {
    return this.emitter.emitUnionVariants(union);
  }

  unionVariants(union: Union): EmitterOutput<string> {
    const builder = new StringBuilder();
    let i = 0;
    for (const variant of union.variants.values()) {
      i++;
      builder.push(
        code`${this.emitter.emitType(variant)}${i < union.variants.size ? "|" : ""}`
      );
    }
    return this.emitter.result.rawCode(builder.reduce());
  }

  unionVariant(variant: UnionVariant): EmitterOutput<string> {
    return this.emitter.emitTypeReference(variant.type);
  }

  tupleLiteral(tuple: Tuple): EmitterOutput<string> {
    return code`[${this.emitter.emitTupleLiteralValues(tuple)}]`;
  }

  reference(
    targetDeclaration: Declaration<string>,
    pathUp: Scope<string>[],
    pathDown: Scope<string>[],
    commonScope: Scope<string> | null
  ) {
    if (!commonScope) {
      const sourceSf = (pathUp[0] as SourceFileScope<string>).sourceFile;
      const targetSf = (pathDown[0] as SourceFileScope<string>).sourceFile;
      sourceSf.imports.set(`./${targetSf.path.replace(".js", ".ts")}`, [
        targetDeclaration.name,
      ]);
    }

    return super.reference(targetDeclaration, pathUp, pathDown, commonScope);
  }

  async sourceFile(sourceFile: SourceFile<string>): Promise<EmittedSourceFile> {
    const emittedSourceFile: EmittedSourceFile = {
      path: sourceFile.path,
      contents: "",
    };

    for (const [importPath, typeNames] of sourceFile.imports) {
      emittedSourceFile.contents += `import {${typeNames.join(",")}} from "${importPath}";\n`;
    }

    for (const decl of sourceFile.globalScope.declarations) {
      emittedSourceFile.contents += decl.value + "\n";
    }

    emittedSourceFile.contents += this.emitNamespaces(sourceFile.globalScope);

    emittedSourceFile.contents = await prettier.format(
      emittedSourceFile.contents,
      {
        parser: "typescript",
        plugins: [prettierPluginTypescript, prettierPluginEstree],
      }
    );
    return emittedSourceFile;
  }
}

class SingleFileTypescriptEmitter extends TypescriptEmitter {
  programContext(): Context {
    const options = this.emitter.getOptions();
    const outputFile = this.emitter.createSourceFile(
      options["output-file"] ?? "output.ts"
    );
    return { scope: outputFile.globalScope };
  }
}

export async function typescriptEmit(context: EmitContext) {
  const assetEmitter = createAssetEmitter(
    context.program,
    SingleFileTypescriptEmitter,
    context
  );

  assetEmitter.emitProgram();

  await assetEmitter.writeOutput();
}