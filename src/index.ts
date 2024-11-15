import { Command } from "commander";

//add the following line
const program = new Command();

program
  .version("1.0.0")
  .description("CLI to add types to configs")
  .command("generate <config>")
  .description("Generate something")
  .action((config) => {
      console.log(config);
  })
  .command("init-configs <config>")
  .description("Init configs")
  .action((config) => {
      console.log(config);
  })
  .command("add-config <config>")
  .description("Add config")
  .action((config) => {
      console.log(config);
  })
  .parse(process.argv);

const options = program.opts();
