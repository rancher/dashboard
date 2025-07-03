
# Update Requests

Make use of server-side pagination and filtering in places where ad-hoc requests are made.

There may be places where an extension fetches all of a resource type. When there is likely to be a lot of that resource type the extension should be updated to filter down the number of resources to a manageable count.

> Server-side pagination is a feature that is on by default but can be disabled. When disabled not all API functionality is available. In v2.12.0 and until the ability to disable the feature both old and new approaches need to be supported.
> 
> Additionally server-side pagination may be enabled but not currently supported for a resource type.
>
> To determine if server-side pagination is supported for a resource type use the `paginationEnabled` action. For example
> 
> - `this.$store.getters['cluster/paginationEnabled'](POD);`
> - `this.$store.getters['management/paginationEnabled'](MANAGEMENT.CLUSTER);`

### General Filtering

Places that dispatch the `findAll` action should be supplemented with `findPage`.

If server-side pagination is not enabled use `findAll` as before, it enabled use the new `findPage` action

The `findPage` action unlocks a number of different filtering options. For details see `shell/types/store/pagination.types.ts` `FilterArgs` and inline comments. For details on what these represent see [Steve API docs](https://github.com/rancher/steve/) (NOTE - The steve api is internal and liable to change without notice)

*Examples*
- rancher/dashboard `shell/edit/serviceaccount.vue`
  - `filterSecretsByApi` method
  - the UI fetches `secrets`
  - server-side pagination 
    - enabled - the UI fetches only `secrets` matching a specific type
    - disabled - the UI fetches all `secrets`
- rancher/dashboard `shell/detail/node.vue`
  - `fetch` method
  - the UI fetches `pods` in a specific `node`
  - server-side pagination 
    - enabled - the UI fetches only `pods` matching the `node`
    - disabled - the UI fetches all `pods`
- rancher/dashboard `shell/pages/home.vue`
  - `fetchSecondaryResources` 
    - only runs when server-side pagination is disabled i.e. it's param `opts.canPaginate` is false
    - fetches all resources
  - `fetchPageSecondaryResources`
    - only runs when server-side pagination is enabled i.e. it's param `opts.canPaginate` is false
    - fetches resources associated with the current page
    

### Uncached Resources

The `findX` set of filters will populate the local cache with a result set and keep it updated. The cache is 1:1 with type. There are scenarios where you might want to keep the cached results but also make another request to fetch resources of the same type. To avoid overwriting the cache the helper `PaginationWrapper` can be used. This will handle making the request and hooks to act upon when that changes. Therefore both the store cache and multiple other contexts can handle requests to the same resource type

*Examples*
- rancher/dashboard `shell/components/nav/TopLevelMenu.helper.ts`
  - The TopLevelMenu is the side bar which contains a list of clusters
  - The list of clusters comes in two parts with particular different requirements
  - Server-side pagination 
    - Disabled
      - The cache is populates with all clusters
      - Then different filters are applied locally to construct the two parts
    - Enabled
      - The UI needs to construct the two parts with multiple requests
      - It cannot store each in the cache (a request would overwrite cache with the results of others)
      - `PaginationWrapper` is used to fetch the server-side filtered results, cache them within the object and handle updates to them (for example a cluster goes offline, is created, etc)
    

### labelSelector Filtering

Kubernetes provides a label filtering mechanism called labelSelectors. These filter resources by labels a number of different ways.

Before v2.12.0 the UI could either apply this only via the native Kube API or by fetching all resources and applying the labelSelector locally.

From v2.12.0 the UI can apply them via the Rancher API, avoiding having to fetch all resources and apply them locally.

*Update action `findMatching` --> `findLabelSelector`*

`findMatching`, like other `findX` actions, will make a http request to fetch resources and store them locally in the cache. These should be replaced with `findLabelSelector` which will make the right http request given the enabled/disabled state of server-side pagination.

*Update `shell/utils/selector.js` `matching` --> `shell/utils/selector-typed.ts` `matching`*

The old `matching` function simply takes an array and applies the labelSelector. The new `matching` now wraps a lot more and can be used to also fetch the array. The array is populated the right way given the enabled/disabled state of server-side pagination.

*Examples*
- `shell/models/service.js` `fetchPods`
  - Calls `findLabelSelector` to find `pods` matching the `services` labelSelector in it's relationships
- `shell/components/form/ResourceSelector.vue`
  - This component can be used to discover resources that match a labelSelector
  - Under the hood it now gets those resources via `shell/utils/selector-typed.ts` `matching`

## Checklists
1. For resources that are globally cached
   - With server-side pagination disabled requests continue as before and can use `findAll`
   - With server-side pagination enabled requests use the new `findPage` to find a smaller subset of resources
1. For resources that are not globally cached
   - With server-side pagination disabled requests continue as before and can use `findAll`
   - With server-side pagination enabled requests use the new `PaginationWrapper` wrapper to find a transient subset of resources
1. Locations that previously used `findMatching` or local application of the `labelSelector` are updated to use `findLabelSelector` and the new `matching` helper
1. Changes have been validated when Server-Side Pagination is enabled and disabled via the `ui-sql-cache` Feature Flag
