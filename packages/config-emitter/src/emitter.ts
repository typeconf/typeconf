import { EmitContext, emitFile, resolvePath } from "@typespec/compiler";
import { $onEmit as typescriptEmit } from "@typespec-tools/emitter-typescript";
import { promises as fsAsync } from 'fs';
import path from 'path';

async function fileExists(filePath: string): Promise<boolean> {
  return fsAsync.access(filePath).then(() => true).catch(() => false);
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  const exists = await fileExists(filePath);
  if (!exists) return null;
  
  const content = await fsAsync.readFile(filePath, 'utf-8');
  try {
    return JSON.parse(content) as T;
  } catch (e) {
    console.log(`Failed to parse JSON from ${filePath}:`, e);
    return null;
  }
}

async function findClosestTsconfig(startDir: string): Promise<string | null> {
  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    const tsconfigPath = path.join(currentDir, 'tsconfig.json');
    const exists = await fileExists(tsconfigPath);
    if (exists) {
      return tsconfigPath;
    }
    currentDir = path.dirname(currentDir);
  }

  // Check root directory as well
  const rootTsconfig = path.join(root, 'tsconfig.json');
  return await fileExists(rootTsconfig) ? rootTsconfig : null;
}

interface TsConfig {
  compilerOptions?: {
    moduleResolution?: string;
  };
}

async function shouldOmitExtensions(projectDir: string): Promise<boolean> {
  const tsconfigPath = await findClosestTsconfig(projectDir);
  if (!tsconfigPath) {
    console.log("No tsconfig.json found in directory tree, assuming bundler module resolution.");
    return true;
  }

  const tsconfig = await readJsonFile<TsConfig>(tsconfigPath);
  if (!tsconfig) {
    console.log("Failed to read tsconfig.json, assuming bundler module resolution.");
    return true;
  }

  const moduleResolution = tsconfig.compilerOptions?.moduleResolution;
  return moduleResolution === 'bundler' || 
         moduleResolution === 'node16' || 
         moduleResolution === 'nodenext';
}

export async function $onEmit(context: EmitContext) {
  if (context.program.compilerOptions.noEmit) {
    return;
  }

  const parentDir = path.dirname(context.emitterOutputDir);
  const valuesConfigPath = path.join(parentDir, 'values.config.ts');
  const hasValuesConfig = await fileExists(valuesConfigPath);
  const omitExtensions = await shouldOmitExtensions(parentDir);
  console.log("Using bundler module resolution:", omitExtensions);
  
  const extension = omitExtensions ? '' : '.js';
  const valuesPath = hasValuesConfig 
    ? `../values.config${extension}`
    : `../src/values.config${extension}`;

  await emitFile(context.program, {
    path: resolvePath(context.emitterOutputDir, "index.ts"),
    content: `// generated by Typeconf, DO NOT EDIT
export * from '@typeconf/sdk' // Typeconf SDK
export * from './all${extension}' // Your config types
export { default as values } from '${valuesPath}' // Your config values`,
  });
  await typescriptEmit(context);
}
