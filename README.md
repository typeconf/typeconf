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

[![YouTube](http://i.ytimg.com/vi/y2V4aaTb4c0/hqdefault.jpg)](https://www.youtube.com/watch?v=y2V4aaTb4c0)

## Getting started

### Typespec schema

In Typeconf, configurations are defined using schemas and values separately. The
schema is written using a TypeSpec-based language, which is a TypeScript-like
syntax. Learn more about TypeSpec [here](https://typespec.io/). Here's an example of such schema:

```typescript
model FeedParams {
  fetchLimit: int32;
  rankScore: float32;
}

model AppParams {
  feedParamsByPostType: Record<FeedParams>;
}
```

### Typescript configuration files

To set the values of the configuration file you can create a TypeScript file with the name `<config-name>.config.ts` inside your configuration
directory and this file will be compiled to JSON after build. You can create multiple files, this is useful for separating environments or
different parts of the application.

Continuing our example, here are the values for the model defined above:

```typescript
import { AppParams } from "./types/all.js";

const config: AppParams = {
  "promo-campaign": {
    fetchLimit: 3,
    rankScore: 2.0,
  },
  creators: {
    fetchLimit: 10,
    rankScore: 1.5,
  },
};

export default config;
```

### Generated JSON files

After changing the config.ts file you can run `npx @typeconf/typeconf build
configs` to produce JSON file which you can read in your app, either with
Typeconf SDK with type validation or just as a plain JSON.

Here's the JSON from our example:

```json
{
  "promo-campaign": {
    "fetchLimit": 3,
    "rankScore": 2
  },
  "creators": {
    "fetchLimit": 10,
    "rankScore": 1.5
  }
}
```

### Project structure

#### In project

The most straighforward way to use Typeconf is to create a separate directory in your project and put configs there:

```
your-project/
├── configs/
│   ├── main.tsp
│   └── my-config.config.ts
├── src/
└── next.config.js
```

#### Standalone

If you want to share configuration between multiple projects or inherit types you can create a separate package with this helper CLI:

```bash
npx create-typeconf-package
```

This will generate all the necessary boilerplate and you will be able to update configs with `npm run build`.

### CLI

If you're not using a separate package you need to use Typeconf CLI to update the configs:

```
npx @typeconf/typeconf build configs
# Tip: you can add --watch to track changes in background!
```

### Using the config in your code

To use your configuration in your code, you can install the configuration
package you just created as a dependency. Paired with the package you need to install Typeconf SDK:

```
# Node.JS
$ npm install @typeconf/sdk

# React/Next
$ npm install @typeconf/react-sdk
```

Once everything is installed, you can read the configuration from any JSON file like this:

```typescript
import { ProductConfig } from "you-config-package";
import { readConfig } from "@typeconf/sdk";
// or in React: import { readConfig } from "@typeconf/react-sdk/server";

// pass path to config values file without extension
let conf: ProductConfig = readConfig("path/to/config-dir/my-config");
```

## FAQ

**How to update changes locally if I use a separate package for configs?**

Use `npx link@latest <path/to/package>` to add a symlink to local version of the package.

**Where can I see more examples**

Check out the examples in the [repository](https://github.com/typeconf/typeconf/tree/main/examples).
Or check out [playground](/playground), you can try out the examples without installing it locally.

## Contributing

Contributions are always welcome! There's a lot of stuff to implement right now, feel free to take a look at issues.
