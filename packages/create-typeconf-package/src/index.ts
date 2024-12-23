#!/usr/bin/env -S node --no-warnings

import { Command } from "commander";
import packageJson from "../package.json" with { type: "json" }
import { initPackage } from "@typeconf/typeconf"

const VERSION = packageJson.version;
const program = new Command();

program
  .version(VERSION)
  .description("A CLI tool for creating new typeconf package");

program.arguments("<target-directory>").action(async (targetDir: string) => {
    console.log(`create ${targetDir}`);
    initPackage(targetDir);
});

program.parse(process.argv);
