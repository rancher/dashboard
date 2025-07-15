# Configuration

## Package Metadata

Each extension package has the ability to customize certain aspects when it comes to compatibility with Rancher Manager/Kubernetes or displaying extension names. These are determined by the `rancher.annotations` object applied to the `package.json` of an extension package.

These annotations allow you to specify compatibility with Kubernetes, Rancher Manager, the Extensions API, and the Rancher UI version by relying on [semver ranges](https://www.npmjs.com/package/semver/v/6.3.0#ranges). As well as version compatibility, you can also specify a Display Name for the Extension package as it appears on the "Extensions" page within the UI.

### Annotations
| Annotation | Value | Description |
| ------ | :------: | --------------|
| `catalog.cattle.io/kube-version` | `Range` | Determines if the Kubernetes version that Rancher Manager is utilizing is compatible with the Extension package. |
| `catalog.cattle.io/rancher-version` | `Range` | Determines the compatibility of the installed Rancher Manager version with the Extension package. |
| `catalog.cattle.io/ui-extensions-version` | `Range` | Determines the Extensions API version that is compatible with the Extension package. |
| `catalog.cattle.io/display-name` | `String` | Specifies the Display Name for an Extension package's card on the "Extensions" page. |

### Other properties
| Property | Value | Description |
| ------ | :------: | --------------|
| `noAuth` | `Boolean` | If `noAuth` is set to `true` then the extension will be loaded even when the user is logged out. (Rancher 2.9 - Extensions API 2.0) |

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
      "catalog.cattle.io/kube-version": ">= v1.26.0-0 < v1.29.0-0",
      "catalog.cattle.io/rancher-version": ">= 2.7.7-0 < 2.9.0-0",
      "catalog.cattle.io/ui-extensions-version": ">= 1.1.0",
      "catalog.cattle.io/display-name": "My Super Great Extension"
    },
    "noAuth": true
  },
  ...
}
```

