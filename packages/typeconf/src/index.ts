import fs from "fs";
import { fileURLToPath } from "url";
import { Worker } from "worker_threads";

import { compile as typeconfCompile } from "./compile/compile.js";
import initProject from "./init.js";
import { log_event } from "./logging.js";
import path from "path";

import { initPackageNonInteractive as initPackageImpl } from "./init.js";
import {
  compileV2 as compileV2Impl,
  CompileV2Options,
} from "./compile-v2/compile-v2.js";

interface PackageJson {
  version: string;
  [key: string]: any;
}

export const VERSION = (() => {
  if (process.env["NODE_ENV"] == "dev") {
    return "dev";
  }
  const packagePath = fileURLToPath(import.meta.resolve("../package.json"));
  const packageContent = fs.readFileSync(packagePath, "utf-8");
  return JSON.parse(packageContent).version;
})();

async function doCompile(configDir: string, logParams: Record<string, string>) {
  log_event("info", "compile", "start", logParams);
  await typeconfCompile(configDir);
  await log_event("info", "compile", "end", logParams);
}

async function runWorker(configDir: string) {
  const worker = new Worker(new URL("./worker.js", import.meta.url), {
    workerData: configDir,
  });

  return new Promise((resolve, reject) => {
    worker.on("message", (message) => {
      resolve(message);
      worker.terminate();
    });

    worker.on("error", (error) => {
      reject(error);
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

async function doCompileInLoop(
  configDir: string,
  logParams: Record<string, string>,
  onFinish: Function,
) {
  log_event("info", "compile", "start", logParams);
  try {
    const result = await runWorker(configDir);
    console.log("Main thread received:", result);
  } catch (e) {
    console.log(e);
  }
  await log_event("info", "compile", "end", logParams);
  onFinish();
}

export async function initPackage(directory: string) {
  const configDir = path.resolve(directory);
  const params: Record<string, string> = {
    configDir: path.basename(configDir),
  };
  log_event("info", "init", "start", params);
  await initProject(configDir ?? process.cwd());
  await log_event("info", "init", "end", params);
}

export async function initPackageNonInteractive(
  directory: string,
  packageName: string,
) {
  const params: Record<string, string> = {
    configDir: path.basename(directory),
    packageName: packageName,
  };
  log_event("info", "init", "start", params);
  await initPackageImpl(directory, packageName);
  await log_event("info", "init", "end", params);
}

export async function compilePackage(directory: string, watch: boolean) {
  const configDir = path.resolve(directory);
  const params: Record<string, string> = {
    configDir: path.basename(configDir), // only log basename
    watch: watch.toString(),
  };
  await doCompile(configDir, params);
  if (watch) {
    let compileTask: Promise<void> | undefined = undefined;
    fs.watch(configDir, { recursive: true }, async (_eventType, filename) => {
      if (
        !filename ||
        !fs.existsSync(path.join(configDir, filename)) ||
        filename.startsWith("dist/") ||
        filename.startsWith("out/")
      ) {
        return;
      }
      if (compileTask !== undefined) {
        return;
      }
      console.log(`Detected changes in ${filename}, recompiling`);
      compileTask = doCompileInLoop(configDir, params, () => {
        compileTask = undefined;
      });
    });
  }
}

export async function compileV2(
  directory: string,
  options: CompileV2Options = {},
) {
  const configDir = path.resolve(directory);
  const params: Record<string, string> = {
    configDir: path.basename(configDir),
    version: "v2",
  };
  log_event("info", "compile-v2", "start", params);
  await compileV2Impl(configDir, options);
  await log_event("info", "compile-v2", "end", params);
}
