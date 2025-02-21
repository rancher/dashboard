
# Vuex Stores and Resources

There are 3 main stores for communicating with different parts of the Rancher API:

- `management`: Points at global-level resources for Rancher as a whole.
- `cluster`: Points at resources for the currently selected cluster; changes when you change clusters.
- `rancher`: Points at older global-level resources, but some cluster-level resources are actually stored here and not physically in the cluster to be available to the `cluster` store.

And then a bunch of others:

| Name        | For                                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------------------- |
| action-menu | Maintains the current selection for tables and handling bulk operations on them                                  |
| auth        | Authentication, logging in and out, etc                                                                          |
| catalog     | Stores the index data for Helm catalogs and methods to find charts, determine if upgrades are available, etc     |
| github      | Part of authentication, communicating with the GitHub API                                                        |
| growl       | Global "growl" notifications in the corner of the screen                                                         |
| i18n        | Internationalization                                                                                             |
| index       | The root store, manages things like which cluster you're connected to and what namespaces should be shown        |
| prefs       | User preferences                                                                                                 |
| type-map    | Meta-information about all the k8s types that are available to the current user and how they should be displayed |
| wm          | "Window manager" at the bottom of the screen for things like container shells and logs.                          |


Store objects are accessed in different ways, below are common ways they are referenced by models and components

| Location                 | type                        | object                 | example                                                                                               |
| ------------------------ | --------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------- |
| `/model/<resource type>` | Dispatching Actions         | `this.$dispatch`       | `this.$dispatch('cluster/find', { type: WORKLOAD_TYPES.JOB, id: relationship.toId }, { root: true })` |
| `/model/<resource type>` | Access getters (store type) | `this.$getters`        | `this.$getters['schemaFor'](this.type)`                                                               |
| `/model/<resource type>` | Access getters (all)        | `this.$rootGetters`    | `this.$rootGetters['productId']`                                                                      |
| component                | Dispatching Actions         | `this.$store.dispatch` | ``this.$store.dispatch(`${ inStore }/find`, { type: row.type, id: row.id })``                         |
| component                | Access getters              | `this.$store.getters`  | `this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.value)`                                   |

> Prefixing a property in a model with `$`, as per `model` rows above, results in calling properties on the store object directly.

> Troubleshooting: Fetching the name of a resource type
>
> Good - Trims the text and respects `.` in path to type's string - `store.getters['type-map/labelFor']({ id: NORMAN.SPOOFED.GROUP_PRINCIPAL }, 2)`
>
> Bad - Does not trim text, issues when resource type contains "`.`" - ``store.getters['i18n/t'](`typeLabel.${ NORMAN.SPOOFED.GROUP_PRINCIPAL }`, { count: 2 })``


## Checking User Permissions with Schemas

Schemas dictate
- Which resources are shown
- What operations (create, update, delete, etc) can be made against resource/s
- What actions (archive, change password, etc) can be made against resource/s

In addition the resources themselves can dictate
- What actions can be made against the collection

The above, plus other factors, will effect what is shown by the UI
- Resources in the cluster explorer
- Edit resource buttons
- Delete resource
- etc

The schema can be checked in the Rancher API at:

```
https://<rancher url/v1/schema/provisioning.cattle.io.clusters
```
To check if a user has access to a resource, you can see if they can see the corresponding schema:
```ts
const hasAccess = this.$store.getters[`cluster/schemaFor`](type);

return hasAccess ? this.$store.dispatch('cluster/findAll', { type }) : Promise.resolve([]);
```

## Resource Models
Please continue reading at [Creating and Fetching Resources](./api-models.md)

## Creating and Fetching Resources

Please continue reading at [Creating and Fetching Resources](./api-creating-and-fetching-resources.md)

## Resource Selectors

The `parse` utility function in `utils/selector.js` helps you match or convert labels. For example, `matchLabels` could be used to get all the Pods for each workload.

Kubernetes supports matching with `matchExpressions`, but the UI converts selectors that use match expressions to selectors with `matchLabels` when possible because `matchLabels` is simpler and better supported by Rancher. When loading multiple resources at once from the Rancher API, you can only use `matchLabels`, but if you are loading only one resource at a time, you can use `matchExpressions`.

## Error Handling

When catching exceptions thrown by anything that contacts the API use `utils/error exceptionToErrorsArray` to correctly parse the response into a commonly accepted array of errors

