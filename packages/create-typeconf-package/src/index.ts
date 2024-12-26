#!/usr/bin/env node

import { fileURLToPath } from "url";
import { Command } from "commander";
// TODO: replace this with direct json import after that stops being experimental
import { PackageJson, readConfigFromFile } from "@typeconf/package-json";
import { initPackage } from "@typeconf/typeconf";

const VERSION = readConfigFromFile<PackageJson>(
  fileURLToPath(import.meta.resolve("../package.json")),
).version;
const program = new Command();

program
  .version(VERSION)
  .description("A CLI tool for creating new typeconf package");

program.arguments("<target-directory>").action(async (targetDir: string) => {
  console.log(`create ${targetDir}`);
  initPackage(targetDir);
});

program.parse(process.argv);
