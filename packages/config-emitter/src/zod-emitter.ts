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
} from "@typespec/compiler/emitter-framework";
import { EmitterOptions } from "./lib.js";

export function isArrayType(m: Model) {
  return m.name === "Array";
}

export const intrinsicNameToTSType = new Map<string, string>([
  ["string", "z.string()"],
  ["int32", "z.number()"],
  ["int16", "z.number()"],
  ["float16", "z.number()"],
  ["float32", "z.number()"],
  ["int64", "z.bigint()"],
  ["boolean", "z.boolean()"],
  ["unknown", "z.unknown()"],
  ["null", "z.null()"],
  ["never", "z.never()"],
  ["void", "z.void()"],
]);

export class ZodEmitter extends CodeTypeEmitter<EmitterOptions> {
  protected nsByName: Map<string, Scope<string>> = new Map();

  getPrefix() {
    const options = this.emitter.getOptions();
    return options["schema-prefix"] ?? "";
  }
  getSuffix() {
    const options = this.emitter.getOptions();
    return options["schema-suffix"] ?? "Schema";
  }
  wrapIdentifier(name: string) {
    return `${this.getPrefix()}${name}${this.getSuffix()}`;
  }

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

  declarationContext(decl: { namespace?: Namespace }): Context {
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
    return code`z.literal(${JSON.stringify(boolean.value)})`;
  }

  numericLiteral(number: NumericLiteral): EmitterOutput<string> {
    return code`z.literal(${JSON.stringify(number.value)})`;
  }

  stringLiteral(string: StringLiteral): EmitterOutput<string> {
    return code`z.literal(${JSON.stringify(string.value)})`;
  }

  scalarDeclaration(scalar: Scalar, scalarName: string): EmitterOutput<string> {
    if (!intrinsicNameToTSType.has(scalarName) && scalar.baseScalar) {
      return this.scalarDeclaration(scalar.baseScalar, scalar.baseScalar.name);
    } else if (!intrinsicNameToTSType.has(scalarName)) {
      //throw new Error("Unknown scalar type " + scalarName);
      return this.emitter.result.rawCode("z.any()");
    }

    const code = intrinsicNameToTSType.get(scalarName)!;
    return this.emitter.result.rawCode(code);
  }

  intrinsic(intrinsic: IntrinsicType, name: string): EmitterOutput<string> {
    if (!intrinsicNameToTSType.has(name)) {
      throw new Error("Unknown intrinsic type " + name);
    }

    const code = intrinsicNameToTSType.get(name)!;
    return this.emitter.result.rawCode(code);
  }

  modelLiteral(model: Model): EmitterOutput<string> {
    return this.emitter.result.rawCode(
      code`z.object({ ${this.emitter.emitModelProperties(model)} })`
    );
  }

