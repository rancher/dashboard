# Performance

To ensure UI performance is maintained please follow this guide.

## Handle resource scaling

Rancher may connect to clusters with a large number of resources. For example a downstream cluster may have 10,000 pods, or the upstream cluster may be aware of 20,000 nodes.

> The following applies to components and processes that result in requests to the internal Steve API (`/v1/<resource>` or `/k8s/clusters/<cluster id>/v1/...`).
>
> Those resulting in requests to the internal Norman API (`/v3/<resource>`) or directly to Kube API (`/apis/...` or `/k8s/clusters/<cluster id>/apis/...`) do not require updating.

### Approach

#### Legacy 
Before 2.12.0 the pattern to access and monitor resources was to fetch them all and receive an update via WebSocket whenever one changed. However this does not scale when the resource count increases. 

- Takes a long time to fetch them all
- Increases memory footprint, impacting browser performance
- Lots of churn when any change, there could be 100s of web socket messages a second


#### Current
From 2.12.0 a new process for improving performance at scale has been introduced.

- Specifically fetch only the required resources
  - Filters applied service-side
  - Paginate lists server-side
- Watch the resource and update when needed
  - 1 debounced web socket update --> 1 http request

### Update Lists to use Server-Side Pagination

When showing a list of resources previously a `ResourceTable` component was used. This would receive a resource schema and some properties. With those it would handle the fetch of all resources and monitoring for updates. The headers / columns for the list would come from the resource's product configuration.

Now though we recommend using the `PaginatedResourceTable` component. This does the exact same as ResourceTable, however if enabled will paginate server-side thus avoiding fetching all resources.

*Secondary Resources*

The 'primary' resource of a list will be fetched, per page, by the `PaginatedResourceTable` component. However sometimes other 'secondary' resources are needed by a list column.

These can either be fetched 
- once upfront when the component is first loaded 
  - Supply a method `:fetchSecondaryResources="..."` to the component
- whenever a new page is shown 
  - Supply a method `:fetchPageSecondaryResources="..."` to the component
  - This could be triggered a lot so should itself be performant

*Header configuration*

Due to pagination happening server-side the UI can no-longer sort and filter on properties it manages locally. The header configuration that supports this new process is automatically created unless custom headers have been provided.

To override existing non-compatible server-side pagination headers
- if headers are supplied to the component, also set `:pagination-headers="..."`
- if headers are supplied by product configuration, supply a second array to `headers(<resourcetype>, <non server-side pagination compatible headers>)`

A compatible header will contain `value`, `sort` and `search` properties that reference values that exist natively in the resource server-side

*Examples*

- rancher/dashboard `shell/list/service.vue`
  - for custom header configuration see `headers(SERVICE,` in `shell/config/product/explorer.js` 
  - for secondary resources see `fetchSecondaryResources`
- rancher/dashboard `shell/list/node.vue`
  - for custom header configuration see `headers(NODE,` in `shell/config/product/explorer.js` 
  - for secondary resources see `fetchSecondaryResources`
  - for page secondary resources see `fetchPageSecondaryResources`
- rancher/dashboard `shell/pages/c/_cluster/explorer/EventsTable.vue`
  - for custom header configuration see `:pagination-headers="paginationHeaders"` 
- rancher/dashboard `shell/pages/home.vue`
  - for custom header configuration see `:pagination-headers="paginationHeaders"` 
  - for secondary resources see `fetchSecondaryResources`
  - for page secondary resources see `fetchPageSecondaryResources`

*Checklist*

1. `ResourceTable` has been replaced with `PaginatedResourceTable`
1. Component containing `PaginatedResourceTable` should not dispatch any `findAll` actions for primary or secondary resources
   - Primary will be fetched via the `PaginatedResourceTable` component (no extra changes required)
   - Secondary resources should be fetched via functions `fetchSecondaryResources` and/or `fetchPageSecondaryResources` passed into `PaginatedResourceTable`
1. If headers have been provided or configured in product, specific server-side pagination compatible ones should be provided
   - Header `value`, `sort` and `search` all reference properties on the native object stored server-side
1. List has been validated when Server-Side Pagination is enabled via the `ui-sql-cache` Feature Flag   

### Update Selects to limit resources

In the UI there are places where the user is required to select a specific resource. A new select component `ResourceLabeledSelect` has been created that supports both the old method (fetch everything, display everything) and the new method (fetch only a page's worth of data, only show that page). This should replace usages of `LabeledSelect`.

Some additional configuration can be supplied, see the `paginatedResourceSettings` property / `ResourceLabeledSelectPaginateSettings` type for details.

*Examples*

- rancher/dashboard `shell/components/form/SecretSelector.vue`
- rancher/dashboard `shell/chart/rancher-backup/S3.vue`

*Checklist*

1. `LabeledSelect` component has been replaced with `ResourceLabeledSelect`
1. Configuration has been supplied, given the resource type and requirements
1. Change has been validated when Server-Side Pagination is enabled via the `ui-sql-cache` Feature Flag   

### Update Standalone Requests

There may be other places and circumstances where an action `findAll` needs to be replaced with something that filters down the results to the desired subset

*General Filtering*

The `findAll` action can be replaced with `findPage` which unlocks a number of different filtering options. For details see `shell/types/store/pagination.types.ts` `FilterArgs` and inline comments. For details on what these represent see [Steve API docs](https://github.com/rancher/steve/) (NOTE - The steve api is internal and liable to change without notice)

*Uncached Resources*

The `findX` set of filters will populate the local cache with a result set and keep it updated. The cache is 1:1 with type. There are scenarios where you might want to keep the cached results but also make another request to fetch resources of the same type. To avoid overwriting the cache the helper `PaginationWrapper` can be used. This will handle making the request and hooks to act upon when that changes.

*labelSelectors Filtering*
// TODO: RC

*Examples*
- shell/list/persistentvolume.vue `fetchPageSecondaryResources`

*Checklists*
- Cache based resources are fetched and filtered by updating `findAll` to use `findPage`
- Non-cache based resources are managed by `PaginationWrapper`
- TODO: RC local usages of the labelSelector help functions are updated to use ??? - Filters are either basic or labelSelector
