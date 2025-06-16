import {
  Project,
  Node,
  ScriptTarget,
  ModuleKind,
  ModuleResolutionKind,
  SourceFile,
} from "ts-morph";
import { glob } from "glob";
import path from "path";
import { promises as fsAsync } from "fs";
import { SchemaGenerationResult } from "./schema-generator.js";

export interface ConfigFileInfo {
  filePath: string;
  relativePath: string;
  configData: any;
  typeName?: string;
}

export interface StringConfigInput {
  name: string;
  content: string;
  filePath?: string;
}

export class ConfigProcessor {
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

  async processConfigFilesFromStrings(
    configInputs: StringConfigInput[],
    schemas: Map<string, SchemaGenerationResult>,
    configDir: string,
  ): Promise<ConfigFileInfo[]> {
    console.log(
      `Processing ${configInputs.length} config files from strings...`,
    );

    const results: ConfigFileInfo[] = [];

    for (const input of configInputs) {
      try {
        const result = await this.processConfigFromString(
          input,
          schemas,
          configDir,
        );
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.error(
          `Failed to process config from string ${input.name}:`,
          error,
        );
        // Continue with other files even if one fails
      }
    }

    return results;
  }

  private async processConfigFromString(
    input: StringConfigInput,
    schemas: Map<string, SchemaGenerationResult>,
    configDir: string,
  ): Promise<ConfigFileInfo | null> {
    const fileName = input.filePath || `${input.name}.config.ts`;
    const relativePath = input.filePath
      ? path.relative(configDir, input.filePath)
      : fileName;

    console.log(`Processing config from string: ${relativePath}`);

    // Read and evaluate the config content
    const configData = await this.evaluateConfigString(input.content, fileName);
    if (!configData) {
      console.warn(`No config data found in ${relativePath}`);
      return null;
    }

    // Try to determine the type name based on input name or file structure
    const typeName = this.inferTypeNameFromInput(input);

    // Validate against schema if available
    if (typeName && schemas.has(typeName)) {
      console.log(`Validating ${relativePath} against ${typeName} schema`);
      // TODO: Implement schema validation
      // For now, we'll just log that validation would happen here
    } else {
      console.warn(
        `No schema found for inferred type ${typeName} in ${relativePath}`,
      );
    }

    return {
      filePath: input.filePath || fileName,
      relativePath,
      configData,
      typeName,
    };
  }

