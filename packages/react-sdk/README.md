# Typeconf

Typeconf is a library and CLI that adds types to your configs. You can
create configuration packages and use them in your code to read JSONs with
type validation.

## Usage

### In existing project

Create a directory for your future configs and put `main.tsp` and `<your-config-name>.config.ts` files there:

```
your-project/
├── configs/
│   ├── main.tsp
│   └── my-config.config.ts
├── src/
└── next.config.js
```

### Define your config schema

```
model NotificationConfig {
  email: boolean;
  push: boolean;
}

model UserSettings {
  theme: string;
  notifications: Record<NotificationConfig>;
}
```

### Define values

```
import { UserSettings } from './types/all.js';

const config: UserSettings = {
  theme: 'light',
  notifications: {
    "promo": {
      email: true,
      push: false,
    },
    "alerts": {
      email: true,
      push: true,
    },
  }
};
export default config;
```

### Generate config and types

```
npx @typeconf/typeconf build configs
```

### Use in React project

First install the Typeconf React SDK:

```
npm install @typeconf/react-sdk
```

And then you can read config in your components:

```
import { readConfig } from "@typeconf/react-sdk/server";
import { ButtonSettings } from "@/configs/types/all";

export default async function Component() {
  // use name of your config without extension
  const config: ButtonSettings = await readConfig("configs/my-config");
}
```

For more info check our docs: https://typeconf.dev/docs
