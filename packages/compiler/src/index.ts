import { Command } from "commander";
import { compile } from "./compile/compile.js";

const program = new Command();

program
  .version("0.1.0")
  .description("A CLI tool for writing configs with types")

program
  .command("compile <pkg>", { isDefault: false })
  .option("--output-dir <outputDir>", "Specify the output directory for compilation", '')
  .description("Compile the configuration package")
  .action(async (pkg: string) => {
     const options = program.opts();
     let outputDir = options.outputDir;
     if (outputDir == null || outputDir == '') {
         outputDir = pkg;
     }
     await compile(pkg, outputDir);
  })

program.parse(process.argv);
