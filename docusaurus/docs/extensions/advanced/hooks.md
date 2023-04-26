# Hooks

## Navigation In and Out of Extensions
Extensions can define `onEnter` and `onLeave` hooks in their index `addNavHooks` extension method, which will run when the authenticated middleware detects a package change by checking the route meta property. `onEnter` and `onLeave` accept the same props: the vuex store context and a config object containing: 

| Key | Type | Description |
|---|---|---|
|`clusterId`| String | The unique ID of the current cluster, determined by the route's `cluster` param |
|`product`| String | The name of the product being navigated to, also taken from the route |
|`oldProduct`| String | The name of the product being navigated away from |
|`oldIsExt`| Boolean | True if the previous product was in a package (note that this doesn't distinguish between inter- and intra-package product changes) |

The `authenticated` middleware will:
* Connect to the management cluster (`loadManagement`)
* Apply product config, as determined from the route (`applyProducts`)
* If an old extension is loaded, run its `onLeave` hook
* Run `onEnter` hook for new extension 
* Run `loadCluster` (which, as stated above, can run load and unload cluster actions defined in extensions)

An example of the usage `onEnter` and `onLeave` using the `addNavHooks` extension method would be:

```ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin, OnNavToPackage, OnNavAwayFromPackage } from '@shell/core/types';

const onEnter: OnNavToPackage = async(store, config) => {
  // define any function needed here for `onEnter`
};
const onLeave: OnNavAwayFromPackage = async(store, config) => {
  // define any function needed here for `onLeave`
};

// Init the extension
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide extension metadata from package.json
  // it will grab information such as `name` and `description`
  plugin.metadata = require('./package.json');

  // Load a product
  plugin.addProduct(require('./product'));

  // => => => Add hooks to Vue navigation world
  plugin.addNavHooks(onEnter, onLeave);
}
```