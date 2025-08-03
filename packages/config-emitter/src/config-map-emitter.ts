import {
  EmitContext,
  emitFile,
  resolvePath,
  getNamespaceFullName,
  Interface,
  Model,
  Namespace,
  Operation,
  Enum,
  Union,
  Type,
} from "@typespec/compiler";

import {
  CodeTypeEmitter,
  Context,
  createAssetEmitter,
  Declaration,
  EmittedSourceFile,
  Scope,
  SourceFile,
  SourceFileScope,
} from "@typespec/compiler/emitter-framework";
import { EmitterOptions } from "./lib.js";

export class ConfigMapEmitter extends CodeTypeEmitter<EmitterOptions> {
  protected nsByName: Map<string, Scope<string>> = new Map();

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

  // We don't need to emit actual code, just collect type names
  modelDeclaration(model: Model, name: string) {
    return this.emitter.result.declaration(name, "");
  }

  modelInstantiation(model: Model, name: string) {
    return this.emitter.result.declaration(name, "");
  }

  arrayDeclaration(array: Model, name: string, elementType: Type) {
    return this.emitter.result.declaration(name, "");
  }

  operationDeclaration(operation: Operation, name: string) {
    return this.emitter.result.declaration(name, "");
  }

  interfaceDeclaration(iface: Interface, name: string) {
    return this.emitter.result.declaration(name, "");
  }

  enumDeclaration(en: Enum, name: string) {
    return this.emitter.result.declaration(name, "");
  }

  unionDeclaration(union: Union, name: string) {
    return this.emitter.result.declaration(name, "");
  }

  unionInstantiation(union: Union, name: string) {
    return this.emitter.result.declaration(name, "");
  }

  // Other required methods that return empty implementations
  booleanLiteral() { return this.emitter.result.rawCode(""); }
  numericLiteral() { return this.emitter.result.rawCode(""); }
  stringLiteral() { return this.emitter.result.rawCode(""); }
  scalarDeclaration() { return this.emitter.result.rawCode(""); }
  intrinsic() { return this.emitter.result.rawCode(""); }
  modelLiteral() { return this.emitter.result.rawCode(""); }
  modelPropertyLiteral() { return this.emitter.result.rawCode(""); }
  arrayLiteral() { return this.emitter.result.rawCode(""); }
  operationParameters() { return this.emitter.result.rawCode(""); }
  operationReturnType() { return this.emitter.result.rawCode(""); }
  interfaceOperationDeclaration() { return this.emitter.result.rawCode(""); }
  enumMember() { return this.emitter.result.rawCode(""); }
  enumMemberReference() { return this.emitter.result.rawCode(""); }
  unionLiteral() { return this.emitter.result.rawCode(""); }
  unionVariants() { return this.emitter.result.rawCode(""); }
  unionVariant() { return this.emitter.result.rawCode(""); }
  tupleLiteral() { return this.emitter.result.rawCode(""); }

  reference(
    targetDeclaration: Declaration<string>,
    pathUp: Scope<string>[],
    pathDown: Scope<string>[],
    commonScope: Scope<string> | null
  ) {
    return this.emitter.result.rawCode("");
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
    // Collect all type declarations
    const allTypes = this.collectAllDeclarations(sourceFile.globalScope);
    
    // Get config types map directly from options
    const options = this.emitter.getOptions();
    const configTypesMap = options["config-types-map"] || {};
    
    // Build the config path mappings
    const configPathMap: Record<string, string> = {};

    // If we have a config types map, use it to create schema mappings
    if (Object.keys(configTypesMap).length > 0) {
      for (const [configPath, configInfo] of Object.entries(configTypesMap)) {
        // Type safety check on configInfo
        if (typeof configInfo !== 'object' || configInfo === null) {
          continue;
        }
        
        // Get the export type from the config info
        const exportType = (configInfo as any).exportType;
        if (!exportType || typeof exportType !== 'string') {
          continue;
        }
        
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
          continue;
        }
        
        // Find the matching type declaration
        const matchingType = allTypes.find(type => type.name === typeName);
        if (matchingType) {
          configPathMap[configPath] = matchingType.name;
        } else {
          // Fallback: Try a case-insensitive match
          const caseInsensitiveMatch = allTypes.find(type => 
            type.name.toLowerCase() === typeName.toLowerCase()
          );
          
          if (caseInsensitiveMatch) {
            configPathMap[configPath] = caseInsensitiveMatch.name;
          }
        }
      }
    }

    // Create the output file with just the config path mappings
    // Use the same path as the source file to ensure proper directory handling
    const emittedSourceFile: EmittedSourceFile = {
      path: sourceFile.path,
      contents: JSON.stringify(configPathMap, null, 2),
    };

    return emittedSourceFile;
  }
}

export class SingleFileConfigMapEmitter extends ConfigMapEmitter {
  programContext(): Context {
    const options = this.emitter.getOptions();
    const outputFile = this.emitter.createSourceFile(
      options["config-map-output-file"] ?? "config-map.json"
    );
    return { scope: outputFile.globalScope };
  }
}

export async function configMapEmit(context: EmitContext) {
  const assetEmitter = createAssetEmitter(
    context.program,
    SingleFileConfigMapEmitter,
    context
  );

  assetEmitter.emitProgram();

  await assetEmitter.writeOutput();
}