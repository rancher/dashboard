# Extensions configuration

Follow instructions [here](./extensions-getting-started.md) to scaffold your extension. This will assist you in the creation of an extension as a top-level product inside Rancher Dashboard.

Once you've done so, there are some initialization steps specific to extensions. Beyond that, extensions largely work the same as the rest of the dashboard. There are a set of top-level folders that can be defined and used as they are in the dashboard: `chart`, `cloud-credential`, `content`, `detail`, `edit`, `list`, `machine-config`, `models`, `promptRemove`, `l10n`, `windowComponents`, `dialog`, and `formatters`. You can read about what each of these folders does [here](../code-base-works/directory-structure.md).

## Extension Package Metadata

Each extension package has the ability to customize certain aspects when it comes to compatibility with Rancher Manager/Kubernetes or displaying extension names. These are determined by the `rancher.annotations` object applied to the `package.json` of an extension package.

These annotations allow you to specify compatibility with Kubernetes, Rancher Manager, the Extensions API, and the Rancher UI version by relying on [semver ranges](https://www.npmjs.com/package/semver/v/6.3.0#ranges). As well as version compatibility, you can also specify a Display Name for the Extension package as it appears on the "Extensions" page within the UI.

### Configurable Annotations

| Annotation | Value | Description |
| ------ | :------: | --------------|
| `catalog.cattle.io/kube-version` | `Range` | Determines if the Kubernetes version that Rancher Manager is utilizing is compatible with the Extension package. |
| `catalog.cattle.io/rancher-version` | `Range` | Determines the compatibility of the installed Rancher Manager version with the Extension package. |
| `catalog.cattle.io/ui-extensions-version` | `Range` | Determines the Extensions API version that is compatible with the Extension package. |
| `catalog.cattle.io/ui-version` | `Range` | Determines the Rancher UI version that is compatible with the Extension package. |
| `catalog.cattle.io/display-name` | `String` | Specifies the Display Name for an Extension package's card on the "Extensions" page. |

### Example Configuration

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
      "catalog.cattle.io/ui-version": ">= 2.7.7-0 < 2.9.0-0",
      "catalog.cattle.io/display-name": "My Super Great Extension"
    }
  },
  ...
}
```