  modelDeclaration(model: Model, name: string): EmitterOutput<string> {
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
      code`${commentCode}\nexport const ${this.wrapIdentifier(name)} = z.object({
        ${this.emitter.emitModelProperties(model)}
    })`
    );
  }

  modelInstantiation(model: Model, name: string): EmitterOutput<string> {
    if (this.emitter.getProgram().checker.isStdType(model, "Record")) {
      const indexerValue = model.indexer!.value;
      return code`z.record(z.string(), ${this.emitter.emitTypeReference(indexerValue)})`;
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
      code`${docString}${name}: ${this.emitter.emitTypeReference(
        property.type
      )}${property.optional ? ".optional()" : ""}`
    );
  }

  arrayDeclaration(
    array: Model,
    name: string,
    elementType: Type
  ): EmitterOutput<string> {
    return this.emitter.result.declaration(
      name,
      code`export const ${this.wrapIdentifier(name)} = z.array(${this.emitter.emitTypeReference(elementType)});`
    );
  }

  arrayLiteral(array: Model, elementType: Type): EmitterOutput<string> {
    // we always parenthesize here as prettier will remove the unneeded parens.
    return this.emitter.result.rawCode(
      code`z.array(${this.emitter.emitTypeReference(elementType)})`
    );
  }

  operationDeclaration(
    operation: Operation,
    name: string
  ): EmitterOutput<string> {
    const argsOutput = code`.args(${this.emitter.emitOperationParameters(operation)})`;
    const returnsOutput = code`.returns(${this.emitter.emitOperationReturnType(operation)})`;
    return this.emitter.result.declaration(
      name,
      code`export const ${this.wrapIdentifier(name)} = z.function()${argsOutput}${returnsOutput}`
    );
  }

  operationParameters(
    operation: Operation,
    parameters: Model
  ): EmitterOutput<string> {
    const cb = new StringBuilder();
    if (parameters.properties.size === 1) {
      const prop = Array.from(parameters.properties.values())[0]!;
      return code`${this.emitter.emitTypeReference(prop.type)}${prop.optional ? ".optional()" : ""}`;
    }
    for (const prop of parameters.properties.values()) {
      cb.push(
        code`${this.emitter.emitTypeReference(prop.type)}${prop.optional ? ".optional()" : ""},`
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
      export const ${this.wrapIdentifier(name)} = z.object({
        ${this.emitter.emitInterfaceOperations(iface)}
      })
    `
    );
  }

  interfaceOperationDeclaration(
    operation: Operation,
    name: string
  ): EmitterOutput<string> {
    const argsOutput = code`.args(${this.emitter.emitOperationParameters(operation)})`;
    const returnsOutput = code`.returns(${this.emitter.emitOperationReturnType(operation)})`;
    return code`${name}: z.function()${argsOutput}${returnsOutput}`;
  }

  enumDeclaration(en: Enum, name: string): EmitterOutput<string> {
    return this.emitter.result.declaration(
      name,
      code`export enum ${name}Enum {
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
      code`export const ${this.wrapIdentifier(name)} = ${this.emitter.emitUnionVariants(union)}`
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
    builder.push(code`z.union([`);
    for (const variant of union.variants.values()) {
      i++;
      builder.push(
        code`${this.emitter.emitType(variant)}${i < union.variants.size ? "," : ""}`
      );
    }
    builder.push(code`])`);

    return this.emitter.result.rawCode(builder.reduce());
  }

  unionVariant(variant: UnionVariant): EmitterOutput<string> {
    return this.emitter.emitTypeReference(variant.type);
  }

  tupleLiteral(tuple: Tuple): EmitterOutput<string> {
    return code`z.tuple([${this.emitter.emitTupleLiteralValues(tuple)}])`;
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

    if (
      targetDeclaration.value
        .toString()
        .startsWith(`export enum ${targetDeclaration.name}Enum`)
    ) {
      return `z.nativeEnum(${targetDeclaration.name}Enum)`;
    }

    const basePath = pathDown.map((s) => s.name).join(".");
    return basePath
      ? this.emitter.result.rawCode(
          `${basePath}.${this.wrapIdentifier(targetDeclaration.name)}`
        )
      : this.emitter.result.rawCode(this.wrapIdentifier(targetDeclaration.name));
  }

  /**
   * Recursively collects all declarations from a scope and its child scopes
   */
  collectAllDeclarations(scope: Scope<string>): Declaration<string>[] {
    let declarations: Declaration<string>[] = [...scope.declarations];
    
    // Recursively collect declarations from child scopes
    for (const childScope of scope.childScopes) {
      declarations = declarations.concat(this.collectAllDeclarations(childScope));
    }
    
    return declarations;
  }

  async sourceFile(sourceFile: SourceFile<string>): Promise<EmittedSourceFile> {
    const emittedSourceFile: EmittedSourceFile = {
      path: sourceFile.path,
      contents: `import { z } from "zod";\n`,
    };

    for (const [importPath, typeNames] of sourceFile.imports) {
      emittedSourceFile.contents += `import {${typeNames.join(",")}} from "${importPath}";\n`;
    }

    for (const decl of sourceFile.globalScope.declarations) {
      emittedSourceFile.contents += decl.value + "\n";
    }

    emittedSourceFile.contents += this.emitNamespaces(sourceFile.globalScope);

    // Collect all type declarations
    const allTypes = this.collectAllDeclarations(sourceFile.globalScope);
    
    // Get config types map directly from options
    const options = this.emitter.getOptions();
    const configTypesMap = options["config-types-map"] || {};
    
    // Build the schemas map with proper paths
    emittedSourceFile.contents += "\nconst TYPECONF_SCHEMAS_MAP = {";

    // If we have a config types map, use it to create more accurate schema mappings
    if (Object.keys(configTypesMap).length > 0) {
      console.log(`Processing ${Object.keys(configTypesMap).length} config types for schema mapping`);
      
      for (const [configPath, configInfo] of Object.entries(configTypesMap)) {
        // Type safety check on configInfo
        if (typeof configInfo !== 'object' || configInfo === null) {
          console.warn(`Invalid config info for ${configPath}, skipping`);
          continue;
        }
        
        // Get the export type from the config info
        const exportType = configInfo.exportType;
        if (!exportType || typeof exportType !== 'string') {
          console.warn(`Missing or invalid export type for ${configPath}, skipping`);
          continue;
        }
        
        console.log(`Processing config type for ${configPath}: ${exportType}`);
        
        // Extract simple type name if it's a complex type
        // Try different patterns to extract the type name
        let typeName = null;
        
        // Pattern 1: Extract from generic types like Array<Type>
        const genericTypeMatch = exportType.match(/^(\w+)<.+>$/);
        if (genericTypeMatch) {
          typeName = genericTypeMatch[1];
        } 
        // Pattern 2: Extract from function types with parameters
        else if (exportType.includes('(') && exportType.includes(')')) {
          typeName = exportType.split('(')[0].trim();
        }
        // Pattern 3: Simple type name
        else {
          typeName = exportType.split('|')[0].trim();
        }
        
        if (!typeName) {
          console.warn(`Could not extract type name from ${exportType}, skipping`);
          continue;
        }
        
        console.log(`Extracted type name: ${typeName}`);
        
        // Find the schema for this type
        const matchingType = allTypes.find(type => type.name === typeName);
        if (matchingType) {
          console.log(`Found matching schema: ${matchingType.name}`);
          emittedSourceFile.contents += `"${configPath}": ${matchingType.name}${this.getSuffix()},\n`;
        } else {
          console.warn(`No matching schema found for type ${typeName} (from ${configPath})`);
          
          // Fallback: Try a case-insensitive match
          const caseInsensitiveMatch = allTypes.find(type => 
            type.name.toLowerCase() === typeName.toLowerCase()
          );
          
          if (caseInsensitiveMatch) {
            console.log(`Found case-insensitive match: ${caseInsensitiveMatch.name}`);
            emittedSourceFile.contents += `"${configPath}": ${caseInsensitiveMatch.name}${this.getSuffix()},\n`;
          }
        }
      }
    }

    emittedSourceFile.contents += "};\n";
    emittedSourceFile.contents += "\nexport default TYPECONF_SCHEMAS_MAP;\n";

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

export class SingleFileZodEmitter extends ZodEmitter {
  programContext(): Context {
    const options = this.emitter.getOptions();
    const outputFile = this.emitter.createSourceFile(
      options["zod-output-file"] ?? "output.ts"
    );
    return { scope: outputFile.globalScope };
  }
}

export async function zodEmit(context: EmitContext) {
  const assetEmitter = createAssetEmitter(
    context.program,
    SingleFileZodEmitter,
    context
  );

  assetEmitter.emitProgram();

  await assetEmitter.writeOutput();
}