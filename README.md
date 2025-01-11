# Typeconf

<div align="center">
    <img src="docs/assets/logo-background.png" alt="logo" width="30%"  style="border-radius: 50%; padding-bottom: 20px"/>

A Typescript tool that adds types to configs.

[Website](https://typeconf.dev) | [Docs](https://docs.typeconf.dev) | [Discord](https://discord.gg/F5d4TjsS8B)

<table>
<tr>
<th align="left">Define schema</th>
<th align="left">Set values</th>
</tr>
<tr>
<td align="left">

```typescript
model ProductConfig {
  enable_flag: boolean;
  coeffs: Record<float32>;
  notify: Record<boolean>;
}
```

</td>
<td align="left">

```typescript
import {
  ProductConfig,
} from "~/types/all.js";

let config: ProductConfig = {
    enable_flag: true,
    coeffs: {
        "lon": 0.99,
        "nyc": 1.25,
        "sf": 9000.0,
    },
    notify: {
        "ios>=17": true,
        "android<=15": false,
    },
};

export default config;
```

</td>
</tr>
<tr>
<th align="left">Read in your code</th>
<th align="left">Or use JSON</th>
</tr>
<tr>
<td align="left">

```typescript
import {
  ProductConfig,
  readConfigFromFile,
} from "you-config-package";

let conf: ProductConfig =
  readConfigFromFile(
    "path/to/config.json"
);
```

</td>
<td align="left">

```json
{
    "enable_flag": true,
    "coeffs": {
        "lon": 0.99,
        "nyc": 1.25,
        "sf": 9000.0
    },
    "notify": {
        "ios>=17": true,
        "android<=15": false
    }
}
```

</td>
</tr>
</table>

</div>

Every developer deals with configs every day. We have a lot of different
formats and storages, and it's quite messy. In a growing product developers
sometimes have to deal with large configs, usually JSONs or YAMLs, which are
managed differently for each environment or experiment. Doing this is not fun,
and it's hard to avoid errors.

This is where Typeconf helps - it you to define and share complex configs using
types. With typeconf you manage a config directory - a package with config
schemas and values that should become your source of truth for all service
configuration. Using typeconf SDK you can read the generated JSONs in your code
with types.

Check out our [examples](examples/README.md) for real world use cases.

## Demo

https://github.com/user-attachments/assets/2a50ae36-76cd-4b51-b0e3-744997895717

## Getting started

```
npx create-typeconf-package
```

This command will create you a configuration package managed by typeconf.

Before editing files in the package make sure to install dependencies:
```
$ npm install
```

and run configs compilation in background in a separate terminal:
```
$ npm run build:watch
```

Now you can edit main.tsp, add your types and then use values.config.ts to fill the config.

Example `main.tsp`:

```typescript
model ProductConfig {
    enable_feature1: boolean;
    rollout_ab: Record<boolean>;
}
```

Example `values.config.ts`:

```typescript
import { ProductConfig } from '~/types/all.js'

let config: ProductConfig = {
    enable_feature1: true,
    rollout_ab: {
        "london": true,
        "sf": false,
    },
};
```

You can always manually regenerate files with this config:
```
npm build <configs-dir>
```

The command above will always regenerate types for your configs and generate
output JSON file containing the config values.

### Read configs in your code

Typeconf also allows reading configs with typing. Currently we only support
Typescript, but later we'll add other languages.

To start using your config you can just install your configuration package that
you just created simply as a dependency!

After that you'll be able to read it from any JSON file you provide:

```typescript
import { ProductConfig, readConfigFromFile } from "you-config-package";

let conf: ProductConfig = readConfigFromFile("path/to/config.json");
```

Pro tip: If you want to use the configs package before pushing it there is a handly tool, run it in your project:

```
npx link@latest <path/to/package>
```

## Contributing

Contributions are always welcome! There's a lot of stuff to implement right now, feel free to take a look at issues.
