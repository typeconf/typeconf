import {
  compile as typespecCompile,
  NodeHost,
  CompilerHost,
  Program,
  logDiagnostics,
} from "@typespec/compiler";
import { spawn, StdioOptions } from "child_process";
import { promises as fsAsync } from 'fs';
import fs from 'fs';
import path from "path";
import { fileURLToPath } from "url";

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

    if (!mainTspExists && !packageJsonExists) {
      return ConfigMode.IN_PROJECT;
    }
    return ConfigMode.STANDALONE;
  } catch {
    return ConfigMode.STANDALONE;
  }
}

interface SpawnError {
  errno: number;
  code: "ENOENT";
  sysCall: string;
  path: string;
  spawnArgs: string[];
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

  const mainTspPath = path.join(configDir, 'main.tsp');
  const hasMainTsp = await fsAsync.access(mainTspPath).then(() => true).catch(() => false);
  const sourcePath = hasMainTsp ? configDir : path.join(configDir, 'src');

  let options: Record<string, any> = {};
  options[EMITTER] = {
    "emitter-output-dir": `${configDir}/types`,
    "output-file": "all.ts",
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

async function runCommand(
  cwd: string, 
  command: string, 
  params: Array<string>, 
  stdin?: string
): Promise<void> {
  const stdio: StdioOptions = stdin ? ['pipe', 'inherit', 'inherit'] : 'inherit';
  
  const child = spawn(command, params, {
    shell: process.platform === "win32",
    stdio,
    cwd: cwd,
    env: process.env,
  });

  if (stdin && child.stdin) {
    child.stdin.write(stdin);
    child.stdin.end();
  }

  return new Promise((resolve, reject) => {
    child.on("error", (error: SpawnError) => {
      if (error.code === "ENOENT") {
        console.log(`Cannot find "${command}" executable`);
      } else {
        console.log(error.toString());
      }
      reject(new Error("Config generation failed"));
    });
    child.on("exit", (exitCode) => {
      if (exitCode != 0) {
        reject(new Error("Config generation failed"));
      } else {
        resolve();
      }
    });
  });
}


export function readConfigFromFile<T>(filepath: string): T {
  const data = fs.readFileSync(filepath, "utf8");
  return JSON.parse(data) as T;
}

export function writeConfigToFile(values: any, filepath?: string) {
    console.log(`Writing config file to ${filepath}`);
    if (values == null) {
        return;
    }
    const data = JSON.stringify(values, null, 4);
    const target_path = filepath;
    if (target_path != null) {
        fs.writeFileSync(target_path, data, { flag: 'w' });
    } else {
        console.log(data);
    }
}

async function buildConfigFile(configDir: string): Promise<void> {
  await fsAsync.mkdir(path.join(configDir, "out"), {recursive: true});
  const targetPath = path.join("out", `${path.basename(configDir)}.json`);
  const configMode = await getConfigMode(configDir);

  const isStandalone = configMode == ConfigMode.STANDALONE;
  console.log("Is standalone package:", isStandalone);
  if (isStandalone) {
    await runCommand(configDir, "npx", ["tsc"]);
    await runCommand(configDir, "npx", ["resolve-tspaths"]);

    const configModule: any = await import(path.join(configDir, "dist/types/index.js"));
    writeConfigToFile(configModule.values, targetPath);
    return;
  }
  await runCommand(configDir, "npx", ["tsx", "--input-type=module"], `
import { writeConfigToFile } from '@typeconf/typeconf';
import * as configs from '${configDir}/types/index.js';

writeConfigToFile(configs.default.values, '${targetPath}');`);
}
