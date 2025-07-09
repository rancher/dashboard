# Common Types - LocationConfig

## Where

The `where` defines which area of the UI the extension method will apply to and they depend on which method they are applied to. This means that each method will only accept a given subset of the the following list (documented per each method).

The admissable string values for the `where` are:

| Key | Type | Description |
|---|---|---|
|`ActionLocation.HEADER`| String | Location for an action on the Header of Rancher Dashboard. Check [screenshot](./actions/#actionlocationheader-options) for location. |
|`ActionLocation.TABLE`| String | Location for an action on a List View Table of Rancher Dashboard. Check [screenshot](./actions/#actionlocationtable-options) for location. |
|`TabLocation.RESOURCE_DETAIL`| String | Location for a Tab on a Resource Detail page. Check [screenshot](./tabs/#tablocationresource_detail-options) for location. |
|`PanelLocation.DETAILS_MASTHEAD`| String | Location for a panel on the Details Masthead area of a Resource Detail page. Check [screenshot](./panels/#panellocationdetails_masthead-options) for location. |
|`PanelLocation.DETAIL_TOP`| String | Location for a panel on the Detail Top area of a Resource Detail page. Check [screenshot](./panels/#panellocationdetail_top-options) for location. |
|`PanelLocation.RESOURCE_LIST`| String | Location for a panel on a Resource List View page (above the table area). Check [screenshot](./panels#panellocationresource_list-options) for location. |
|`CardLocation.CLUSTER_DASHBOARD_CARD`| String | Location for a card on the Cluster Dashboard page. Check [screenshot](./cards/#cardlocationcluster_dashboard_card-options) for location. |
|`TableColumnLocation.RESOURCE`| String | Location for a table column on a Resource List View page. Check [screenshot](./table-columns/#tablecolumnlocationresource-options) for location. |


## LocationConfig

The `LocationConfig` object defines **when** (product, resource, cluster...) these UI enhancement methods are applied on the UI. The **when** is based on the current routing system employed on Rancher Dashboard. Let's take on a simple example to try and understand the routing structure.

Example URL:
```
<INSTANCE-BASE-URL>/dashboard/c/local/explorer/apps.deployment/cattle-system/rancher-webhook
```

How to recognize the URL structure on the example above:

```
<INSTANCE-BASE-URL>/dashboard/c/<CLUSTER-ID>/<PRODUCT-ID>/<RESOURCE-ID>/<NAMESPACE-ID>/<ID>
```

**Note:** There are Kubernetes resources that aren't namespaced, such as `catalog.cattle.io.clusterrepo`, and in those cases the following structure applies:

```
<INSTANCE-BASE-URL>/dashboard/c/<CLUSTER-ID>/<PRODUCT-ID>/<RESOURCE-ID>/<ID>
```

There is another different routing pattern for "extensions as products" which follows a slightly different convention of the core Rancher Dashboard routes. An example of this would be:

```
<INSTANCE-BASE-URL>/dashboard/elemental/c/local/elemental.cattle.io.machineinventory/nvxml-6mtga
```

which translates to:

```
<INSTANCE-BASE-URL>/dashboard/<PRODUCT-ID>/c/<CLUSTER-ID>/<RESOURCE-ID>/<ID>
```

With this it's then possible to easily identify the parameters needed to populate the `LocationConfig` and add the UI enhancements to the areas that you like. YES, it's also possible to enhance other extensions!


The admissible parameters for the `LocationConfig` object are:

| Key | Compatible Version | Type | Description |
|---|---|---|---|
|`product`| `v2.7.2` | Array | Array of the product identifier. Ex: `fleet`, `manager` (Cluster Management), `harvesterManager` (Virtualization Management), `explorer` (Cluster Explorer) or `home` (Homepage) |
|`resource`| `v2.7.2` + `v2.8.0` | Array | Array of the identifier of the kubernetes resource to be bound to. Ex: `apps.deployment`, `storage.k8s.io.storageclass` or `secret` (v2.7.2). You can also define a wildcard, ex: `['*']`, which will match any resource page (v2.8.0)  |
|`namespace`| `v2.7.2` | Array | Array of the namespace identifier. Ex: `kube-system`, `cattle-global-data` or `cattle-system` |
|`path`| `v2.7.7` | Array | Array of objects that does matching for the `path` part of the url. Admissable properties for the object are: `urlPath` (string), `exact` (boolean, default or omission: `true`, which defines the type of match it does) and `endsWith` (boolean, defaults to false) .Ex: \{ `urlPath`: '/c/local/explorer/projectsnamespaces',  `exact`: true \} or \{ `urlPath`: 'explorer/projectsnamespaces',  `endsWith`: true \} |
|`cluster`| `v2.7.2` | Array | Array of the cluster identifier. Ex: `local` |
|`id`| `v2.7.2` | Array | Array of the identifier for a given resource. Ex: `deployment-unt6xmz` |
|`mode`| `v2.7.2` + `v2.7.7` | Array | Array of modes which relates to the type of view on which the given enhancement should be applied. Admissible values are: `edit` (v2.7.2), `config` (v2.7.2), `detail` (v2.7.2), `list` (v2.7.2) and `create` (v2.7.7) |
|`context`| `v2.7.2`| Object | Requirements set by the context itself. This is a key value object that must match the object provided where the feature is used. For instance if a ResourceTab should only include a tab given specific information where the ResourceTab is used. Ex `{ provider: "digitalocean" }` |
| `queryParam`| `v2.7.2` | Object | This is a key value object that must match the url's query param key values |
|`hash`| `v2.8.0` | Array | Array of strings for url hash identifiers, commonly used in Tabs Ex: On a details view of a `provisioning.cattle.io.cluster`, you have several tabs identified in the hash portion of the url such as `node-pools`, `conditions` and `related`  |

### LocationConfig Examples

Example 1:
```ts
{}
```

Passing an empty object as a `LocationObject` will apply a given extension enhancement to all locations where it can be apllied.

Example 2:
```ts
{ product: ['home'] }
```

Extension enhancement will be applied on the homepage of rancher dashboard (if applicable).

Example 3:
```ts
{ resource: ['pod'], id: ['pod-nxr5vm'] }
```

Extension enhancement will be applied on the resource `pod` with id `pod-nxr5vm` (if applicable).

Example 4:
```ts
{ 
  cluster:  ['local'], 
  resource: ['catalog.cattle.io.clusterrepo'], 
  mode:     ['edit'] 
}
```

Extension enhancement will be applied on the `edit` view/mode of the resource `catalog.cattle.io.clusterrepo` inside the `local` cluster (if applicable).














