# Kubernetes Resources Data Load Optimizations
In order to improve performance of Rancher Dashboard especially for systems with a large number of resources, several changes have been introduced to the codebase such as incremental loading of list views, manual refresh of list views and optimisation for "secondary" data load.
 
## The `resource-manager` mixin for secondary data load
This is the mixin responsible for optimizing the loading of "secondary" data (data that is used to complete information on a given page, ex: populating a select input) which doesn't need to be watched (updated via websocket) or stored in the Vue store (Vuex). 

It fetches namespaced data directly from our API, avoiding the need to fetch all items and then filtering by a given namespace.

If you specify a namespace but any of the given resources you configured for your data fetch is not namespaced, the mixin will take care of that.

It will only return the data for successful network requests, throwing a `console.error` for any requests that have failed.

It provides a way to fetch data only for namespaced resources, which is very useful on a CREATE screen scenario where if a user toggles the namespace selector, data will need to be fetched again, but only for those namespace-dependent resources.

**NOTE:** by default, data fetched using this mixin will **NOT** have a model applied to it. There's an option called classify that will apply models if needed.


### Quick usage guide
Just import the `resource-manager` mixin to the given page, create the configuration variable that tells which data it should load and use the method `resourceManagerFetchSecondaryResources` to load the given data.

If you want a code example on Rancher Dashoard, check for a full implementation of the "secondary data load" on `mixins/workloads.js`.

Example: 

**Importing mixin**
```
import ResourceManager from '@shell/mixins/resource-manager';
```

**Setting up a configuration variable**

Allowed params for the configuration object:

* @param {**String**} `namespace` - Namespace identifier
* @param {**Object**} `data` - Object containing info about the data needed to be fetched and how it should be parsed. 

**NOTE: The object KEY NEEDS to be the resource TYPE!**
* @param {**Array**} `data[TYPE].applyTo` - The array of operations needed to be performed for the specific data TYPE
* @param {**String**} `data[TYPE].applyTo[x].var` - The 'this' property name that should be populated with the data fetched
* @param {**Boolean**} `data[TYPE].applyTo[x].classify` - Whether the data fetched should have a model applied to it
* @param {**Function**} `data[TYPE].applyTo[x].parsingFunc` - Optional parsing function if the fetched data needs to be parsed

Example of a configuration object to be used with the `resource-manager`:

```
this.secondaryResourceDataConfig = {
  namespace: 'fleet-default',
  data: {
    'secrets': {
      applyTo: [
        { var: 'namespacedSecrets' },
        {
          var:         'imagePullNamespacedSecrets',
          parsingFunc: (data) => {
            return data.filter(secret => (secret._type === 'docker' || secret._type === 'docker_json'));
          },
          classify: true
        }
      ]
    }
  }
}
```

Looking at the above example, we configuring the secondary data load to get data for the namespace `fleet-default` and with fetch `secrets`from the API and apply it to two diferent variables:

1. Will apply the full set of results fetched for the resource type `secrets` to variable `this.namespacedSecrets`

2. Will apply the parsed set of results (`parsingFunc` defines how data should be parsed) to the variable `this.imagePullNamespacedSecrets` which will apply the correct model to that parsed dataset because of the flag `classify`

**Initialize secondary data load**

```
async fetch() {
  this.resourceManagerFetchSecondaryResources(this.secondaryResourceDataConfig);
}
```



### Methods available

#### **resourceManagerFetchSecondaryResources**
Function used to initialize the data loading procedure

* @param {**Object**} `dataConfig` - Configuration object
* @param {**Boolean**} `onlyNamespaced` - Flag to enable the fetch from API *ONLY* for namespaced resources (will ignore requests for non-namespaced resources you have defined on the configuration object). Defaults to `false`

Example:
```
async fetch() {
  this.resourceManagerFetchSecondaryResources(dataConfig, onlyNamespaced);
}
```

#### **resourceManagerClearSecondaryResources**
Function used to clear the results for the secondary resource data fetch. It's a very useful method in a CREATE screen scenario where a user can "create" a namespace on the UI, operation which will make all our previous namespaced results invalid and in need to be cleared.

* @param {**Object**} `dataConfig` - Configuration object
* @param {**Boolean**} `onlyNamespaced` - Flag to enable the fetch from API *ONLY* for namespaced resources (will ignore requests for non-namespaced resources you have defined on the configuration object). Defaults to `false`

Example:
```
async fetch() {
  this.resourceManagerClearSecondaryResources(dataConfig, onlyNamespaced);
}
```



## The `resource-fetch` mixin for incremental loading and manual refresh

The `resource-fetch` mixin is the controller for all operations on a list view regarding the incremental loading and manual refresh features.

Both incremental loading and manual refresh are features that affect LIST views and are activated on the `Performance` section under `Global Settings` on Rancher Dashboard UI via a flag and also a configurable threshold of number of items for which is they are triggerable.

To understand better how the mixin works, one should understand first how list views are managed and rendered.

A list view of resources (table with a list of items of a given resource) can be of two types:

1. a *custom* list, which are defined on `/shell/list` folder on the Rancher Dashboard project
2. a *default* list, which will apply to all resources that **aren't** defined on `/shell/list` folder with a dedicated file

Both have a common entry point: the `/shell/components/ResourceList/index.vue` file. This is where all lists start their rendering process.

This is where it will decide to load a custom view (follow `this.hasListComponent`) or render a simple `ResourceTable` (check template part of the file).

For a default list, we should check for the last couple lines on the `async fetch` method for the function called `this.$fetchType(resource)` which is a method exposed by the mixin (where you can pass the resource type as argument) which will handle all data loading for that given resource type.

Under the hood it performs a `findAll` but it append some specific flags for incremental loading (`incremental`) and manual refresh (`hasManualRefresh` && `watch`) which will tap into the normal flow of data request from our API.

For a **default** list view, all should be covered with defaults by the `/shell/components/ResourceList/index.vue` file.

Two quick important notes:
- There is a `loading` computed prop in the mixin that is the default flag for the loading state of a `ResourceTable`
- There is a `rows` computed prop in the mixin that is the default list of items loaded on the mixin

If any of these two are referenced on a custom list template part but aren't defined on the JS part of the same file, it's because it uses the defaults which come from the mixin itself.

Another important configuration part is about the incremental loader options (component name `ResourceLoadingIndicator`). 

For custom lists the `ResourceTable` component is on the lookout for a method called `$loadingResources` which is defined on your custom list methods. If it exists, it should return an object with two properties:

`loadIndeterminate` - by default the incremental loader is of a **determinate** type, which means that it will show the current count of items already loaded / total items to be loaded. 
`loadResources` - by default the incremental loader will load the counts for the resource passed, but there are custom list views (ex: workloads) are comprised of multiple resources. You'll need to pass an array of all resource types for that list if you want to show the correct numbers on the incremental loader.

`Incremental loader` component (`ResourceLoadingIndicator`) is rendered inside the `Masthead` component (ResourceList... there are two Mastheads).

Generally, custom lists don't have a `Masthead` specified on it's template, but there's a Masthead rendered. That comes from `/shell/components/ResourceList/index.vue`,

### Implementation examples
- simple custom list implementation, with it's own `async fetch`
check `catalog.cattle.io.app` custom list

- custom list implementation, **without** `async fetch`
check `catalog.cattle.io.clusterrepo` custom list

- custom list implementation, **with** `async fetch` and `$loadingResources`
check `fleet.cattle.io.bundle` custom list

- custom list implementation, **with** `async fetch` and it's own Masthead instance
check `fleet.cattle.io.gitrepo` custom list

- multiple resources implementation
check `workload` custom list