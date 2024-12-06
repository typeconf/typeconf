# Typeconf

<div align="center">
    <img src="docs/assets/logo-background.png" alt="logo" width="30%"  style="border-radius: 50%; padding-bottom: 20px"/>
</div>

A Typescript tool that adds types to configs.

[Website](https://typeconf.dev) | [Docs](https://docs.typeconf.dev) | [Discord](https://discord.gg/F5d4TjsS8B)

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

## Installation

```
npm install -g @typeconf/typeconf
```

## Setup

### Configuration directory

To start managing configs with types first you need to create a directory for all your configs:

```
typeconf init <configs-dir>
```

With this command we'll generate the boilerplate for you.
Before editing files run in a separate terminal window:

```
typeconf compile --watch <configs-dir>
```
This will run typeconf in background for automatic recompilation.

Now you can edit main.tsp, add your types and then use values.config.ts to fill the config.

Example `main.tsp`:

```
model ProductConfig {
    enable_feature1: boolean;
    rollout_ab: Record<boolean>;
}
```

Example `values.config.ts`:

```
import { ProductConfig } from '@root/types/all.js'

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
typeconf compile <configs-dir>
```

The command above will always regenerate types for your configs and generate
output JSON file containing the config values.

### Read configs in your code

Typeconf also allows reading configs with typing. Currently we only support
Typescript, but later we'll add other languages.

To start using your config first you need to configure the typeconf :).

Install SDK package to your project:
```
npm install --save @typeconf/sdk
```

Create a file called `typeconf.config.ts` and add your config directory:
```
import * as typeconf from '@typeconf/sdk'

const config: typeconf.Config = {
    configs: [
        "./configs",
    ],
};

export default config;
```

To fetch the config or update it after any schema changes you should run this command:
```
typeconf update
```

## Contributing

Contributions are always welcome! There's a lot of stuff to implement right now, feel free to take a look at issues.
