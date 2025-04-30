# Typeconf

<div align="center">
    <img src="docs/assets/logo-background.png" alt="logo" width="30%"  style="border-radius: 50%; padding-bottom: 20px"/>

Typescript dynamic configs with static types.

[Website](https://typeconf.dev) | [Docs](https://docs.typeconf.dev) | [Discord](https://discord.gg/F5d4TjsS8B)

<table>
<tr>
<th align="left">Define values</th>
<th align="left">Read in your code</th>
</tr>
<tr>
<td align="left">

```typescript
model ProductConfig {
  enable_flag: boolean;
  coeffs: Record<float32>;
  notify: Record<boolean>;
}

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
<td align="left">

```typescript
import {
  ProductConfig,
  readConfigFromFile,
} from "you-config-package";

let conf: ProductConfig =
  readConfig(
    "path/to/config"
);
```

</td>
</tr>
</table>

</div>

Every developer deals with two problems every day - messy configs and long, scary deployment.
Typeconf helps with both - it allows you to write configs as code and update them without full app redeployment.
Imagine making small changes like feature flags, prompt updates, marketing texts with a press of a button? With Typeconf you can!

Check out our [examples](examples/README.md) for real world use cases. And [sign up](https://typeconf.dev/storage/login) for our Dynamic Configs Storage, it's a free, open-source database for these configs!

## Demo

[![YouTube](https://i3.ytimg.com/vi/qOh70qOGwLM/maxresdefault.jpg)](https://www.youtube.com/watch?v=qOh70qOGwLM)

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
