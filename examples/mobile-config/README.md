# mobile-config

An example of config read on mobile. Some params varied by platform and OS version.

## Index

- [Schema](src/main.tsp)
- [Values](src/values.config.ts)

## Command reference

After updating schema or values run this command on a package directory:

```
$ typeconf compile mobile-config
```

Or you can run compile in background:

```
$ typeconf compile --watch mobile-config
```

For more info please refer to the [docs](https://docs.typeconf.dev).
