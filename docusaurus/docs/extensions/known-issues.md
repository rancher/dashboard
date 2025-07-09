# Known issues

## For Shell v1 and v2

- Running `yarn install` might throw the following error:
```
error glob@10.4.3: The engine "node" is incompatible with this module
```

To resolve this add the following `resolution` to the root application's `package.json`:
```
{
  "name": "app-name",
  "version": "0.1.0",
  ...
  resolutions": {
    "glob": "7.2.3"
  },
  ...
}
```

- Running `yarn install` might throw the following errors:
```
error @aws-sdk/types@3.723.0: The engine "node" is incompatible with this module. Expected version ">=18.0.0". Got "16.20.2"
error @aws-sdk/util-locate-window@3.723.0: The engine "node" is incompatible with this module. Expected version ">=18.0.0". Got "16.20.2"
```

To resolve this add the following `resolutions` to the root application's `package.json`:
```
{
  "name": "app-name",
  "version": "0.1.0",
  ...
  resolutions": {
    "@aws-sdk/types": "3.714.0",
    "@aws-sdk/util-locate-window": "3.693.0"
  },
  ...
}
```
