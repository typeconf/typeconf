import { compile as typespecCompile, NodeHost, CompilerHost, Program, logDiagnostics } from "@typespec/compiler";
import path from "path";
import { fileURLToPath } from "url";

const EMITTER = "../emitter/";

export async function compile(pkg: string, outputDir: string): Promise<void> {
  console.log(`Compiling ${pkg}...`);

  let options: Record<string, any> = {};
  options[EMITTER] = {
      "emitter-output-dir": `${outputDir}/types`,
  };
  const program = await typespecCompile({
    ...NodeHost,
    logSink: {
        log: (log) => {
            console.log(log);
        }
    }
  }, pkg, {
    emit: [getEmitterPath()],
    outputDir: outputDir,
    options: options,
  });

  logProgramResult(NodeHost, program);
  if (program.hasError()) {
    process.exit(1);
  }
}

function getEmitterPath() {
  const emitterPath = fileURLToPath(import.meta.resolve(EMITTER));
  return path.join(path.dirname(emitterPath), "..");
}

function logProgramResult(
  host: CompilerHost,
  program: Program | Program,
  { showTimestamp }: { showTimestamp?: boolean } = {},
) {
  const log = (message?: any, ...optionalParams: any[]) => {
    const timestamp = showTimestamp ? `[${new Date().toLocaleTimeString()}] ` : "";
    // eslint-disable-next-line no-console
    console.log(`${timestamp}${message}`, ...optionalParams);
  };

  if (program.diagnostics.length > 0) {
    log("Diagnostics were reported during compilation:\n");
    logDiagnostics(program.diagnostics, host.logSink);
  } else {
    log("Compilation completed successfully.");
  }
  // eslint-disable-next-line no-console
  console.log(); // Insert a newline
}
