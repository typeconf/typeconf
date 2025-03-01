#!/usr/bin/env node

import { Command } from "commander";
import {compilePackage, initPackage, VERSION} from "./index.js";
import { validateConfig } from "./validate.js";
import { promises as fs } from "fs";
import { readConfigFromFile } from "./compile/compile.js";
// import { parse, stringify } from "yaml";

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

class PageFlags {
}

program
  .command("validate <config> <schema>", { isDefault: false })
  .description("Validate config against JSON schema")
  .action(async (configFile: string, schemaFile: string) => {
    try {
      // Read config file
      const config = readConfigFromFile(configFile);

      // Read schema file
      const schema = readConfigFromFile(schemaFile);
      // const schemaContent = await fs.readFile(schemaFile, 'utf8');
      // const schema = parse(schemaContent);

      // Validate
      const errors = validateConfig<PageFlags>(config, schema);

      if (errors.length === 0) {
        console.log('Config is valid!');
      } else {
        console.error('Config validation failed:');
        errors.forEach(error => {
          console.error(`- ${error.message}${error.path ? ` at ${error.path}` : ''}`);
        });
        process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse(process.argv);
