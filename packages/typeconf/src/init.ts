import * as path from "path";
import fs from "fs";

import prompts from "prompts";

type Template = {
  canBeOverwritten: boolean;
  value: string;
};

type PackageJsonParams = {
  projectName: string;
};

type ValuesParams = {
  projectName: string;
};

type ReadmeParams = {
  projectName: string;
};

const DIRS = ["types", "src"];

const TEMPLATES = new Map<string, any>([
  [
    "package.json",
    (params: PackageJsonParams): Template => {
      return {
        canBeOverwritten: false,
        value: `{
  "name": "${params.projectName}",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/src/index.js",
  "keywords": [
      "typeconf",
      "${params.projectName}"
  ],
  "exports": {
    ".": {
      "types": "./dist/src/index.d.ts",
      "default": "./dist/src/index.js"
    }
  },
  "dependencies": {
    "@typeconf/typeconf": "^0.2.0",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "resolve-tspaths": "*"
  },
  "scripts": {
    "build": "typeconf build .",
    "build:watch": "typeconf build . --watch"
  }
}`,
      };
    },
  ],
  [
    ".gitignore",
    (): Template => {
      return {
        canBeOverwritten: false,
        value: `out/
dist/
node_modules/
`,
      };
    },
  ],
  [
    "README.md",
    (params: ReadmeParams): Template => {
      return {
        canBeOverwritten: false,
        value: `# ${params.projectName}

This is a configuration package created by typeconf.
You can replace this text with your own description here.

## Index

- [Schema](src/main.tsp)
- [Values](src/values.config.ts)

## Creating new package

This package was created by running:

\`\`\`
$ npx create-typeconf-package ${params.projectName}
\`\`\`

## Working with package

Make sure to install dependencies:

\`\`\`
npm install
\`\`\`

Before editing files it is recommended to start compilation in background:

\`\`\`
$ npm run build:watch
\`\`\`

Or you can manually run this command after you update schema or values:

\`\`\`
$ npm run build
\`\`\`

## Publishing the configs package

You can publish this package in the same way as other NPM packages using [\`npm publish\`](https://docs.npmjs.com/cli/v8/commands/npm-publish).

For more info please refer to the [docs](https://docs.typeconf.dev).
`,
      };
    },
  ],
  [
    "src/index.ts",
    (): Template => {
      return {
        canBeOverwritten: false,
        value: `// This is for Typeconf interface and types, please keep it!
export * from '~/types/index.js'`,
      };
    },
  ],
  [
    "tsconfig.json",
    (): Template => {
      return {
        canBeOverwritten: false,
        value: `{
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "target": "es2022",
    "module": "NodeNext",
    "sourceMap": true,
    "declaration": true,
    "esModuleInterop": true,
    "moduleResolution": "NodeNext",
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "paths": {
        "~/*": ["./*"]
    }

  },
  "exclude": ["out", "dist"],
  "include": ["**/*.ts"]
}`,
      };
    },
  ],
  [
    "src/main.tsp",
    (): Template => {
      return {
        canBeOverwritten: false,
        value: `model ProjectConfig {
  projectName: string;
}`,
      };
    },
  ],
  [
    "src/values.config.ts",
    (params: ValuesParams): Template => {
      return {
        canBeOverwritten: false,
        value: `import { ProjectConfig } from "../types/all.js";
let config: ProjectConfig = {
    projectName: "${params.projectName}",
};
export default config;`,
      };
    },
  ],
  [
    "types/all.ts",
    (): Template => {
      return {
        canBeOverwritten: false,
        value: `export type ProjectConfig = {
  projectName: string;
};`,
      };
    },
  ],
]);

export async function generateTemplates(
  projectName: string,
  projectPath: string,
  overwrite: boolean,
) {
  for (const [filename, templateFunc] of TEMPLATES) {
    const template = templateFunc({ projectName: projectName });
    const filepath = path.join(projectPath, filename);
    if (fs.existsSync(filepath) && !template.canBeOverwritten && !overwrite) {
      continue;
    }
    fs.writeFileSync(filepath, template.value);
    console.log(`Generated '${filepath}'`);
  }
}

export async function initPackageNonInteractive(packagePath: string, packageName: string) {
  if (packagePath == "" || packageName == "") {
    throw new Error("packagePath and packageName are required");
  }
  fs.mkdirSync(packagePath, { recursive: true });
  for (const dirname of DIRS) {
    const filepath = path.join(packagePath, dirname);
    fs.mkdirSync(filepath, { recursive: true });
  }

  await generateTemplates(packageName, packagePath, true);
  console.log(
    "Done! Now you can edit main.tsp and set your configuration schema.",
  );
}

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

  await generateTemplates(response.projectName, projectPath, true);
  console.log(
    "Done! Now you can edit main.tsp and set your configuration schema.",
  );
}
