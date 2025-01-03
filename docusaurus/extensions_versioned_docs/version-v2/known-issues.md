# Known issues

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
