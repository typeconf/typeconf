import {
  compile as typespecCompile,
  NodeHost,
  CompilerHost,
  Program,
  logDiagnostics,
} from "@typespec/compiler";
import { spawn } from "child_process";
import { promises as fsAsync } from 'fs';
import path from "path";
//import { fileURLToPath } from "url";
import {generateTemplates} from '../init.js';

const EMITTER = "@typeconf/config-emitter";

interface SpawnError {
  errno: number;
  code: "ENOENT";
  sysCall: string;
  path: string;
  spawnArgs: string[];
}

async function reactPackageFile(configDir: string, host: CompilerHost): Promise<Record<string, any>> {
  // good candidate for typeconf package!
  const pkgPath = path.join(configDir, "package.json");
  const fileContent = await host.readFile(pkgPath);
  return JSON.parse(fileContent.text) as Record<string, any>;
}

export async function compile(configDir: string, host: CompilerHost = NodeHost): Promise<void> {
  const packageFile = await reactPackageFile(configDir, host);
  const projectName = packageFile["projectName"] ?? path.basename(configDir);
  await generateTemplates(projectName, configDir, false)

  console.log(`Compiling ${configDir}...`);

  let options: Record<string, any> = {};
  options[EMITTER] = {
    "emitter-output-dir": `${configDir}/types`,
    "output-file": "all.ts",
  };
  const program = await typespecCompile(
    {
      ...host,
      logSink: {
        log: (log) => {
          console.log(log);
        },
      },
    },
    path.join(configDir, "src"),
    {
      emit: [getEmitterPath()],
      outputDir: configDir,
      options: options,
    },
  );

  logProgramResult(host, program);
  if (program.hasError()) {
    throw new Error("Compilation failed");
  }

  await buildConfigFile(configDir);
}

function getEmitterPath() {
  const emitterPath = import.meta.resolve(EMITTER).replace("file://", "");
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
  // eslint-disable-next-line no-console
  console.log(); // Insert a newline
}

async function runCommand(cwd: string, command: string, params: Array<string>): Promise<void> {
  const child = spawn(command, params, {
    shell: process.platform === "win32",
    stdio: "inherit",
    cwd: cwd,
    env: process.env,
  });

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

async function buildConfigFile(configDir: string): Promise<void> {
  await fsAsync.mkdir(path.join(configDir, "out"), {recursive: true});
  const targetPath = path.join("out", `${path.basename(configDir)}.json`);

  await runCommand(configDir, "npx", ["tsc"]);
  await runCommand(configDir, "npx", ["resolve-tspaths"]);

  const configModule = await import(path.join(configDir, "dist/src/index.js"));
  await configModule.writeConfigToFile(configModule.values, targetPath);
}
