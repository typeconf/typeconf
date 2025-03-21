import fs from "fs";
import { isCloudEnabled, typeconfCloud } from "./cloud/cloud.js";

export type Config = {
  configs: Array<string>;
};

export function readConfigFromFile<T>(filepath: string): T {
  const data = fs.readFileSync(filepath, "utf8");
  return JSON.parse(data) as T;
}

export async function writeConfigToFile(values: any, filepath?: string) {
  console.log(`Writing config file to ${filepath}`);
  if (values == null) {
      return;
  }
  const data = JSON.stringify(values, null, 4);
  const target_path = filepath;
  if (target_path != null) {
      fs.writeFileSync(target_path, data, { flag: 'w' });
  } else {
      console.log(data);
  }
}

export async function readConfig<T>(filepath: string): Promise<T> {
  if (isCloudEnabled()) {
    const result = await typeconfCloud().readConfig<T>(filepath);
    
    if (result.err) throw result.err;
    
    if (!result.config) throw new Error("No config found");
    
    return result.config;
  }
  
  return readConfigFromFile<T>(filepath);
}
