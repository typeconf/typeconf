# dashboards

This package demonstrates how you can use typeconf for generating dashboards.
You can define your widgets in the schema and the feed the resulting JSON
into the dashboard service. It's quite possible to define the Grafana format
and just upload the resulting JSON straight to it.

## Index

- [Schema](src/main.tsp)
- [Values](src/values.config.ts)

## Command reference

After updating schema or values run this command on a package directory:

```
$ typeconf compile dashboards
```

Or you can run compile in background:

```
$ typeconf compile --watch dashboards
```

For more info please refer to the [docs](https://docs.typeconf.dev).
