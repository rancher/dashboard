# Rancher 2.9.0 update

## What happened

Rancher 2.9.0 contains many improvements, unfortunately some make necessary changes that invalidate certain versions of Rancher Extensions working with certain versions of Rancher.  
To support these changes we have made some important changes to Rancher Shell (our core JS package) which helps and protects version compatibility.


## What changed in Shell

Before Rancher 2.9.0 was released, the latest stable Shell version was `0.5.3`. From 2.9.0 we have updated the Shell versioning system in the following way:

![Shell versioning 2.9.0](./screenshots/shell-update-2.9-diagram.png)

Effectively, we've had to split Shell into two different versions:

- `1.2.3` - which is compliant with any **pre-2.9.0** Rancher system (effectively should be the same as using `0.5.3`).

- `2.0.1` - which is compliant and **needed** for a **2.9.0** Rancher system


For future releases of your extension to **work on Rancher 2.9.0** you will need to build and release a new version of your extension using Shell `2.0.1`.

> If your extension is using Shell `0.5.3` and you **don't need** to be compliant with Rancher 2.9.0, there's no update to do.

These changes bring Shell versions in line with standard versioning patterns. Only major version updates are expected to contain breaking changes, minor and patch versions should not.

## How to update your extension for Rancher 2.9.0

- In the root of your extension repository, update `package.json` `@rancher/shell` to the new `2.1.0` version and `yarn install` to fetch it. Then do a local build of your extensions and `Developer Load` them on the desired Rancher version to confirm everything works as expected. Check documentation about a Developer Load [here](./extensions-getting-started#test-built-extension-by-doing-a-developer-load).

- Before publishing it, add annotation(s) to your extension `pkg/<-YOUR EXTENSION->/package.json` like:

```json
{
  "name": "your-extension",
  "description": "your-extension description",
  "version": "1.2.1",
  "rancher": {
    "annotations": {
      "catalog.cattle.io/rancher-version": ">= 2.9.0",
      "catalog.cattle.io/ui-extensions-version": ">= 2.0.1"
    }
  },
  ....
}
```

> With these annotations your extension will be restricted to Rancher version greater or equal to `2.9.0` and will also be restricted to a UI Extensions version (Shell version) greater or equal to `2.0.1`.  
These are not mandatory but highly recommended to ensure your extension versions reference Rancher / Shell versions they're compatible with.  
For more information about the annotation we allow for, check the documentation [here](./extensions-configuration#configurable-annotations).

- After the above steps, just publish a new version of the extension. That published version should now be compliant with Rancher 2.9.0.


To find out more about the support matrix for Shell versions in regards to Rancher versions, check the support matrix [here](./support-matrix#shell-support-matrix).
