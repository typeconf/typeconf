# experiments

This example shows how you can define feature flags, and experimental parameters.

## Index

- [Schema](src/main.tsp)
- [Values](src/values.config.ts)

## Creating new package

This package was created by running:

```
$ npx create-typeconf-package experiments
```

## Working with package

Make sure to install dependencies:

```
npm install
```

Before editing files it is recommended to start compilation in background:

```
$ npm run build:watch
```

Or you can manually run this command after you update schema or values:

```
$ npm run build
```

## Publishing the configs package

You can publish this package in the same way as other NPM packages using [\`npm publish\`](https://docs.npmjs.com/cli/v8/commands/npm-publish).

For more info please refer to the [docs](https://docs.typeconf.dev).
