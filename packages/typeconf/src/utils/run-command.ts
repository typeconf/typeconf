import { spawn, StdioOptions } from "child_process";

interface SpawnError {
  errno: number;
  code: "ENOENT";
  sysCall: string;
  path: string;
  spawnArgs: string[];
}

export async function runCommand(
  cwd: string, 
  command: string, 
  params: Array<string>, 
  stdin?: string,
  silent?: boolean
): Promise<void> {
  const stdio: StdioOptions = [
    stdin ? 'pipe' : silent ? 'ignore' : 'inherit',
    silent ? 'ignore' : 'inherit',
    silent ? 'ignore' : 'inherit',
  ];
  
  const child = spawn(command, params, {
    shell: process.platform === "win32",
    stdio,
    cwd: cwd,
    env: process.env,
  });

  if (stdin && child.stdin) {
    child.stdin.write(stdin);
    child.stdin.end();
  }

  return new Promise((resolve, reject) => {
    child.on("error", (error: SpawnError) => {
      if (error.code === "ENOENT") {
        console.log(`Cannot find "${command}" executable`);
      } else if (!silent) {
        console.log(error.toString());
      }
      reject(new Error("Command execution failed"));
    });
    child.on("exit", (exitCode) => {
      if (exitCode != 0) {
        reject(new Error("Command execution failed"));
      } else {
        resolve();
      }
    });
  });
} 