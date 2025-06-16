import {
  Project,
  Node,
  ScriptTarget,
  ModuleKind,
  ModuleResolutionKind,
  InterfaceDeclaration,
  TypeAliasDeclaration,
  SourceFile,
} from "ts-morph";
import { glob } from "glob";
import path from "path";

export interface TypeDefinition {
  name: string;
  filePath: string;
  relativePath: string;
  kind: "interface" | "type";
  declaration: InterfaceDeclaration | TypeAliasDeclaration;
  sourceCode: string;
}

export interface TypeAnalysisResult {
  types: TypeDefinition[];
  project: Project;
}

export interface StringTypeInput {
  name: string;
  content: string;
  filePath?: string;
}

export class TypeAnalyzer {
  private project: Project;

  constructor() {
    this.project = new Project({
      compilerOptions: {
        target: ScriptTarget.ES2022,
        module: ModuleKind.ESNext,
        moduleResolution: ModuleResolutionKind.NodeJs,
        strict: true,
        skipLibCheck: true,
      },
    });
  }

  async analyzeFromStrings(
    typeInputs: StringTypeInput[],
    configDir: string,
  ): Promise<TypeAnalysisResult> {
    console.log(
      `Analyzing ${typeInputs.length} type definitions from strings...`,
    );

    const types: TypeDefinition[] = [];

    for (const input of typeInputs) {
      const fileName = input.filePath || `${input.name}.ts`;
      const sourceFile = this.project.createSourceFile(
        fileName,
        input.content,
        { overwrite: true },
      );

      const relativePath = input.filePath
        ? path.relative(configDir, input.filePath)
        : fileName;

      // Find interface declarations
      const interfaces = sourceFile.getInterfaces();
      for (const interfaceDecl of interfaces) {
        if (!interfaceDecl.isExported()) continue;

        types.push({
          name: interfaceDecl.getName(),
          filePath: input.filePath || fileName,
          relativePath,
          kind: "interface",
          declaration: interfaceDecl,
          sourceCode: interfaceDecl.getFullText(),
        });
      }

      // Find type alias declarations
      const typeAliases = sourceFile.getTypeAliases();
      for (const typeAlias of typeAliases) {
        if (!typeAlias.isExported()) continue;

        types.push({
          name: typeAlias.getName(),
          filePath: input.filePath || fileName,
          relativePath,
          kind: "type",
          declaration: typeAlias,
          sourceCode: typeAlias.getFullText(),
        });
      }
    }

    console.log(`Found ${types.length} exported type definitions:`);
    for (const type of types) {
      console.log(`  - ${type.name} (${type.kind}) in ${type.relativePath}`);
    }

    return { types, project: this.project };
  }

  async analyzeDirectory(configDir: string): Promise<TypeAnalysisResult> {
    console.log(`Analyzing TypeScript files in ${configDir}...`);

    // Find all .ts files (excluding .config.ts files which are handled separately)
    const typeFiles = await glob("**/*.ts", {
      cwd: configDir,
      absolute: true,
      ignore: [
        "**/*.config.ts",
        "**/node_modules/**",
        "**/dist/**",
        "**/out/**",
      ],
    });

    if (typeFiles.length === 0) {
      console.log("No TypeScript files found for type analysis.");
      return { types: [], project: this.project };
    }

    console.log(
      `Found ${typeFiles.length} TypeScript files: ${typeFiles.map((f) => path.relative(configDir, f)).join(", ")}`,
    );

    // Add source files to project
    this.project.addSourceFilesAtPaths(typeFiles);

    const types: TypeDefinition[] = [];

    for (const sourceFile of this.project.getSourceFiles()) {
      const absolutePath = sourceFile.getFilePath();
      const relativePath = path.relative(configDir, absolutePath);

      // Find interface declarations
      const interfaces = sourceFile.getInterfaces();
      for (const interfaceDecl of interfaces) {
        if (!interfaceDecl.isExported()) continue;

        types.push({
          name: interfaceDecl.getName(),
          filePath: absolutePath,
          relativePath,
          kind: "interface",
          declaration: interfaceDecl,
          sourceCode: interfaceDecl.getFullText(),
        });
      }

      // Find type alias declarations
      const typeAliases = sourceFile.getTypeAliases();
      for (const typeAlias of typeAliases) {
        if (!typeAlias.isExported()) continue;

        types.push({
          name: typeAlias.getName(),
          filePath: absolutePath,
          relativePath,
          kind: "type",
          declaration: typeAlias,
          sourceCode: typeAlias.getFullText(),
        });
      }
    }

    console.log(`Found ${types.length} exported type definitions:`);
    for (const type of types) {
      console.log(`  - ${type.name} (${type.kind}) in ${type.relativePath}`);
    }

    return { types, project: this.project };
  }

  getProjectReference(): Project {
    return this.project;
  }
}
