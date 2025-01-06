import fs from "fs";
import { fileURLToPath } from "url";

import { compile as typeconfCompile } from "./compile/compile.js";
import initProject from "./init.js";
import { log_event } from "./logging.js";
import path from "path";
import { PackageJson, readConfigFromFile } from "@typeconf/package-json";
import { initPackageNonInteractive as initPackageImpl } from "./init.js";

export const VERSION = readConfigFromFile<PackageJson>(
  fileURLToPath(import.meta.resolve("../package.json")),
).version;
// export const VERSION = "dev";

async function doCompile(configDir: string, logParams: Record<string, string>) {
  log_event("info", "compile", "start", logParams);
  await typeconfCompile(configDir);
  await log_event("info", "compile", "end", logParams);
}

async function doCompileInLoop(
  configDir: string,
  logParams: Record<string, string>,
  onFinish: Function,
) {
  try {
    await doCompile(configDir, logParams);
  } catch (e) {
    console.log(e);
  }
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

export async function initPackageNonInteractive(directory: string, packageName: string) {
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
