---
toc_max_heading_level: 4
---

# Extensions API

## Introduction

Rancher Extensions provides a mechanism to add new functionality to the Dashboard UI at runtime. This is covered mostly by the Extensions API which provides several methods on the `plugin` object to enhance the Rancher Dashboard UI in key areas of the interface. They should be defined where the extension is initialized.

You can find an installable extension providing some usage examples of the Extensions API here: https://github.com/rancher/ui-plugin-examples.

These are the currently available methods of the Extension API:

| Method | Rancher Version support |
| --- | --- |
| [addAction](extension-api-methods/add-action) | v2.7.2 |
| [addCard](extension-api-methods/add-card) | v2.7.2 |
| [addPanel](extension-api-methods/add-panel) | v2.7.2 |
| [addTab](extension-api-methods/add-tab) | v2.7.2 |
| [addTableColumn](extension-api-methods/add-table-column) | v2.7.2 |

<br/>

To start off how to use the Extensions API, it's important to mention that most of these methods will need 3 arguments which are important to know:

**where** - this defines which area of the UI the extension method will apply to.

**when** - this defines the exact product, resource, cluster, mode, etc, which the extension method will apply to and it's based on a `LocationConfig` object, which is explained on the next chapter.

**options** - set of options needed for each specific method.

Example: 

```ts
plugin.addPanel(
  where,
  when,
  options
);
```

or

```ts
plugin.addPanel(
  PanelLocation.DETAIL_TOP,
  { resource: ['catalog.cattle.io.clusterrepo'] },
  { component: () => import('./DetailTopComponent.vue') }
);
```

<br/>
<br/>

## `where` string definition

The `where` defines which area of the UI the extension method will apply to and they depend on which method they are applied to. This means that each method will only accept a given subset of the the following list (documented per each method).

The admissable string values for the `where` are:

| Key | Type | Description |
|---|---|---|
|`ActionLocation.HEADER`| String | Location for an action on the Header of Rancher Dashboard. Check [screenshot](extension-api-methods/add-action/#actionlocationheader-options) for location. |
|`ActionLocation.TABLE`| String | Location for an action on a List View Table of Rancher Dashboard. Check [screenshot](extension-api-methods/add-action/#actionlocationtable-options) for location. |
|`TabLocation.RESOURCE_DETAIL`| String | Location for a Tab on a Resource Detail page. Check [screenshot](extension-api-methods/add-tab/#tablocationresource_detail-options) for location. |
|`PanelLocation.DETAILS_MASTHEAD`| String | Location for a panel on the Details Masthead area of a Resource Detail page. Check [screenshot](extension-api-methods/add-panel/#panellocationdetails_masthead-options) for location. |
|`PanelLocation.DETAIL_TOP`| String | Location for a panel on the Detail Top area of a Resource Detail page. Check [screenshot](extension-api-methods/add-panel/#panellocationdetail_top-options) for location. |
|`PanelLocation.RESOURCE_LIST`| String | Location for a panel on a Resource List View page (above the table area). Check [screenshot](extension-api-methods/add-panel/#panellocationresource_list-options) for location. |
|`CardLocation.CLUSTER_DASHBOARD_CARD`| String | Location for a card on the Cluster Dashboard page. Check [screenshot](extension-api-methods/add-card/#cardlocationcluster_dashboard_card-options) for location. |
|`TableColumnLocation.RESOURCE`| String | Location for a table column on a Resource List View page. Check [screenshot](extension-api-methods/add-table-column/#tablecolumnlocationresource-options) for location. |

<br/>
<br/>

## `LocationConfig` object definition (`when`)

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


The admissable parameters for the `LocationConfig` object are:

| Key | Type | Description |
|---|---|---|
|`product`| Array | Array of the product identifier. Ex: `fleet`, `manager` (Cluster Management), `harvesterManager` (Virtualization Management), `explorer` (Cluster Explorer) or `home` (Homepage) |
|`resource`| Array | Array of the identifier of the kubernetes resource to be bound to. Ex: `apps.deployment`, `storage.k8s.io.storageclass` or `secret`  |
|`namespace`| Array | Array of the namespace identifier. Ex: `kube-system`, `cattle-global-data` or `cattle-system` |
|`cluster`| Array | Array of the cluster identifier. Ex: `local` |
|`id`| Array | Array of the identifier for a given resource. Ex: `deployment-unt6xmz` |
|`mode`| Array | Array of modes which relates to the type of view on which the given enhancement should be applied. Admissable values are: `edit`, `config`, `detail` and `list` |

## `LocationConfig` Examples

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














