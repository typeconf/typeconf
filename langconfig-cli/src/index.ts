import { Command } from "commander";
import { compile } from "./compile/compile.js";

const program = new Command();

program
  .version("0.1.0")
  .description("A CLI tool for compiling and managing configuration packages")

program
  .command("compile <pkg> <outputDir>", { isDefault: false })
  .description("Compile the configuration package") 
  .action(async (pkg: string, outputDir: string) => {
     await compile(pkg, outputDir);
  })

program.parse(process.argv);

const options = program.opts();
