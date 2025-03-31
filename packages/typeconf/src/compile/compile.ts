import { promises as fsAsync } from 'fs';
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { glob } from "glob";
import esbuild from "esbuild";
import ts from "typescript";
import { jsonc } from 'jsonc';

import {
  compile as typespecCompile,
  NodeHost,
  CompilerHost,
  Program,
  logDiagnostics,
} from "@typespec/compiler";

import { analyzeConfigFiles } from "./analyze-configs.js";
import { runCommand } from "../utils/run-command.js";
import { installDependency } from "../utils/package-manager.js";

const EMITTER = "@typeconf/config-emitter";

export enum ConfigMode {
  STANDALONE = "standalone",
  IN_PROJECT = "in_project"
}

async function getConfigMode(configDir: string): Promise<ConfigMode> {
  try {
    const mainTspExists = await fsAsync.access(path.join(configDir, 'src', 'main.tsp'))
      .then(() => true)
      .catch(() => false);

    const packageJsonExists = await fsAsync.access(path.join(configDir, 'package.json'))
      .then(() => true)
      .catch(() => false);

    if (!mainTspExists || !packageJsonExists) {
      return ConfigMode.IN_PROJECT;
    }
    return ConfigMode.STANDALONE;
  } catch {
    return ConfigMode.STANDALONE;
  }
}

async function reactPackageFile(configDir: string): Promise<Record<string, any> | null> {
  try {
    const fileContent = await fsAsync.readFile(path.join(configDir, "package.json"), 'utf-8');
    return JSON.parse(fileContent) as Record<string, any>;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

export async function compile(configDir: string): Promise<void> {
  const packageFile = await reactPackageFile(configDir);
  const projectName = packageFile ? packageFile["projectName"] : path.basename(configDir);

  console.log(`Compiling ${configDir}...`);
  
  console.log("Analyzing config files...");
  const configExportMap = await analyzeConfigFiles(configDir);
  console.log(`Config types map: ${JSON.stringify(configExportMap)}`);
  const mainTspPath = path.join(configDir, 'main.tsp');
  const hasMainTsp = await fsAsync.access(mainTspPath).then(() => true).catch(() => false);
  const sourcePath = hasMainTsp ? configDir : path.join(configDir, 'src');

  let options: Record<string, any> = {};
  options[EMITTER] = {
    "emitter-output-dir": `${configDir}/types`,
    "output-file": "all.ts",
    "zod-output-file": "all.zod.ts",
    "config-types-map": configExportMap,
  };
  const program = await typespecCompile(
    {
      ...NodeHost,
      logSink: {
        log: (log) => {
          console.log(log);
        },
      },
    },
    sourcePath,
    {
      emit: [getEmitterPath()],
      outputDir: configDir,
      options: options,
    },
  );

  logProgramResult(NodeHost, program);
  if (program.hasError()) {
    throw new Error("Compilation failed");
  }

  await buildConfigFile(configDir);
}

function getEmitterPath() {
  const emitterPath = fileURLToPath(import.meta.resolve(EMITTER));
  return path.join(path.dirname(emitterPath), "..");
}

function logProgramResult(
  host: CompilerHost,
  program: Program | Program,
  { showTimestamp }: { showTimestamp?: boolean } = {},
) {
  const log = (message?: any, ...optionalParams: any[]) => {
    const timestamp = showTimestamp
      ? `[${new Date().toLocaleTimeString()}] `
      : "";
    // eslint-disable-next-line no-console
    console.log(`${timestamp}${message}`, ...optionalParams);
  };

  // silence the version mismatch error until we would be
  // able to update all dependencies.
  const diagnostics = program.diagnostics.filter(d => d["code"] !== "compiler-version-mismatch");
  if (diagnostics.length > 0) {
    log("Diagnostics were reported during compilation:\n");
    logDiagnostics(diagnostics, host.logSink);
  } else {
    log("Compilation completed successfully.");
  }
}

async function writeConfigToFile(values: any, filepath?: string) {
  console.log(`Writing config file to ${filepath}`);
  if (values == null) {
      return;
  }
  const data = JSON.stringify(values, null, 4);
  const target_path = filepath;
  if (target_path != null) {
      await fsAsync.writeFile(target_path, data, { flag: 'w' });
  } else {
      console.log(data);
  }
}

async function findClosestTsconfig(startDir: string): Promise<string | null> {
  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    const tsconfigPath = path.join(currentDir, 'tsconfig.json');
    try {
      await fsAsync.access(tsconfigPath);
      return tsconfigPath;
    } catch {
      currentDir = path.dirname(currentDir);
    }
  }

  // Check root directory as well
  const rootTsconfig = path.join(root, 'tsconfig.json');
  try {
    await fsAsync.access(rootTsconfig);
    return rootTsconfig;
  } catch {
    return null;
  }
}

async function typeCheck(configFile: string, configDir: string): Promise<void> {
  // Find and read tsconfig.json
  const tsconfigPath = await findClosestTsconfig(configDir);
  
  const defaultCompilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    esModuleInterop: true,
    strict: true,
    baseUrl: configDir,
    paths: {
      "~/*": ["./*"]
    }
  };

  let parsedCommandLine: ts.ParsedCommandLine;
  
  try {
    const configJson = tsconfigPath 
      ? jsonc.parse(await fsAsync.readFile(tsconfigPath, 'utf-8'))
      : { compilerOptions: {} };
    
    const basePath = tsconfigPath ? path.dirname(tsconfigPath) : configDir;
    
    parsedCommandLine = ts.parseJsonConfigFileContent(
      configJson,
      ts.sys,
      basePath,
      defaultCompilerOptions,
      tsconfigPath ?? undefined
    );

    console.log(tsconfigPath 
      ? `Using tsconfig.json from ${tsconfigPath}`
      : 'No tsconfig.json found, using default compiler options'
    );
  } catch (error) {
    console.warn(`Failed to parse tsconfig.json at ${tsconfigPath}, using default options:`, error);
    parsedCommandLine = ts.parseJsonConfigFileContent(
      { compilerOptions: {} },
      ts.sys,
      configDir,
      defaultCompilerOptions
    );
  }

  // Create a program instance to parse and type check
  const program = ts.createProgram({
    rootNames: [configFile],
    options: parsedCommandLine.options
  });

  // Get the diagnostics
  const diagnostics = [
    ...program.getSemanticDiagnostics(),
    ...program.getSyntacticDiagnostics(),
    ...program.getGlobalDiagnostics(),
  ];

  if (diagnostics.length > 0) {
    const formatHost: ts.FormatDiagnosticsHost = {
      getCanonicalFileName: path => path,
      getCurrentDirectory: ts.sys.getCurrentDirectory,
      getNewLine: () => ts.sys.newLine
    };
    
    const message = ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost);
    throw new Error(`TypeScript compilation failed:\n${message}`);
  }
}