## Unauthenticated Endpoints

If you need to add an endpoint to an unauthenticated route for loading from the store before login, you will need to add it [here](https://github.com/rancher/rancher/blob/cb7de4e6c3d7e783828dc662b1142c1f9ae5edbe/pkg/multiclustermanager/routes.go#L69).

## API Calls to Third-party Domains

Rancher includes a proxy that can be used to make requests to third-party domains (like a cloud provider's API) without requiring that the other end supports CORS. Send requests to `/meta/proxy/example.com/path` and the request will be made from the Rancher server and proxied back to you.

## Nodes vs. Machines

Upstream Kubernetes manages nodes, as shown in Cluster Explorer. Rancher deals with machines, which control node provisioning, and they are available from Cluster Management.

When you create a cluster, the cluster has a spec that contains machine pools. Each machine pool uses a machine config (`rke-machine-config`), which configures the size and role of the machine. Rancher sends the configuration to CAPI (Cluster API), which uses it to create the machines.

When provisioning RKE clusters, you could create node templates and define virtual machines in them. Then those definitions could be used when creating node pools. In contrast, RKE2 and K3s cluster provisioning uses CAPI as its standard for provisioning clusters, and CAPI requires that a machine template can only used once per node pool. For that reason, node templates cannot be shared across node pools the same way they used to be able to for RKE provisioning. The forms for provisioning new RKE2 and K3s clusters through Rancher don't introduce the concept of node templates. Instead they let you create new node pools for each new cluster.

## UI Components for Resource Types

The dashboard has a framework and set of components to support (conditional) representation of resource type/s. Common UI features include

- Collections of resources in a common table (Resource List). Usually shown when clicking on the side nav name type.
- Visual overview of a resource (Resource Detail). Usually shown when clicking on a List's row's name.
- Creating, Viewing and Editing a resource as a form (Resource Edit).
- Viewing and Editing a resource as YAML (Resource YAML)

By default only the table and, if enabled by the resource type, viewing/editing as YAML are enabled. To provide a richer experience the resource's table columns should be defined and custom overview and edit pages provided.

The top level list page is defined in `./components/ResourceList`. This displays a common masthead and table for the given resource type. Without any customisation the columns are restricted to a base set of `state`, `nameDisplay`, `namespace` and `ages`.

Any resources returned by `getInstances` should have a `kind` matching the required type. This results in the tables showing the correct actions, handling create/edit, etc.

### Resource Detail Pages

The top level detail page is defined in `./components/ResourceDetail`. This is a container page that covers a number of resource instance use cases (create, edit, view, etc). Like resource list this contains a common `Masthead` and additionally a sub header `DetailTop` (displays common properties of resources such as description, labels, annotations, etc). For a resource type that provides no customisation it will mostly likely just display a way to view and edit the resource by YAML.

The Create/Edit Yaml experience is controlled by `/components/ResourceYaml.vue`. Other features are handled by custom components described below.

Special attention should be made of the `mode` and `as` params that's available via the `CreateEditView` mixin (as well as other helpful functionality). Changing these should change the behaviour of the resource details page (depending on the availability of resource type custom components).

For more information about CreateEditView and how to add new create/edit forms, see [Create/Edit Forms.](./forms-and-validation.md)

| `mode` | `as`     | Content                                                              |
| ------ | -------- | -------------------------------------------------------------------- |
| falsy  | falsy    | Shows the View YAML or Customised Detail component                   |
| falsy  | `config` | Shows the View YAML or Customised Edit component (in read only mode) |
| `edit` | falsy    | Shows the Customised Edit component                                  |
| `edit` | `yaml`   | Shows the Edit Yaml component                                        |

In addition the Create process (assessable with the same url + `/create`) is also managed by the resource detail page with similar param options. 

| `mode`  | `as`   | Content                                                                                    |
| ------- | ------ | ------------------------------------------------------------------------------------------ |
| falsy   | `yaml` | Show the Edit YAML component in create mode                                                |
| `edit`  | falsy  | Show the Customised Edit component in create mode                                          |
| `clone` | falsy  | Shows the Customised Edit component in create mode pre-populated with an existing resource |

### Customising Resource Detail Pages

A more detailed overview page can be added by creating a resource type component in `/detail/`. This should provide a more eye pleasing presentation than a collection of inputs or yaml blob.
