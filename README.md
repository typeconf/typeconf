# Typeconf

<div align="center">
    <img src="docs/assets/logo-background.png" alt="logo" width="30%"  style="border-radius: 50%; padding-bottom: 20px"/>
</div>

A Typescript tool that adds types to configs.

[Docs](https://docs.typeconf.dev) [Discord](https://discord.gg/F5d4TjsS8B)

## Installation

```
npm install -g @typeconf/typeconf
```

## Setup

### Configuration repository

First you need to create a repository for all your configs:

```
typeconf init <configs-dir>
```

With this command we'll generate the boilerplate for you. Before editing files you
can run:

```
typeconf compile --watch <configs-dir>
```
for convenience.

Now you can edit main.tsp, add your types and then use values.config.ts to fill the config.

You can always regenerate files with this config:
```
typeconf compile <configs-dir>
```

### Read configs in your code

To start using your config first you need to configure the typeconf :).

Currently we only support Typescript, but later we'll add other languages.

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
