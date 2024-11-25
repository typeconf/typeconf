import {
  compile as typespecCompile,
  NodeHost,
  CompilerHost,
  Program,
  logDiagnostics,
} from "@typespec/compiler";
import { spawn } from "child_process";
import { promises as fsAsync } from 'fs';
import {console} from "inspector";
import path from "path";
import { fileURLToPath } from "url";

const EMITTER = "@typeconf/config-emitter";

interface SpawnError {
  errno: number;
  code: "ENOENT";
  sysCall: string;
  path: string;
  spawnArgs: string[];
}

export async function compile(configDir: string): Promise<void> {
  console.log(`Compiling ${configDir}...`);

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
    path.join(configDir, "src"),
    {
      emit: [getEmitterPath()],
      outputDir: configDir,
      options: options,
    },
  );

  logProgramResult(NodeHost, program);
  if (program.hasError()) {
    process.exit(1);
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

  if (program.diagnostics.length > 0) {
    log("Diagnostics were reported during compilation:\n");
    logDiagnostics(program.diagnostics, host.logSink);
  } else {
    log("Compilation completed successfully.");
  }
  // eslint-disable-next-line no-console
  console.log(); // Insert a newline
}

async function buildConfigFile(configDir: string): Promise<void> {
  await fsAsync.mkdir(path.join(configDir, "out"), {recursive: true});

  const targetPath = path.join("out", `${path.basename(configDir)}.json`);
  const child = spawn("npm", ["run", "start", targetPath], {
    shell: process.platform === "win32",
    stdio: "inherit",
    cwd: configDir,
    env: process.env,
  });

  return new Promise(() => {
    child.on("error", (error: SpawnError) => {
      if (error.code === "ENOENT") {
        console.log(
          "Cannot find `npm` executable. Make sure to have npm installed in your path.",
        );
      } else {
        console.log(error.toString());
      }
      process.exit(error.errno);
    });
    child.on("exit", (exitCode) => {
      if (exitCode != 0) {
        process.exit(exitCode);
      }
    });
  });
}
