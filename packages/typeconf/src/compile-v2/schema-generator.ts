import { generate } from "ts-to-zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { TypeDefinition } from "./type-analyzer.js";
import { promises as fsAsync } from "fs";
import path from "path";
import { z } from "zod";
import {
  InterfaceDeclaration,
  TypeAliasDeclaration,
  PropertySignature,
  TypeNode,
  SyntaxKind,
  TypeLiteralNode,
} from "ts-morph";

export interface SchemaGenerationResult {
  zodSchema: string;
  jsonSchema: object;
  typeName: string;
}

export class SchemaGenerator {
  async generateSchemas(
    types: TypeDefinition[],
    configDir: string,
  ): Promise<Map<string, SchemaGenerationResult>> {
    console.log(`Generating schemas for ${types.length} types...`);

    const results = new Map<string, SchemaGenerationResult>();

    for (const type of types) {
      try {
        const result = await this.generateSchemaForType(type, configDir);
        results.set(type.name, result);
        console.log(`Generated schema for ${type.name}`);
      } catch (error) {
        console.error(`Failed to generate schema for ${type.name}:`, error);
        // Continue with other types even if one fails
      }
    }

    return results;
  }

  private async generateSchemaForType(
    type: TypeDefinition,
    configDir: string,
  ): Promise<SchemaGenerationResult> {
    // Create a temporary file with the type declaration
    const tempDir = path.join(configDir, ".tmp-schema-gen");
    await fsAsync.mkdir(tempDir, { recursive: true });

    const tempFilePath = path.join(tempDir, `${type.name}.ts`);

    try {
      // Write the type definition to a temporary file
      await fsAsync.writeFile(tempFilePath, type.sourceCode);

      // Generate Zod schema using ts-to-zod
      const { getZodSchemasFile } = generate({
        sourceText: type.sourceCode,
        getSchemaName: (typeName) => `${typeName}Schema`,
      });

      const zodSchemaContent = getZodSchemasFile("./types");

      // Parse the generated Zod schema to create JSON schema
      // Note: This is a simplified approach. In practice, you might need
      // to eval the generated code to get the actual Zod schema object
      const jsonSchema = this.generateJsonSchemaFromTypeDefinition(type);

      return {
        zodSchema: zodSchemaContent,
        jsonSchema,
        typeName: type.name,
      };
    } finally {
      // Clean up temp file and directory
      try {
        await fsAsync.unlink(tempFilePath);
        // Use fs.rm to remove directory (newer and more robust than rmdir)
        await fsAsync.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  private generateJsonSchemaFromZod(zodCode: string, typeName: string): object {
    try {
      // This is a simplified approach. In a real implementation,
      // you would need to properly evaluate the generated Zod code
      // and convert it to JSON schema

      // For now, return a basic JSON schema structure
      return {
        type: "object",
        title: typeName,
        description: `JSON schema for ${typeName}`,
        properties: {},
        additionalProperties: false,
      };
    } catch (error) {
      console.warn(
        `Failed to generate JSON schema for ${typeName}, using fallback`,
      );
      return {
        type: "object",
        title: typeName,
        description: `Fallback JSON schema for ${typeName}`,
      };
    }
  }

  private generateJsonSchemaFromTypeDefinition(type: TypeDefinition): object {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    if (type.kind === "interface") {
      const interfaceDecl = type.declaration as InterfaceDeclaration;

      for (const prop of interfaceDecl.getProperties()) {
        const propName = prop.getName();
        const propType = prop.getTypeNode();
        const isOptional = prop.hasQuestionToken();

        properties[propName] = this.getJsonSchemaTypeFromTypeNode(propType);

        if (!isOptional) {
          required.push(propName);
        }
      }
    } else if (type.kind === "type") {
      const typeAlias = type.declaration as TypeAliasDeclaration;
      const typeNode = typeAlias.getTypeNode();

      // Handle object type literals
      if (typeNode?.getKind() === SyntaxKind.TypeLiteral) {
        const typeLiteral = typeNode as TypeLiteralNode;
        for (const member of typeLiteral.getMembers()) {
          if (member.getKind() === SyntaxKind.PropertySignature) {
            const propSig = member as PropertySignature;
            const propName = propSig.getName();
            const propType = propSig.getTypeNode();
            const isOptional = propSig.hasQuestionToken();

            properties[propName] = this.getJsonSchemaTypeFromTypeNode(propType);

            if (!isOptional) {
              required.push(propName);
            }
          }
        }
      }
    }

    return {
      type: "object",
      title: type.name,
      description: `JSON schema for ${type.name}`,
      properties,
      required: required.length > 0 ? required : undefined,
      additionalProperties: false,
    };
  }

  private getJsonSchemaTypeFromTypeNode(typeNode: TypeNode | undefined): any {
    if (!typeNode) {
      return { type: "any" };
    }

    switch (typeNode.getKind()) {
      case SyntaxKind.StringKeyword:
        return { type: "string" };
      case SyntaxKind.NumberKeyword:
        return { type: "number" };
      case SyntaxKind.BooleanKeyword:
        return { type: "boolean" };
      case SyntaxKind.ArrayType:
        // For array types, return a generic array schema for now
        return {
          type: "array",
          items: { type: "any" },
        };
      case SyntaxKind.UnionType:
        // For union types, return a flexible schema for now
        return { type: "any", description: "Union type" };
      default:
        // For unknown types, try to get the text representation
        const typeText = typeNode.getText();
        if (typeText === "string") return { type: "string" };
        if (typeText === "number") return { type: "number" };
        if (typeText === "boolean") return { type: "boolean" };
        return { type: "any", description: `Unknown type: ${typeText}` };
    }
  }

  async writeSchemaFiles(
    schemas: Map<string, SchemaGenerationResult>,
    outputDir: string,
  ): Promise<void> {
    console.log(`Writing combined schema files to ${outputDir}...`);

    // Create output directory
    await fsAsync.mkdir(outputDir, { recursive: true });

    // Write combined Zod schemas file
    const allZodSchemas = await this.generateZodSchemasString(schemas);
    const zodFilePath = path.join(outputDir, "schemas.zod.ts");
    await fsAsync.writeFile(zodFilePath, allZodSchemas);

    // Write combined JSON schemas file
    const jsonSchemasString = await this.generateJsonSchemasString(schemas);
    const jsonSchemasFilePath = path.join(outputDir, "schemas.json");
    await fsAsync.writeFile(jsonSchemasFilePath, jsonSchemasString);

    console.log(`Generated combined schema files:`);
    console.log(
      `  - Zod schemas: ${path.relative(process.cwd(), zodFilePath)}`,
    );
    console.log(
      `  - JSON schemas: ${path.relative(process.cwd(), jsonSchemasFilePath)}`,
    );
  }

  async generateZodSchemasString(
    schemas: Map<string, SchemaGenerationResult>,
  ): Promise<string> {
    const allZodSchemas = Array.from(schemas.values())
      .map((result) => result.zodSchema)
      .join("\n\n");

    return `// Auto-generated Zod schemas\n\n${allZodSchemas}`;
  }

  async generateJsonSchemasString(
    schemas: Map<string, SchemaGenerationResult>,
  ): Promise<string> {
    const allJsonSchemas: Record<string, any> = {};
    for (const [typeName, result] of schemas) {
      allJsonSchemas[typeName] = result.jsonSchema;
    }

    return JSON.stringify(
      {
        $schema: "http://json-schema.org/draft-07/schema#",
        title: "Generated Type Schemas",
        description: "Combined JSON schemas for all type definitions",
        definitions: allJsonSchemas,
      },
      null,
      2,
    );
  }
}
