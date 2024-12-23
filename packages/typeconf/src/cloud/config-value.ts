export async function getConfigValue(configName: string, projectId: string): Promise<string> {
    // // TODO: for remote configs npm pack --pack-destination and copy
    // const jiti = createJiti(import.meta.url);
    // const filepath = path.join(process.cwd(), "typeconf.config.ts");
    // const conf = (await jiti.import(filepath, {
    //   default: true,
    // })) as Config;
  
    // const baseDir = process.cwd();
    // fs.mkdirSync(path.join(baseDir, "typeconf-gen"), { recursive: true });
    // for (const confDir of conf.configs) {
    //   updateConfigFromDirectory(baseDir, confDir);
    // }

    return "{test}"
}

export async function updateConfigValue(configName: string, projectId: string, newValue: string): Promise<void> {
    // // TODO: for remote configs npm pack --pack-destination and copy
    // const jiti = createJiti(import.meta.url);
    // const filepath = path.join(process.cwd(), "typeconf.config.ts");
    // const conf = (await jiti.import(filepath, {
    //   default: true,
    // })) as Config;
  
    // const baseDir = process.cwd();
    // fs.mkdirSync(path.join(baseDir, "typeconf-gen"), { recursive: true });
    // for (const confDir of conf.configs) {
    //   updateConfigFromDirectory(baseDir, confDir);
    // }
}
