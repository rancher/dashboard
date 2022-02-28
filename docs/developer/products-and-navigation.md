# Products and Navigation

Details on products such as Cluster Management, Fleet and Harvester are defined in `config/product`. For each product, we use the `product(options)` function to define whether you can remove it and what store is used to get resources for that product. For example, `config/product/explorer` defines how types are grouped and weighted in Cluster Explorer.

## Product Configuration

Products are top-level features that are reached via the header top left menu. Some are built in, such as `Cluster Explorer`, `Apps & Marketplace`, and `Users & Authentication`. Some are enabled only after installing the required Helm charts via `Apps & Marketplace`.

Configuration for each product can be found in `/config/product`. In the product configuration,

- `basicType()` indicates resources that are always shown in the side nav for the product, such as Services and Ingresses. Basic types are shown even if the number of them is 0, while other resources (such as the types listed under **More** in Cluster Explorer) are only included in the navigation if there is at least one of them.
- `ignoreType()` is used for types that were deprecated or hidden.
- `mapGroup()` maps Kubernetes API groups to more human-readable names.
- `configureType()` disables create for special types such as node types or Jobs because Jobs are not mutateable in Kubernetes. All of the possible types are defined in the `type-map/optionsFor` action.
- `headers()` defines headers shown in the list view for the resource. For basic cases you can define table headers in the product config. For more complicated cases, you can define a custom list component.
- `weightGroup()`/`weightType()` Sets the position of the group/type for this product. 

These settings are stored in the `type-map` section of the store and manipulated with functions in `/store/type-map.js`. More docs for these functions are at the top of the `type-map.js` file.

## Building the Side Navigation

The side navigation bar is built by a function called `getTree` which is in `store/type-map.js`. `getTree` can be called in multiple modes. It takes a list of all types and returns the ones that match the condition of the mode.

`getTree` can be run in the following modes:

- `basic` matches data types that should always be shown even if there are 0 of them.
- `used` matches the data types where there are more than 0 of them in the current set of namespaces.
- `all` matches all types.
- `favorite` matches starred types.

You can specify if you want resources to be filtered by namespace or if all resources in the cluster should be shown.

## Counting Resources by Type

Steve keeps a count of every type in memory at `v1/counts`. This endpoint gives us a count of each type broken down by namespace and state, which allows the side nav to show a preview of how many resources of each type there are in the currently active namespace(s). Currently we don't use the count of resources broken down by state.

Note: While the side nav typically limits how many resources are shown so that the user is not overwhelmed, you can see all resources by clicking the magnifying glass in the top nav.

## Virtual and Spoofed Resource Types

The side nav is populated by resource types that have been applied to the current product. Virtual Types are a way to add additional menu items. These are purely for adding navigation and do not support tables or details views. Examples of virtual types can be found by searching for `virtualType`. For instance the `Users & Authentication` product has a virtual type of 'config' to show the `Auth Providers` page.

Spoofed Types, like virtual types, add menu items but also define a spoofed schema and a `getInstances` function. The latter provides a list of objects of the spoofed type. This allows the app to then make use of the generic list, detail, edit, etc pages used for standard types.

