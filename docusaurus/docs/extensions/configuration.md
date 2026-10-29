# Configuration

## Package Metadata

Each extension package has the ability to customize certain aspects when it comes to compatibility with Rancher Manager/Kubernetes or displaying extension names. These are determined by the `rancher.annotations` object applied to the `package.json` of an extension package.

These annotations allow you to specify compatibility with Kubernetes, Rancher Manager, the Extensions API, and the Rancher UI version by relying on [semver ranges](https://www.npmjs.com/package/semver/v/6.3.0#ranges). As well as version compatibility, you can also specify a Display Name for the Extension package as it appears on the "Extensions" page within the UI.

### Annotations
| Annotation | Value | Rancher Version support (Minimum version) | Description |
| ------ | :------: | :------: | -------------- |
| `catalog.cattle.io/kube-version` | `Range` | v2.7.0 | Semver range of Kubernetes versions the extension supports. Prevents loading on clusters running a version outside the range. |
| `catalog.cattle.io/rancher-version` | `Range` | v2.7.0 | Semver range of Rancher Manager versions the extension supports. Prevents loading on a Rancher version outside the range. |
| `catalog.cattle.io/ui-extensions-host` | `String` | v2.7.0 | Host application the extension targets (e.g. `rancher-manager`). Prevents loading when the host doesn't match. |
| `catalog.cattle.io/ui-extensions-version` | `Range` | v2.9.0 | Semver range of the Extensions API (Shell package) the extension is built against for compatibility purposes. Some Rancher versions might bump it to a fixed major due to architectural changes: 2.8 → v1, 2.9 → v2, 2.10 → v3. Pin to the major you built against (e.g. `>= 3.0.0 < 4.0.0`). **Mandatory from Rancher 2.10 onwards — extensions without this annotation will not be loaded.** |
| `catalog.cattle.io/display-name` | `String` | v2.7.0 | Friendly name shown on the extension's card on the Extensions page. Falls back to the package name when omitted. |

### Other properties
| Property | Value | Description |
| ------ | :------: | --------------|
| `noAuth` | `Boolean` | If `noAuth` is set to `true` then the extension will be loaded even when the user is logged out |

### Example

Here's an example configuration of an extensions `package.json`:

___`./pkg/my-package/package.json`___
```json
{
  "name": "my-package",
  "description": "my-package plugin description",
  "version": "0.1.0",
  "rancher": {
    "annotations": {
      "catalog.cattle.io/kube-version": ">= v1.28.0-0 < v1.32.0-0",
      "catalog.cattle.io/rancher-version": ">= 2.10.0-0",
      "catalog.cattle.io/ui-extensions-version": ">= 3.0.0 < 4.0.0",
      "catalog.cattle.io/display-name": "My Super Great Extension"
    },
    "noAuth": true
  },
  ...
}
```


## Build Configuration

Extensions are built with [Vite](https://vite.dev/).

The development app is configured by `vite.config.mjs` in its root folder. `excludes` lists the packages in `pkg` that `yarn dev` does not build into the app:

___`./vite.config.mjs`___
```js
import config from '@rancher/shell/vite.config.mjs';

export default config(import.meta.dirname, {
  excludes: [],
});
```

A package is built with the shell's package configuration unless the package has a `vite.config.mjs` of its own. To change how a package is built, for example to add an import alias, add a `vite.config.mjs` to the package that changes the shell's configuration:

___`./pkg/my-package/vite.config.mjs`___
```js
import config from './.shell/pkg/vite.config.mjs';

export default () => {
  const viteConfig = config();

  viteConfig.resolve.alias.unshift({ find: '@my-package', replacement: import.meta.dirname });

  return viteConfig;
};
```

`vue.config.js` files are no longer used. A package that still has a customized `vue.config.js` and no `vite.config.mjs` fails to build, so move its configuration to `vite.config.mjs`.
