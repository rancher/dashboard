
# Update Lists

Make use of server-side pagination and filtering in lists.

### Update `ResourceTable` to `PaginatedResourceTable`

When showing a list of resources previously a `ResourceTable` component was used. This would receive a resource schema and some properties. With those it would handle the fetch of all resources and monitoring them for updates. The headers / columns for the list would come from the resource's product configuration.

Now though we recommend using the `PaginatedResourceTable` component. This does the exact same as ResourceTable, however if server-side pagination is enabled it will utilise it, thus avoiding fetching all resources.

*Examples*
- rancher/dashboard `shell/list/networking.k8s.io.ingress.vue`
- rancher/dashboard `shell/pages/c/_cluster/explorer/EventsTable.vue`
- rancher/dashboard `shell/list/service.vue`

### `PaginatedResourceTable` Column configuration

Due to pagination happening server-side the UI can no-longer sort and filter on properties it manages locally. The column configuration that supports this new process is automatically created unless custom columns have been provided.

To override existing non-compatible server-side pagination headers
- if headers are supplied by product configuration, supply a second array to `headers(<resourcetype>, <non server-side pagination compatible headers>)`
  - this is the recommended way to customize the columns in lists
- if headers are supplied to the component, also set `:pagination-headers="..."`
  - this can be used if there is a situation where the default, global columns cannot be used

A compatible column will contain `value`, `sort` and `search` properties that reference values that exist natively in the resource server-side. Properties that reference constructed properties from the resource's model cannot be used.

*Examples*

- rancher/dashboard `shell/list/service.vue`
  - see `headers(SERVICE,` in `shell/config/product/explorer.js` 
- rancher/dashboard `shell/list/node.vue`
  - see `headers(NODE,` in `shell/config/product/explorer.js` 
- rancher/dashboard `shell/pages/c/_cluster/explorer/EventsTable.vue`
  - see `:pagination-headers="paginationHeaders"` 
- rancher/dashboard `shell/pages/home.vue`
  - see `:pagination-headers="paginationHeaders"` 

### Secondary Resources

The 'primary' resource of a list will be fetched, per page, by the `PaginatedResourceTable` component. However sometimes other 'secondary' resources are needed by a column to display additional information.

These can either be fetched 
- once upfront when the component is first loaded 
  - Supply a method `:fetchSecondaryResources="..."` to the component
  - Be careful not to load to many, otherwise `fetchPageSecondaryResources` should be used
- whenever a new page is shown 
  - Supply a method `:fetchPageSecondaryResources="..."` to the component
  - This could be triggered a lot so should itself be performant

For more information on fetching resources see the [Update Requests](./requests.md) page

*Examples*
- `fetchSecondaryResources`
  - rancher/dashboard `shell/list/service.vue`
    - The `service` lists requires kube `node` resources in order to show NodePort links
  - rancher/dashboard `shell/list/persistentvolume.vue`
    - The `persistentvolume` list requires `persistentvolumeclaim`s to show PVCs connected to the PV
    - This is used when server-side pagination is DISABLED
- `fetchPageSecondaryResources`
  - rancher/dashboard `shell/pages/home.vue`
    - The home page shows a list of clusters
    - In order to populate columns in that list a number of other resources are needed
    - Only the resources required by the current page are fetched- rancher/dashboard `shell/list/persistentvolume.vue`
  - The `persistentvolume` list requires `persistentvolumeclaim`s to show PVCs connected to the PV
    - Only the PVC's associated with the page of PVs are fetched
    - This is used when server-side pagination is ENABLED

### Additional filtering

By default `PaginatedResourceTable` will fetch all of the resource type (given the namespace filter). Sometimes lists require additional filtering. This can be done in two ways

- To support enabled Server-Side Pagination
  - Supply a method `:api-filter="..."` to the component
  - this will apply additional filters to the http requests used to fetch resources
- To support disabled Server-Side Pagination
  - Supply a method `:local-filter="..."` to the component
  - this will run every time the collection changes

*Examples*

- rancher/dashboard `shell/list/catalog.cattle.io.clusterrepo.vue`
  - The list of Apps / Repos is filtered by a specific annotation
- rancher/dashboard `shell/components/form/ResourceTabs/index.vue`
  - When viewing a specific resource, the `Events` tab shows a list of events filtered to show events related to that specific resource

### Checklist

1. `ResourceTable` has been replaced with `PaginatedResourceTable`
1. If headers have been provided or configured in product, specific server-side pagination compatible ones should be provided
   - Header `value`, `sort` and `search` all reference properties on the native object stored server-side
1. Components containing `PaginatedResourceTable` should fetch secondary resources efficiently as possible
   - Primary resources will be fetched automatically via the `PaginatedResourceTable` component (no extra changes required)
   - Secondary resources are fetched via functions `fetchSecondaryResources` and/or `fetchPageSecondaryResources` passed into `PaginatedResourceTable`
   - `fetchSecondaryResources` and `fetchPageSecondaryResources` should can use `findAll` when server-side pagination is disabled
   - `fetchSecondaryResources` and `fetchPageSecondaryResources` should cannot use `findAll` and should use `findPage` when server-side pagination is disabled
1. If lists do not show all of a resource and required additional filtering both `api-filter` and `local-filter` have been passed into `PaginatedResourceTable`  
1. Changes have been validated when Server-Side Pagination is enabled and disabled via the `ui-sql-cache` Feature Flag