  private inferTypeNameFromInput(input: StringConfigInput): string | undefined {
    // Try to infer type name from input name
    const baseName = input.name.replace(/\.config$/, "");

    // Convert kebab-case or snake_case to PascalCase
    const typeName =
      baseName
        .split(/[-_]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("") + "Config";

    return typeName;
  }

  private async evaluateConfigString(
    configContent: string,
    fileName: string,
  ): Promise<any> {
    try {
      // Add the config content to the project for analysis
      const sourceFile = this.project.createSourceFile(
        `temp_${Date.now()}_${fileName}`,
        configContent,
        { overwrite: true },
      );

      // Find the default export
      const defaultExport = sourceFile.getDefaultExportSymbol();
      if (!defaultExport) {
        console.warn(`No default export found in ${fileName}`);
        return null;
      }

      // For now, return a placeholder since full evaluation would require
      // running the TypeScript code, which is complex and potentially unsafe
      // In a real implementation, you'd compile and evaluate the config safely

      return {
        _note:
          "Config evaluation not fully implemented - would contain actual config data",
        _fileName: fileName,
        _content: configContent.substring(0, 100) + "...", // Truncated for safety
        // TODO: Implement safe evaluation of the config object
      };
    } catch (error) {
      console.error(`Error evaluating config string for ${fileName}:`, error);
      return null;
    }
  }

  async generateConfigStrings(
    configs: ConfigFileInfo[],
  ): Promise<Array<{ name: string; content: string }>> {
    console.log(
      `Generating string outputs for ${configs.length} config files...`,
    );

    return configs.map((config) => {
      const fileName =
        path.basename(config.relativePath, ".config.ts") + ".json";
      return {
        name: fileName,
        content: JSON.stringify(config.configData, null, 2),
      };
    });
  }

  async processConfigFiles(
    configDir: string,
    schemas: Map<string, SchemaGenerationResult>,
  ): Promise<ConfigFileInfo[]> {
    console.log(`Processing config files in ${configDir}...`);

    // Find all .config.ts files
    const configFiles = await glob("**/*.config.ts", {
      cwd: configDir,
      absolute: true,
      ignore: ["**/node_modules/**", "**/dist/**", "**/out/**"],
    });

    if (configFiles.length === 0) {
      console.log("No config files found.");
      return [];
    }

    console.log(
      `Found ${configFiles.length} config files: ${configFiles.map((f) => path.relative(configDir, f)).join(", ")}`,
    );

    const results: ConfigFileInfo[] = [];

    for (const configFile of configFiles) {
      try {
        const result = await this.processConfigFile(
          configFile,
          configDir,
          schemas,
        );
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.error(
          `Failed to process config file ${path.relative(configDir, configFile)}:`,
          error,
        );
        // Continue with other files even if one fails
      }
    }

    return results;
  }

  private async processConfigFile(
    configFilePath: string,
    configDir: string,
    schemas: Map<string, SchemaGenerationResult>,
  ): Promise<ConfigFileInfo | null> {
    const relativePath = path.relative(configDir, configFilePath);
    console.log(`Processing config file: ${relativePath}`);

    // Read and evaluate the config file
    const configData = await this.evaluateConfigFile(configFilePath);
    if (!configData) {
      console.warn(`No config data found in ${relativePath}`);
      return null;
    }

    // Try to determine the type name based on imports or file structure
    const typeName = this.inferTypeName(configFilePath, configDir);

    // Validate against schema if available
    if (typeName && schemas.has(typeName)) {
      console.log(`Validating ${relativePath} against ${typeName} schema`);
      // TODO: Implement schema validation
      // For now, we'll just log that validation would happen here
    } else {
      console.warn(
        `No schema found for inferred type ${typeName} in ${relativePath}`,
      );
    }

    return {
      filePath: configFilePath,
      relativePath,
      configData,
      typeName,
    };
  }

  private async evaluateConfigFile(configFilePath: string): Promise<any> {
    try {
      // Read the config file content
      const configContent = await fsAsync.readFile(configFilePath, "utf-8");

      // For security and simplicity, we'll use a basic approach to extract the config
      // In a production implementation, you'd want more robust evaluation

      // Add the file to the project for analysis
      const sourceFile = this.project.createSourceFile(
        `temp_${Date.now()}.ts`,
        configContent,
        { overwrite: true },
      );

      // Find the default export
      const defaultExport = sourceFile.getDefaultExportSymbol();
      if (!defaultExport) {
        console.warn(`No default export found in ${configFilePath}`);
        return null;
      }

      // For now, return a placeholder since full evaluation would require
      // running the TypeScript code, which is complex and potentially unsafe
      // In a real implementation, you'd compile and evaluate the config safely

      return {
        _note:
          "Config evaluation not fully implemented - would contain actual config data",
        _filePath: configFilePath,
        // TODO: Implement safe evaluation of the config object
      };
    } catch (error) {
      console.error(`Error reading config file ${configFilePath}:`, error);
      return null;
    }
  }

  private inferTypeName(
    configFilePath: string,
    configDir: string,
  ): string | undefined {
    // Try to infer type name from file name or import statements
    // This is a simplified heuristic - in practice you'd analyze imports

    const fileName = path.basename(configFilePath, ".config.ts");

    // Convert kebab-case or snake_case to PascalCase
    const typeName =
      fileName
        .split(/[-_]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("") + "Config";

    return typeName;
  }

  async writeConfigFiles(
    configs: ConfigFileInfo[],
    outputDir: string,
  ): Promise<void> {
    console.log(
      `Writing ${configs.length} JSON config files to ${outputDir}...`,
    );

    await fsAsync.mkdir(outputDir, { recursive: true });

    for (const config of configs) {
      const fileName =
        path.basename(config.relativePath, ".config.ts") + ".json";
      const outputPath = path.join(outputDir, fileName);

      await fsAsync.writeFile(
        outputPath,
        JSON.stringify(config.configData, null, 2),
      );

      console.log(`Generated JSON config: ${fileName}`);
    }
  }
}
