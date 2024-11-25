import * as path from "path";
import fs from "fs";

import prompts from "prompts";

type PackageJsonParams = {
  projectName: string;
};

type ValuesParams = {
  projectName: string;
};

const DIRS = ["types", "src"];

const TEMPLATES = new Map<string, any>([
  [
    "package.json",
    (params: PackageJsonParams) => {
      return `{
  "name": "${params.projectName}",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "npm run build && node dist/index.js"
  }
}`;
    },
  ],
  [
    "index.ts",
    () => {
      return `// generated by typeconf, do not edit
import fs from 'fs'
import * as values from './src/values.config.js'
// todo multiple configs

if (values != null && 'default' in values) {
    const data = JSON.stringify(values.default);
    const target_path = process.argv[2];
    if (target_path != null) {
        fs.writeFileSync(target_path, data, { flag: 'w' });
    } else {
        console.log(data);
    }
}`;
    },
  ],
  [
    "tsconfig.json",
    () => {
      return `{
  "compilerOptions": {
    "outDir": "dist",
    "strict": true,
    "target": "es2022",
    "module": "NodeNext",
    "sourceMap": true,
    "esModuleInterop": true,
    "moduleResolution": "NodeNext",
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "paths": {
        "@root/*": ["./*"]
    }
  },
  "include": [
      "**/*.ts"
  ]
}`;
    },
  ],
  [
    "src/main.tsp",
    () => {
      return `model ProjectConfig {
  projectName: string;
}`;
    },
  ],
  [
    "src/values.config.ts",
    (params: ValuesParams) => {
      return `import { ProjectConfig } from "@root/types/all.js";
let config: ProjectConfig = {
    projectName: "${params.projectName}",
};
export default config;`;
    },
  ],
  [
    "types/all.ts",
    () => {
      return `export type ProjectConfig = {
  projectName: string;
};`;
    },
  ],
]);

export default async function initProject(projectPath: string) {
  const dirName = path.basename(projectPath);
  if (fs.existsSync(projectPath)) {
    const files = fs.readdirSync(projectPath);
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

  const response = await prompts({
    type: "text",
    name: "projectName",
    message: "Configuration package name",
    initial: dirName,
  });
  if (!response.projectName) {
    return;
  }
  fs.mkdirSync(projectPath, { recursive: true });
  for (const dirname of DIRS) {
    const filepath = path.join(projectPath, dirname);
    fs.mkdirSync(filepath, { recursive: true });
  }

  for (const [filename, templateFunc] of TEMPLATES) {
    const template = templateFunc({ projectName: response.projectName });
    const filepath = path.join(projectPath, filename);
    fs.writeFileSync(filepath, template);
    console.log(`Created '${filepath}'`);
  }
  console.log(
    "Done! Now you can edit main.tsp and set your configuration schema.",
  );
}
