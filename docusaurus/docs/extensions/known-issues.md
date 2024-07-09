# Known issues

- Running `yarn create @rancher/app app-name` + `yarn create @rancher/pkg your-extension-name` might generate a situation where trying to install dependencies will hit a problem with the `glob` package not being the appropriate version for the recommended node version (tries to install `glob` version only compatible with node v18).   
If that is the case, the fix is to add to your app's `package.json` the following resolution:

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
