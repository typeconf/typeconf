import fs from "fs";

export type ReadConfigOptions = {};

export function readConfigFromFile<T>(filepath: string): T {
  const data = fs.readFileSync(filepath, "utf8");
  return JSON.parse(data) as T;
}

export function readConfig<T>(repoFilePath: string, options: ReadConfigOptions = {}): T {
  /*
  if found env for remote cloud
  get config from remote
  if failed, get config from local
  auto trigger rebuild if local env
  validate using map path -> zod schema
  */
  return readConfigFromFile<T>(repoFilePath);
}



// semi-private API
// this is used by typeconf update the config
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
