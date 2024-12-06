# country-based-conf

This package defines configuration based on country. From your service you
can provide a name of the country resolved by user and based on that use the
config for it.

## Index

- [Schema](src/main.tsp)
- [Values](src/values.config.ts)

## Command reference

After updating schema or values run this command on a package directory:

```
$ typeconf compile country-based-conf
```

Or you can run compile in background:

```
$ typeconf compile --watch country-based-conf
```

For more info please refer to the [docs](https://docs.typeconf.dev).
