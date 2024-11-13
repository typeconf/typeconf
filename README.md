# LangConfig

<div align="center">
    <img src="docs/assets/logo-background.png" alt="logo" width="30%"  style="border-radius: 50%; padding-bottom: 20px"/>
</div>

A Typescript tool that adds types to configs.

[Discord](https://discord.gg/Z7VPSCCn4g)

## Installation

```
npm install -g langconfig
```

## Setup

### Configuration repository

First you need to create a repository for all your configs:

```
langconfig init-configs <configs-dir>
```

Then you can add your config:
```
langconfig new config <config-name>
```

Now you can write your schema and generate types:
```
langconfig generate <configs-dir>
```

And after setting the configs values you can generate the JSON file like that:
```
langconfig generate <configs-dir>
```

### Read configs in your code

To start using your config you can just add it to your project, either by specifying path to the configs in the same repository or using GitHub url:
```
langconfig add config <config-path>
```

After any update in the config, or to fetch in again you can run the command to regenerate it:
```
langconfig generate
```

## Contributing

Contributions are always welcome! There's a lot of stuff to implement right now, feel free to take a look at issues.
