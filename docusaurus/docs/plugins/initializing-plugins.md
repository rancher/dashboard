# Initializing Plugins
Follow instructions [here](./plugins-getting-started.md) to scaffold your plugin. Once you've done so, there are some initialization steps specific to plugins. Beyond that, plugins largely work the same as the rest of the dashboard. There are a set of top-level folders that can be defined and used as they are in the dashboard: `chart`, `cloud-credential`, `content`, `detail`, `edit`, `list`, `machine-config`, `models`, `promptRemove`, `l10n`, `windowComponents`, `dialog`, and `formatters`. You can read about what each of these folders does [here](../code-base-works/directory-structure.md)


## Initializing Plugin Stores
Plugins should explicitly register any store modules in their `index.ts` by using the `addDashboardStore` plugin method. This will also add familiar vuex actions for retrieving and classifying resources, details of which can be found in `shell/plugins/dashboard-store/index`.
Plugins can optionally define their own cluster store module by setting `isClusterStore` in the store index, eg:
```
const config: CoreStoreConfig = {
  namespace:      PRODUCT_NAME,
  isClusterStore: true
};

export default {
  specifics: harvesterFactory(),
  config,
  init:      steveStoreInit
};
```

This will cause the shell `loadCluster` action to run the plugin's `loadCluster` action when entering a package, and the plugin store's `unsubscribe` and `reset` when leaving. 

## Navigation In and Out of Plugins
Plugins can define `onEnter` and `onLeave` hooks in their index, which will run when the authenticated middleware detects a package change by checking the route meta property. `onEnter` and `onLeave` accept the same props: the vuex store context and a config opject containing: 

| Key | Type | Description |
|---|---|---|
|`clusterId`| String | The unique ID of the current cluster, determined by the route's `cluster` param |
|`product`| String | The name of the product being navigated to, also taken from the route |
|`oldProduct`| String | The name of the product being navigated away from |
|`oldIsExt`| Boolean | True if the previous product was in a package (note that this doesn't distinguish between inter- and intra-package product changes) |

The `authenticated` middleware will:
* Connect to the management cluster (`loadManagement`)
* Apply product config, as determined from the route (`applyProducts`)
* If an old plugin is loaded, run its `onLeave` hook
* Run `onEnter` hook for new plugin 
* Run `loadCluster` (which, as stated above, can run load and unload cluster actions defined in plugins)


## Plugin Routing
Plugins should use a pages directory, as the shell currently does, but routing needs to be explicitly defined then added in the plugin index using the plugin `addRoutes` method. Plugin routes can override existing dashboard routes: they'll be loaded on plugin entry and unloaded (with old dashboard routes re-loaded...) on plugin leave. As touched on above, cluster and product information used to connect to the cluster and define navigation is determined from the route. Consequently, while plugins have a lot of control over their own routing, anything tied into one kubernetes cluster should be nested in `pages/c/_cluster`.


## Defining Products
Product configuration for plugins is largely unchanged (read more about products [here](../products-and-navigation.md)); however, if the plugin contains one product intended to have a standalone UI, some additional product configuration is required, via the `setIsSingleProduct` vuex action.

| Key | Type | Description |
| --- | --- | --- |
| `logoRoute` | [Vue Router route config](https://v3.router.vuejs.org/api/#routes) |  Where to navigate when the upper-left logo is clicked |
| `productNameKey` | String | translation key for product name
| `afterLoginRoute` | [Vue Router route config](https://v3.router.vuejs.org/api/#routes) | where to redirect in auth middleware
| `enableSessionCheck` | Boolean | Toggle verifying the user auth session on [visibility change events](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event). Defaults to `false`
| `getVersionInfo` | Function | Version Info shown in lower left 
| `logo` | SVG | what's on the box: set the logo shown in the top level menu