async function buildConfigFile(configDir: string): Promise<void> {
  await fsAsync.mkdir(path.join(configDir, "out"), {recursive: true});
  const configMode = await getConfigMode(configDir);
  const isStandalone = configMode == ConfigMode.STANDALONE;
  
  console.log("Is standalone package:", isStandalone);

  const configFiles = await glob('**/*.config.ts', { 
    cwd: configDir,
    absolute: true
  });

  if (configFiles.length === 0) {
    console.log('No config files found.');
    return;
  }

  // Now handle config files for JSON output
  for (const configFile of configFiles) {
    console.log(`Processing config file ${configFile}...`);
    
    // Type check first
    try {
      await typeCheck(configFile, configDir);
    } catch (error) {
      console.error(`Type checking failed for ${configFile}`);
      throw error;
    }

    // If type checking passes, proceed with esbuild
    const buildResult = await esbuild.build({
      entryPoints: [configFile],
      bundle: true,
      platform: 'node',
      format: 'esm',
      write: false,
      packages: 'external',
      alias: {
        '~': path.resolve(configDir),
      },
      absWorkingDir: configDir,
      target: 'es2020',
      loader: { '.ts': 'ts' },
      resolveExtensions: ['.ts', '.js', '.json'],
    });

    if (buildResult.errors.length > 0) {
      throw new Error(`Failed to compile ${configFile}: ${JSON.stringify(buildResult.errors)}`);
    }

    if (!buildResult.outputFiles || buildResult.outputFiles.length === 0) {
      throw new Error(`No output generated for ${configFile}`);
    }

    try {
      // Get the compiled code from the first output file
      const compiledCode = buildResult.outputFiles[0].text;
      
      // Create a data URL from the compiled code
      const dataUrl = `data:text/javascript;base64,${Buffer.from(compiledCode).toString('base64')}`;
      
      // Import the compiled config from the data URL
      const configModule = await import(dataUrl);
      const config = configModule.default;
      
      // Write JSON to out directory preserving path structure
      const relPath = path.relative(configDir, path.dirname(configFile));
      const configName = path.basename(configFile, '.config.ts');
      const targetPath = path.join(configDir, "out", relPath, `${configName}.json`);
      await fsAsync.mkdir(path.dirname(targetPath), { recursive: true });
      await writeConfigToFile(config, targetPath);
      console.log(`Config written to ${targetPath}`);
    } catch (error: any) {
      console.error(`Failed to load config from ${configFile}:`, error);
      throw error;
    }
  }

  // Handle standalone mode specific tasks
  if (isStandalone) {
    await processStandaloneMode(configDir);
  }
}

async function processStandaloneMode(configDir: string): Promise<void> {
  console.log("Exporting types for standalone package");

  const packageJsonPath = path.join(configDir, 'package.json');
  const packageJson = await fsAsync.readFile(packageJsonPath, 'utf-8');
  const packageData = JSON.parse(packageJson);
  
  const hasZod = packageData.dependencies?.zod;
  if (!hasZod) {
    await installDependency(configDir, 'zod');
  }

  await runCommand(configDir, 'npx', ['tsc']);

  const jsFiles = await glob('dist/**/*.{js,d.ts}', {
    cwd: configDir,
    absolute: true
  });

  for (const file of jsFiles) {
    const content = await fsAsync.readFile(file, 'utf8');
    // Replace ~ imports with relative paths from dist directory
    const distDir = path.join(configDir, 'dist');
    const relativePath = path.relative(path.dirname(file), distDir);
    const updatedContent = content.replace(
      /from\s+["']~\/(.*?)["']/g,
      (_, importPath) => `from "${relativePath}/${importPath}"`
    );
    await fsAsync.writeFile(file, updatedContent, 'utf8');
  }

  try {
    const packageJsonPath = path.join(configDir, 'package.json');
    const packageJson = await fsAsync.readFile(packageJsonPath, 'utf-8');
    const packageData = JSON.parse(packageJson);
    
    // Update main and types fields to point to dist
    if (packageData.main) {
      packageData.main = packageData.main.replace(/^(\.\/)?src\//, './dist/src/');
    }
    if (packageData.types) {
      packageData.types = packageData.types.replace(/^(\.\/)?src\//, './dist/src/');
    }
    
    await fsAsync.writeFile(
      path.join(configDir, 'dist', 'package.json'),
      JSON.stringify(packageData, null, 2)
    );
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      console.error("Error handling package.json:", error);
    }
  }
}