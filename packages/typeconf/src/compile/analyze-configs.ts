import {
  Project,
  Node,
  ScriptTarget,
  ModuleKind,
  ModuleResolutionKind,
} from "ts-morph";
import { glob } from "glob";
import path from "path";

export interface ConfigExportInfo {
  filePath: string;
  exportType: string;
  isDefaultExport: boolean;
}

function getVariableType(declaration: Node): string | undefined {
  if (!Node.isVariableDeclaration(declaration)) return undefined;

  const typeNode = declaration.getTypeNode();
  if (typeNode) {
    return typeNode.getText();
  }
  return undefined;
}

export async function analyzeConfigFiles(
  configDir: string,
): Promise<Record<string, ConfigExportInfo>> {
  console.log(`Getting config types in ${configDir}...`);

  const configFiles = await glob("**/*.config.ts", {
    cwd: configDir,
    absolute: true,
  });

  if (configFiles.length === 0) {
    console.log("No config files found.");
    return {};
  }

  console.log(
    `Found ${configFiles.length} config files: ${configFiles.join(", ")}`,
  );

  const project = new Project({
    compilerOptions: {
      target: ScriptTarget.ES2022,
      module: ModuleKind.ESNext,
      moduleResolution: ModuleResolutionKind.NodeJs,
    },
  });

  project.addSourceFilesAtPaths(configFiles);

  const exportTypes: Record<string, ConfigExportInfo> = {};

  for (const sourceFile of project.getSourceFiles()) {
    const absolutePath = sourceFile.getFilePath();
    const relativePath = path.relative(path.dirname(configDir), absolutePath);
    console.log(`Processing ${relativePath}`);

    const defaultExport = sourceFile.getDefaultExportSymbol();
    if (!defaultExport) {
      throw Error(`No default export found in ${relativePath}`);
    }
    const declarations = defaultExport.getDeclarations();

    if (declarations.length == 0) {
      throw Error(`No declarations found in export ${relativePath}`);
    }
    const declaration = declarations[0];
    let exportType: string | undefined;

    // If it's an export assignment (export default xxx)
    if (Node.isExportAssignment(declaration)) {
      const expression = declaration.getExpression();
      if (Node.isIdentifier(expression)) {
        // Find the variable declaration
        const varDecl = sourceFile.getVariableDeclaration(expression.getText());
        if (varDecl) {
          exportType = getVariableType(varDecl);
        }
      }
    }

    if (!exportType) {
      throw Error(`No export type found in ${relativePath}`);
    }

    exportTypes[relativePath] = {
      filePath: relativePath,
      exportType,
      isDefaultExport: true,
    };
    console.log(`Found default export with type: ${exportType}`);
  }

  return exportTypes;
}
