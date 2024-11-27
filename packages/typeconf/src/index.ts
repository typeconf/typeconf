#!/usr/bin/env node
import { Command } from "commander";
import { compile } from "./compile/compile.js";
import initProject from "./init.js";
import { updateConfig } from "./update.js";
import { log_event } from "./logging.js";

const program = new Command();
export const VERSION = "0.1.0";

program
  .version(VERSION)
  .description("A CLI tool for writing configs with types");

program
  .command("init [directory]", { isDefault: false })
  .description("Init new configuration package")
  .action(async (directory) => {
    const params: Record<string, string> = {
        "configDir": directory,
    };
    log_event("info", "init", "start", params);
    await initProject(directory ?? process.cwd());
    log_event("info", "init", "end", params);
  });

program
  .command("update", { isDefault: false })
  .description("Update config types in your project")
  .action(async () => {
    log_event("info", "update", "start");
    await updateConfig();
    log_event("info", "update", "end");
  });

program
  .command("compile <configDir>", { isDefault: false })
  .option(
    "--watch",
    "Run in background and automatically recompile on changes",
    false,
  )
  .description("Compile the configuration package")
  .action(async (configDir: string, options: any) => {
    const params: Record<string, string> = {
        "configDir": configDir,
        "watch": (options?.watch ?? false).toString(),
    };
    log_event("info", "compile", "start", params);
    await compile(configDir);
    log_event("info", "compile", "end", params);
  });

program.parse(process.argv);
