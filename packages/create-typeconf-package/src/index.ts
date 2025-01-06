#!/usr/bin/env node

import { fileURLToPath } from "url";
import { Command } from "commander";
// TODO: replace this with direct json import after that stops being experimental
import { PackageJson, readConfigFromFile } from "@typeconf/package-json";
import { initPackageNonInteractive } from "@typeconf/typeconf";
import prompts from "prompts";
import path from "path";
import fs from 'fs';

const VERSION = readConfigFromFile<PackageJson>(
  fileURLToPath(import.meta.resolve("../package.json")),
).version;
const program = new Command();

program
  .version(VERSION)
  .description("A CLI tool for creating new typeconf package");

program.arguments("[target-directory]").action(async (targetDir?: string) => {
  if (!targetDir) {
    const response = await prompts({
      type: "text",
      name: "projectName",
      message: "Configuration package name",
    });
    if (!response.projectName) {
      return;
    }
    const packagePath = path.join(process.cwd(), response.projectName);
    const packageName = response.projectName;
    initPackageNonInteractive(packagePath, packageName);
    return;
  }

  const providedPath = path.resolve(targetDir) ?? process.cwd();
  if (fs.existsSync(providedPath)) {
    const files = fs.readdirSync(providedPath);
    if (files.length > 0) {
      const confirm_resp = await prompts({
        type: "confirm",
        name: "confirmDirectory",
        message:
          "Current directory is not empty, are you sure you want to initialize a project here?",
      });

      if (!confirm_resp.confirmDirectory) {
        console.log("Exiting");
        return;
      }
    }
  }
  initPackageNonInteractive(providedPath, path.basename(providedPath));
  return;
});

program.parse(process.argv);
