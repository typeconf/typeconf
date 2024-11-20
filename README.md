# Typeconf

<div align="center">
    <img src="docs/assets/logo-background.png" alt="logo" width="30%"  style="border-radius: 50%; padding-bottom: 20px"/>
</div>

A Typescript tool that adds types to configs.

[Discord](https://discord.gg/F5d4TjsS8B)

## Installation

```
npm install -g typeconf
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
typeconf generate --watch <configs-dir>
```
for convenience.

Now you can edit main.tsp, add your types and then use values.config.ts to fill the config.

You can always regenerate files with this config:
```
typeconf generate <configs-dir>
```

### Read configs in your code

To start using your config you can just add it to your project, either by specifying path to the configs in the same repository or using GitHub url:
```
typeconf add config <config-path>
```

After any update in the config, or to fetch in again you can run the command to regenerate it:
```
typeconf generate
```

## Contributing

Contributions are always welcome! There's a lot of stuff to implement right now, feel free to take a look at issues.
