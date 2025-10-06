# Update Global Configuration

Before making use of server-side pagination in lists or select components, or making requests specifically for resources using the api, the global configuration must be setup to allow requests for the associated Kubernetes resource type.

This ensures that resources without the required header or component configuration or aren't quite ready yet do not exercise the feature cannot do so.

There's already of a lot of resources that are ready, however some are not or aren't known to the Rancher UI. For example a product provides a Custom Resource and an extension already has some list configuration for it, but nothing for server-side pagination).

To resolves this use the plugin `enableServerSidePagination` method to provide a set of scenarios where the resource can be supported by server-side pagination. 

```
 plugin.enableServerSidePagination?({
    cluster: {
      resources: {
        enableSome: {
          enabled: ['rbac.authorization.k8s.io.clusterrolebinding'],
        }
      }
    }
  })
```

> Notice that this uses optional chaining `?` on enableServerSidePagination. This avoids errors when running the extension in older versions of rancher where rancher does not expose `plugin.enableServerSidePagination`. For that scenario the resource would continue to be unsupported by server-side pagination.

In the above code the extension is stating that the `rbac.authorization.k8s.io.clusterrolebinding` resource can be listed, sorted and searched using server-side pagination.

> This is the first step, please see subsequent pages for details on list and select component configuration.

*Examples*
- rancher/ui-plugin-examples `pkg/extension-crd/index.ts`
  - Extension contains a list of `catalog.cattle.io.uiplugin` that need to support sever-side pagination. This is done so via `plugin.enableServerSidePagination`
  - Also worth noting that the server-side pagination compatible headers are provided in product configuration - `pkg/extension-crd/product.js`. For more information on this step please see [Update Lists](./lists.md).

### Checklist
1. Extension contains custom list header configuration or list components for a specific resource type, so `enableServerSidePagination` has been used to ensure the resource type can start using server-side pagination
1. The checklists on following pages have been completed, which provide the component specific configuration for the resource type.