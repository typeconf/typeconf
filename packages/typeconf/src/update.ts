import fs from "fs";
import path from "path";
import { createJiti } from "jiti";
import { Config } from "@typeconf/sdk";

export async function updateConfig(): Promise<void> {
  // TODO: for remote configs npm pack --pack-destination and copy
  const jiti = createJiti(import.meta.url);
  const filepath = path.join(process.cwd(), "typeconf.config.ts");
  const conf = (await jiti.import(filepath, {
    default: true,
  })) as Config;

  const baseDir = process.cwd();
  fs.mkdirSync(path.join(baseDir, "typeconf-gen"), { recursive: true });
  for (const confDir of conf.configs) {
    updateConfigFromDirectory(baseDir, confDir);
  }
}

function updateConfigFromDirectory(baseDir: string, configDir: string): void {
  fs.copyFileSync(
    path.join(configDir, "types", "all.ts"),
    path.join(baseDir, "typeconf-gen", "all.ts"),
  );
}
