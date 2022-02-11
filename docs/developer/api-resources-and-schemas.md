# API

There are lots of different APIs available in Rancher, but the primary two are [Norman](https://github.com/rancher/norman) and [Steve](https://github.com/rancher/steve)

## Norman

Norman is older and mainly used by the [Ember UI](https://github.com/rancher/ui).  It presents an opinionated view of some of the common resources in a Kubernetes cluster, with lots of features to make the client's life easier.  Fields are renamed to be named more consistently, deeply-nested structures are flattened out somewhat, complicated multi-step interactions with the k8s API are orchestrated in the server and hidden from you, etc.  It attempts to bridge the gap from Rancher 1.x's usability, and is quite nice if it does what you need.  But _only_ the types that Norman supports are exposed, and you can _only_ interact with the resources in the namespaces assigned to a Project.  Types Norman doesn't know about and namespaces not assigned to a project are effectively invisible.

## Steve

Steve is newer, and the primary one used here.  It works in the opposite direction, starting with a completely unopinionated view of every resource available in a cluster, and then adding custom logic only where needed.  Every type and every namespace are directly addressable.  This still adds some critical functionality over directly talking to the k8s API, such as:

- It's presented following our [api-spec](https://github.com/rancher/api-spec), so the same client libraries work for any of our APIs, including the in-browser generic [api-ui](https://github.com/rancher/api-ui).
- "Watches" to find out when a resource changes are aggregated into a single websocket which keeps track of what's connected and can resume the stream, rather than many independent calls to the native k8s implementation
- The "counts" resource internally watches everything to keep track of how many of every type of resource there are in every namespace and state, which allows us to show all the types that are "in use" and how many there are in the left nav.
- Schemas and links on each resource efficiently identify what permissions the user making the request has, so that actions in the UI can be hidden or disabled if not allowed for the current user instead of letting them try and having the server reject it.
- Normalizing the different and sometimes inconsistent state/status/conditions data from resources into a single logical view of the world the UI can present.
- RPC-style actions to do more complicated workflows on the server side when appropriate

## Endpoints

In a production setup these are all handled natively by Rancher.  For development of dashboard, they are proxied to the Rancher install that the `API` environment variable points at.

Endpoint                 | Notes
-------------------------|-------
`/v3`                    | Norman API
`/v3-public`             | Norman unauthenticated API (mostly for info required to login)
`/v1`                    | Steve API for the management ("local") cluster
`/k8s/clusters/<id>`     | Proxy straight to the native k8s API for the given downstream cluster
`/k8s/clusters/<id>/v1`  | Steve API for given downstream cluster via the server proxy

The older Norman API is served on `/v3`. The newer Steve API (see [here](https://github.com/rancher/api-spec/blob/master/specification.md) for spec) is served on `/v1` .

In both cases the schemas returned dictate 
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

There are other factors that assist in this, namely values from the `type-map`. More details can be found throughout this 
document.

## Exploring the API

The API serves up an interface to [browse both Norman and Steve APIs](https://github.com/rancher/api-ui). Both will list supported schemas and allow the user to fetch individual or collections of resources. The schemas will describe the actions executable against individual or collections of resource. For Norman it will also show fields that can be filtered on.

The dashboard will proxy requests to the API, so the interfaces are available via `<Dashboard URL>/v3` (Norman) and `<Dashboard URL>/v1` (Steve)

## Synching State

The high-level way the entire UI works is that API calls are made to load data from the server, and then a "watch" is started to notify us of changes so that information can be kept up to date at all times without polling or refreshing.  You can load a single resource by ID, an entire collection of all those resources, or something in between, and they should still stay up to date.  This works by having an array of a single authoritative copy of all the "known" models saved in the API stores (`management` & `cluster`) and updating the data when an event is received from the "subscribe" websocket.  The update is done on the _existing_ copy, so that anything that refers to it finds out that it changed through Vue's reactivity.  When manipulating models or collections of results from the API, some care is needed to make sure you are keeping that single copy and not making extras or turning a "live" array of models into a "dead" clone of it.

The most basic operations are `find({type, id})` to load a single resource by ID, `findAll({type})` load all of them.  These (anything starting with `find`) are async calls to the API.  Getters like `all(type)` and `byId(type, id)` are synchronous and return only info that has already been previously loaded.  See `plugins/steve/` for all the available actions and getters.

## Resources

A resource is an instance of a schema e.g. the `admin` user is an instance of type `management.cattle.io.user` from the `Steve` API. 

## Schemas

Schemas are provided in bulk via the APIs and cached locally in the relevant store (`management`, `rancher`, etc).

A schema can be fetched synchronously via store getter

```
import { POD } from '@/config/types';

this.$store.getters['cluster/schemaFor'](POD)`
```

> Troubleshooting: Cannot find new schema
> 
> Ensure that your schema text in `/config/types.js` is singular, not plural

As mentioned before a schema dictates the functionality available to that type and what is shown for the type in the UI.

# Vuex Stores

There are 3 main stores for communicating with different parts of the Rancher API:

- `management`: Points at the global-level "steve" API for Rancher as a whole.
- `cluster`: Points at "steve" for the one currently selected cluster; changes when you change clusters.
- `rancher`: Points at the "norman" API, primally for global-level resources, but some cluster-level resources are actually stored here and not physically in the cluster to be available to the `cluster` store.

And then a bunch of others:

Name                 | For
---------------------|-------
action-menu | Maintains the current selection for tables and handling bulk operations on them
auth | Authentication, logging in and out, etc
catalog | Stores the index data for Helm catalogs and methods to find charts, determine if upgrades are available, etc
github | Part of authentication, communicating with the GitHub API
growl | Global "growl" notifications in the corner of the screen
i18n | Internationalization
index | The root store, manages things like which cluster you're connected to and what namespaces should be shown
prefs | User preferences
type-map | Meta-information about all the k8s types that are available to the current user and how they should be displayed
wm | "Window manager" at the bottom of the screen for things like container shells and logs.


Store objects are accessed in different ways, below are common ways they are referenced by models and components

|Location|type|object|example|
|----|----|----|----|
| `/model/<resource type>` | Dispatching Actions | `this.$dispatch` | `this.$dispatch('cluster/find', { type: WORKLOAD_TYPES.JOB, id: relationship.toId }, { root: true })`
| `/model/<resource type>` | Access getters (store type) | `this.$getters` | `this.$getters['schemaFor'](this.type)`
| `/model/<resource type>` | Access getters (all) | `this.$rootGetters` | `this.$rootGetters['productId']`
| component | Dispatching Actions | `this.$store.dispatch` | ``this.$store.dispatch(`${ inStore }/find`, { type: row.type, id: row.id })``
| component | Access getters | `this.$store.getters` | `this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.value)`

> Prefixing a property in a model with `$`, as per `model` rows above, results in calling properties on the store object directly.

> Troubleshooting: Fetching the name of a resource type
>
> Good - Trims the text and respects `.` in path to type's string - `store.getters['type-map/labelFor']({ id: NORMAN.SPOOFED.GROUP_PRINCIPAL }, 2)`
>
> Bad - Does not trim text, issues when resource type contains "`.`" - ``store.getters['i18n/t'](`typeLabel.${ NORMAN.SPOOFED.GROUP_PRINCIPAL }`, { count: 2 })``


## Checking User Permissions

The schema can be checked in the Rancher API at:

```
https://<rancher url/v1/schema/provisioning.cattle.io.clusters
```
To check if a user has access to a resource, you can see if they can see the corresponding schema:
```
const hasAccess = this.$store.getters[`cluster/schemaFor`](type);

return hasAccess ? this.$store.dispatch('cluster/findAll', { type }) : Promise.resolve([]);
```

## Model Architecture

The ES6 class models in the `models` directory are used to represent Kubernetes resources. The class applies properties and methods to the resource, which defines how the resource can function in the UI and what other components can do with it. Different APIs return models in different structures, but the implementation of the models allows some common functionality to be available for any of them, such as `someModel.name`, `someModel.description`, `setLabels` or `setAnnotations`.

Much of the reused functionality for each model is taken from the Steve plugin. The class-based models use functionality from `plugins/steve/resource-class.js`.

The `Resource` class in `plugins/steve/resource-class.js` should not have any fields defined that conflict with any key ever returned by the APIs (e.g. name, description, state, etc used to be a problem). The `SteveModel` (`plugins/steve/steve-class.js`) and `NormanModel` (`plugins/steve/norman-class.js`) know how to handle those keys separately now, so the computed name/description/etc is only in the Steve implementation. It is no longer needed to use names like `_name` to avoid naming conflicts.

## Extending Models

The `Resource` class in `plugins/steve/resource-class.js` is the base class for everything and should not be directly extended. (There is a proxy-based counterpart of `Resource` which is the default export from `plugins/steve/resource-instance.js` as well.) If a model needs to extend the basic functionality of a resource, it should extend one of these three models:

- `NormanModel`: For a Rancher management type being loaded via the Norman API (/v3, the Rancher store). These have names, descriptions and labels at the root of the object. 
- `HybridModel`: This model is used for old Rancher types, such as a Project (mostly in management.cattle.io), that are loaded with the Steve API (/v1, the cluster/management stores). These have the name and description at the root, but labels under metadata.
- `SteveModel`: Use this model for normal Kubernetes types such as workloads and secrets. The name, description and labels are under metadata.

The Norman and Hybrid models extend the basic Resource class. The Hybrid model is extended by the Steve model.

## Creating and Fetching Resources

Most of the options to create and fetch resources can be achieved via dispatching actions defined in `/plugins/steve/actions.js`

| Action| Example Command | Description |
|--------|-------|-----|
| Create | `$store.$dispatch('<store type>/create', <new object>)`| Creates a new Proxy object of the required type (`type` property must be included in the new object) |
| Clone | `$store.$dispatch('<store type>/clone', { resource: <existing object> })` | Performs a deep clone and creates a proxy from it |
| Fetch all of a resource type | `$store.dispatch('<store type>/findAll', { type: <resource type> })` | Fetches all resources of the given type. Also, when applicable, will register the type for automatic updates. If the type has already been fetched return the local cached list instead |
| Fetch a resource by ID | `$store.dispatch('<store type>/find', { type: <resource type>, id: <resource id> })` | Finds the resource matching the ID. If the type has already been fetched return the local cached instance. |
| Fetch resources by label | `$store.dispatch('<store type>/findMatching', { type: <resource type>, selector: <label name:value map> })` | Fetches resources that have `metadata.labels` matching that of the name-value properties in the selector |

> Once objects of most types are fetched they will be automatically updated. See [README#synching-state](../../../README.md#synching-state) for more info. For some types this does not happen. For those cases, or when an immediate update is required, adding `force: true` to the `find` style actions will result in a fresh http request.

It's possible to retrieve values from the store synchronously via `getters`. For resources this is not normally advised (they may not yet have been fetched), however for items such as schema's is valid. Some of the core getters are defined in `/plugins/steve/getters.js`

```
$store.getters['<store type>/byId'](<resource type>, <id>])

$store.getters['<store type>/schemaFor'](<resource type>)`
```

## Error Handling

When catching exceptions thrown by anything that contacts the API use `utils/error exceptionToErrorsArray` to correctly parse the response into a commonly accepted array of errors

## Unauthenticated Endpoints

If you need to add an endpoint to an unauthenticated route for loading from the store before login, you will need to add it [here](https://github.com/rancher/rancher/blob/cb7de4e6c3d7e783828dc662b1142c1f9ae5edbe/pkg/multiclustermanager/routes.go#L69).


## Examining the Contents of a Resource

Due to the way Dashboard resources are constructed examining the contents of one can sometimes provide unexpected results. It's recommended to read the sections covering resource proxy and resource instance before continuing.

- When viewing the object via template `{{ resource }}` the `resource-instance.js` `toString` method will print out a basic interpretation
- When printing the object via console the resource's [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy) will be displayed. To make this simpler to view use `JSON.parse(JSON.stringify(<resource>))`.

> Q Why are my resource's `nameDisplay`, `description`, etc missing?
>
> A These are part of the common underlying `resource-instance.js` or, if the resource type has it, the type's own `model`.

## UI Components for Resource Types

The dashboard has a framework and set of components to support (conditional) representation of resource type/s. Common UI features include

- Collections of resources in a common table (Resource List). Usually shown when clicking on the side nav name type.
- Visual overview of a resource (Resource Detail). Usually shown when clicking on a List's row's name.
- Creating, Viewing and Editing a resource as a form (Resource Edit).
- Viewing and Editing a resource as YAML (Resource YAML)

By default only the table and, if enabled by the resource type, viewing/editing as YAML are enabled. To provide a richer experience the resource's table columns should be defined and custom overview and edit pages provided.

### Resource Lists

The top level list page is defined in `./components/ResourceList`. This displays a common masthead and table for the given resource type. Without any customisation the columns are restricted to a base set of `state`, `nameDisplay`, `namespace` and `ages`. More information can be found in function `/store/type-map.js headersFor`.

### Resource Detail Pages

The top level detail page is defined in `./components/ResourceDetail`. This is a container page that covers a number of resource instance use cases (create, edit, view, etc). Like resource list this contains a common `Masthead` and additionally a sub header `DetailTop` (displays common properties of resources such as description, labels, annotations, etc). For a resource type that provides no customisation it will mostly likely just display a way to view and edit the resource by YAML.

The Create/Edit Yaml experience is controlled by `/components/ResourceYaml.vue`. Other features are handled by custom components described below.

Special attention should be made of the `mode` and `as` params that's available via the `CreateEditView` mixin (as well as other helpful functionality). Changing these should change the behaviour of the resource details page (depending on the availability of resource type custom components).

For more information about CreateEditView and how to add new create/edit forms, see [Create/Edit Forms.](../create-edit-forms)

| `mode` | `as` | Content |
|------------|----------|-------|
| falsy | falsy | Shows the View YAML or Customised Detail component|
| falsy | `config` | Shows the View YAML or Customised Edit component (in read only mode)|
| `edit` | falsy | Shows the Customised Edit component|
| `edit` | `yaml` | Shows the Edit Yaml component|

In addition the Create process (assessable with the same url + `/create`) is also managed by the resource detail page with similar param options. 

| `mode` | `as` | Content |
|------------|----------|-------| 
| falsy | `yaml` | Show the Edit YAML component in create mode
| `edit` | falsy | Show the Customised Edit component in create mode
| `clone` | falsy | Shows the Customised Edit component in create mode pre-populated with an existing resource

### Customising Resource Detail Pages

A more detailed overview page can be added by creating a resource type component in `/detail/`. This should provide a more eye pleasing presentation than a collection of inputs or yaml blob.

