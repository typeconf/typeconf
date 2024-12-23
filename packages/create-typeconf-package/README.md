# Typeconf

Typeconf is a library and CLI that adds types to your configs. You can create
configuration packages and use them in your code to read JSONs with type validation.

## Usage

Create configuration package:
```
npx create-typeconf-package@latest <config-dir>
```

Run the compilation in the background for convenience:
```
npm run build:watch
```

Try to edit `src/main.tsp` and `src/values.config.ts` for generating your JSON configs.

For the full guide please check our [https://docs.typeconf.dev](docs).
