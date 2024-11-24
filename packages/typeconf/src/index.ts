#!/usr/bin/env node
import { Command } from "commander";
import { compile } from "./compile/compile.js";
import initProject from "./init.js";
import { updateConfig } from "./update.js";

const program = new Command();

program
  .version("0.1.0")
  .description("A CLI tool for writing configs with types");

program
  .command("init [directory]", { isDefault: false })
  .description("Init new configuration package")
  .action(async (directory) => {
    await initProject(directory ?? process.cwd());
  });

program
  .command("update", { isDefault: false })
  .description("Update config types in your project")
  .action(async () => {
    await updateConfig();
  });

program
  .command("compile <pkg>", { isDefault: false })
  .option(
    "--watch",
    "Run in background and automatically recompile on changes",
    false,
  )
  .option(
    "--output-dir <outputDir>",
    "Specify the output directory for compilation",
    "",
  )
  .description("Compile the configuration package")
  .action(async (pkg: string) => {
    const options = program.opts();
    let outputDir = options.outputDir;
    if (outputDir == null || outputDir == "") {
      outputDir = pkg;
    }
    await compile(pkg, outputDir);
  });

program.parse(process.argv);
