import { EmitContext, emitFile, resolvePath } from "@typespec/compiler";
import { promises as fsAsync } from 'fs';
import path from 'path';
import { typescriptEmit } from "./typescript-emitter.js";
import { zodEmit } from "./zod-emitter.js";
import { jsonc } from 'jsonc';

async function fileExists(filePath: string): Promise<boolean> {
  return fsAsync.access(filePath).then(() => true).catch(() => false);
}

async function readJsoncFile<T>(filePath: string): Promise<T | null> {
  const exists = await fileExists(filePath);
  if (!exists) return null;
  
  const content = await fsAsync.readFile(filePath, 'utf-8');
  try {
    return jsonc.parse(content) as T;
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

  const tsconfig = await readJsoncFile<TsConfig>(tsconfigPath);
  if (!tsconfig) {
    console.log("Failed to read tsconfig.json, assuming bundler module resolution.");
    return true;
  }

  const moduleResolution = tsconfig.compilerOptions?.moduleResolution;
  return moduleResolution === 'bundler' || 
         moduleResolution === 'node16' || 
         moduleResolution === 'nodenext';
}

async function findConfigFiles(startDir: string): Promise<string[]> {
  const configFiles: string[] = [];
  const excludedDirs = ['dist', 'out', 'types'];
  
  try {
    const files = await fsAsync.readdir(startDir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(startDir, file.name);
      
      if (file.isDirectory() && !excludedDirs.includes(file.name)) {
        const nestedFiles = await findConfigFiles(fullPath);
        configFiles.push(...nestedFiles);
      } else if (file.isFile() && file.name.endsWith('.config.ts')) {
        configFiles.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${startDir}:`, error);
  }
  
  return configFiles;
}

export async function $onEmit(context: EmitContext) {
  if (context.program.compilerOptions.noEmit) {
    return;
  }

  const parentDir = path.dirname(context.emitterOutputDir);
  const omitExtensions = await shouldOmitExtensions(parentDir);
  console.log("Using bundler module resolution:", omitExtensions);
  
  const extension = omitExtensions ? '' : '.js';
  const configFiles = await findConfigFiles(parentDir);
  
  // Generate imports for all found config files
  const configImports = configFiles.map(filePath => {
    const relativePath = path.relative(context.emitterOutputDir, filePath);
    // Remove .ts extension and ensure proper path format
    const importPath = relativePath.replace(/\.ts$/, extension);
    const fullPath = path.relative(parentDir, filePath).replace(/\.config\.ts$/, '');
    const configAlias = fullPath.split('/').map((part, i) => 
      i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
    ).join('');
    return `export { default as ${configAlias}Config } from '${importPath}'`;
  }).join('\n');

  await emitFile(context.program, {
    path: resolvePath(context.emitterOutputDir, "index.ts"),
    content: `// generated by Typeconf, DO NOT EDIT
import fs from 'fs';

export * from './all${extension}' // Your config types
${configImports}
`,
  });
  await typescriptEmit(context);
  await zodEmit(context);
}
