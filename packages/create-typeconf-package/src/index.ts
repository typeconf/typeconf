#!/usr/bin/env node

import { Command } from "commander";
// TODO: replace this with direct json import after that stops being experimental
import { PackageJson, readConfigFromFile } from "@typeconf/package-json";
import { initPackage } from "@typeconf/typeconf";
import path from "path";

const VERSION = readConfigFromFile<PackageJson>(
  path.resolve(import.meta.dirname, "../package.json"),
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
