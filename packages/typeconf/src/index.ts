#!/usr/bin/env node
import fs from "fs";

import { Command } from "commander";
import { compile } from "./compile/compile.js";
import initProject from "./init.js";
import { updateConfig } from "./update.js";
import { log_event } from "./logging.js";
import path from "path";
import { version } from "../package.json";

const program = new Command();
export const VERSION = version;

async function doCompile(configDir: string, logParams: Record<string, string>) {
  log_event("info", "compile", "start", logParams);
  await compile(configDir);
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

program
  .version(VERSION)
  .description("A CLI tool for writing configs with types");

program
  .command("init [directory]", { isDefault: false })
  .description("Init new configuration package")
  .action(async (directoryRaw) => {
    const configDir = path.resolve(directoryRaw);
    const params: Record<string, string> = {
      configDir: path.basename(configDir),
    };
    log_event("info", "init", "start", params);
    await initProject(configDir ?? process.cwd());
    await log_event("info", "init", "end", params);
  });

program
  .command("update", { isDefault: false })
  .description("Update config types in your project")
  .action(async () => {
    log_event("info", "update", "start");
    await updateConfig();
    await log_event("info", "update", "end");
  });

program
  .command("compile <configDir>", { isDefault: false })
  .option(
    "--watch",
    "Run in background and automatically recompile on changes",
    false,
  )
  .description("Compile the configuration package")
  .action(async (configDirRaw: string, options: any) => {
    const configDir = path.resolve(configDirRaw);
    const params: Record<string, string> = {
      configDir: path.basename(configDir), // only log basename
      watch: (options?.watch ?? false).toString(),
    };
    await doCompile(configDir, params);
    if (options?.watch) {
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
  });

program.parse(process.argv);
