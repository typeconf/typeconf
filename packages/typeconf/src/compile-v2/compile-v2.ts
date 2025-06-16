import { TypeAnalyzer } from "./type-analyzer.js";
import { SchemaGenerator } from "./schema-generator.js";
import { ConfigProcessor } from "./config-processor.js";
import path from "path";
import { promises as fsAsync } from "fs";

export interface CompileV2Options {
  outputDir?: string;
  watch?: boolean;
  // String-based input options
  typeDefinitions?: Array<{
    name: string;
    content: string;
    filePath?: string;
  }>;
  configFiles?: Array<{
    name: string;
    content: string;
    filePath?: string;
  }>;
}

export interface CompileV2Result {
  success: boolean;
  duration: number;
  types: any[];
  schemas: Map<string, any>;
  configs: any[];
}

export async function compileV2(
  configDir: string,
  options: CompileV2Options = {},
): Promise<CompileV2Result> {
  console.log(`Starting v2 compilation for ${configDir}...`);

  const startTime = Date.now();

  try {
    // Step 1: Analyze TypeScript files for type definitions
    console.log("\n📝 Step 1: Analyzing TypeScript type definitions...");
    const typeAnalyzer = new TypeAnalyzer();

    let analysisResult;
    if (options.typeDefinitions) {
      // Use string-based type definitions
      analysisResult = await typeAnalyzer.analyzeFromStrings(
        options.typeDefinitions,
        configDir,
      );
    } else {
      // Use directory-based analysis (original behavior)
      analysisResult = await typeAnalyzer.analyzeDirectory(configDir);
    }

    const { types } = analysisResult;

    if (types.length === 0) {
      console.log("No type definitions found. Skipping schema generation.");
      return {
        success: true,
        duration: Date.now() - startTime,
        types: [],
        schemas: new Map(),
        configs: [],
      };
    }

    // Step 2: Generate Zod and JSON schemas
    console.log("\n🔧 Step 2: Generating schemas...");
    const schemaGenerator = new SchemaGenerator();
    const schemas = await schemaGenerator.generateSchemas(types, configDir);

    // Step 3: Process config files
    console.log("\n⚙️ Step 3: Processing config files...");
    const configProcessor = new ConfigProcessor();

    let configs;
    if (options.configFiles) {
      // Use string-based config files
      configs = await configProcessor.processConfigFilesFromStrings(
        options.configFiles,
        schemas,
        configDir,
      );
    } else {
      // Use directory-based processing (original behavior)
      configs = await configProcessor.processConfigFiles(configDir, schemas);
    }

    // Step 4: Write output files if outputDir is specified
    if (options.outputDir) {
      console.log("\n💾 Step 4: Writing output files...");
      await writeOutputFiles(
        options.outputDir,
        types,
        schemas,
        configs,
        schemaGenerator,
        configProcessor,
      );
    }

    const duration = Date.now() - startTime;
    console.log(`\n✅ v2 compilation completed successfully in ${duration}ms`);
    console.log(`   - ${types.length} type definitions processed`);
    console.log(`   - ${schemas.size} schemas generated`);
    console.log(`   - ${configs.length} config files processed`);
    if (options.outputDir) {
      console.log(`   - Output written to: ${options.outputDir}`);
    }

    return {
      success: true,
      duration,
      types,
      schemas,
      configs,
    };
  } catch (error) {
    console.error("\n❌ v2 compilation failed:", error);
    return {
      success: false,
      duration: Date.now() - startTime,
      types: [],
      schemas: new Map(),
      configs: [],
    };
  }
}

async function writeOutputFiles(
  outputDir: string,
  types: any[],
  schemas: Map<string, any>,
  configs: any[],
  schemaGenerator: SchemaGenerator,
  configProcessor: ConfigProcessor,
): Promise<void> {
  await fsAsync.mkdir(outputDir, { recursive: true });

  // Write schema files
  const schemasDir = path.join(outputDir, "schemas");
  await schemaGenerator.writeSchemaFiles(schemas, schemasDir);

  // Write config JSON files
  const configsDir = path.join(outputDir, "configs");
  await configProcessor.writeConfigFiles(configs, configsDir);

  // Write summary
  await writeSummary(outputDir, types, schemas, configs);
}

async function writeSummary(
  outputDir: string,
  types: any[],
  schemas: Map<string, any>,
  configs: any[],
): Promise<void> {
  const summary = {
    timestamp: new Date().toISOString(),
    typeDefinitions: types.map((type) => ({
      name: type.name,
      kind: type.kind,
      file: type.relativePath,
    })),
    schemas: Array.from(schemas.keys()),
    configs: configs.map((config) => ({
      file: config.relativePath,
      inferredType: config.typeName,
    })),
  };

  const summaryPath = path.join(outputDir, "compilation-summary.json");
  await fsAsync.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  console.log(
    `Generated compilation summary: ${path.relative(process.cwd(), summaryPath)}`,
  );
}
