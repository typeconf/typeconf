#!/usr/bin/env node

import { Command } from "commander";
import { compilePackage, initPackage, VERSION, compileV2 } from "./index.js";
import {
  getCloudConfigValue,
  listUserConfigs,
  setCloudConfigValue,
} from "./cloud/cli.js";

const program = new Command();

program
  .version(VERSION)
  .description("A CLI tool for writing configs with types");

program
  .command("init [directory]", { isDefault: false })
  .description("Init new configuration package")
  .action(async (directoryRaw) => {
    await initPackage(directoryRaw);
  });

program
  .command("build <configDir>", { isDefault: false })
  .option(
    "--watch",
    "Run in background and automatically recompile on changes",
    false,
  )
  .description("Compile the configuration package")
  .action(async (configDirRaw: string, options: any) => {
    await compilePackage(configDirRaw, options.watch ?? false);
  });

program
  .command("build-v2 <configDir>", { isDefault: false })
  .option("--output-dir <dir>", "Output directory for generated files")
  .option(
    "--watch",
    "Run in background and automatically recompile on changes",
    false,
  )
  .description(
    "Compile the configuration package using v2 build system (TypeScript types to Zod/JSON schemas)",
  )
  .action(async (configDirRaw: string, options: any) => {
    const path = await import("path");
    await compileV2(configDirRaw, {
      outputDir: options.outputDir || path.join(configDirRaw, "v2-out"),
      watch: options.watch ?? false,
    });
  });

let cloud = program.command("cloud").description("Cloud-related commands");

cloud
  .command("update-config-value <configName>")
  .requiredOption("--project <project>", "Project name or id")
  .option("--json <json>", "Set JSON value")
  .option("--json-file <json>", "Set JSON value from file")
  .description("Update configuration in cloud")
  .action(
    async (
      configName: string,
      options: { project: string; json?: string; jsonFile?: string },
    ) => {
      const fs = await import("fs");
      let jsonStr =
        options.json ??
        (options.jsonFile ? fs.readFileSync(options.jsonFile, "utf8") : null);
      let jsonData = jsonStr ? JSON.parse(jsonStr) : null;

      await setCloudConfigValue(configName, options.project, jsonData);
    },
  );

cloud
  .command("get-config-value <configName>")
  .requiredOption("--project <project>", "Project name or id")
  .description("Fetch configuration from cloud")
  .action(async (configName: string, options: { project: string }) => {
    await getCloudConfigValue(configName, options.project);
  });

cloud
  .command("list-configs")
  .description("List all configs user has access to")
  .option("--format <format>", "Output format (json/table)", "table")
  .action(async (options: { format: string }) => {
    await listUserConfigs(options.format === "json");
  });

program.parse(process.argv);
