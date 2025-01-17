# Creating and Fetching Resources

Most of the options to create and fetch resources can be achieved via dispatching actions defined in `/plugins/dashboard-store/actions.js`

The most basic operations are `find({type, id})` to load a single resource by ID, `findAll({type})` load all of them.  These (anything starting with `find`) are async calls to the API.  Getters like `all(type)` and `byId(type, id)` are synchronous and return only info that has already been previously loaded.  See `plugins/dashboard-store/` for all the available actions and getters.

| Function       | Action                                                                                                               | Example Command                                                                                             | Description                                                                                                                                                                             |
| -------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `create`       | Create                                                                                                               | `$store.$dispatch('<store type>/create', <new object>)`                                                     | Creates a new Proxy object of the required type (`type` property must be included in the new object)                                                                                    |
| `clone`        | Clone                                                                                                                | `$store.$dispatch('<store type>/clone', { resource: <existing object> })`                                   | Performs a deep clone and creates a proxy from it                                                                                                                                       |
| `findAll`      | Fetch all of a resource type and watch for changes to the returned resources so that the list updates as it changes. | `$store.dispatch('<store type>/findAll', { type: <resource type> })`                                        | Fetches all resources of the given type. Also, when applicable, will register the type for automatic updates. If the type has already been fetched return the local cached list instead |
| `find`         | Fetch a resource by ID and watch for changes to that individual resource.                                            | `$store.dispatch('<store type>/find', { type: <resource type>, id: <resource id> })`                        | Finds the resource matching the ID. If the type has already been fetched return the local cached instance.                                                                              |
| `findMatching` | Fetch resources by label and watch for changes to the returned resources, a live array that updates as it changes.   | `$store.dispatch('<store type>/findMatching', { type: <resource type>, selector: <label name:value map> })` | Fetches resources that have `metadata.labels` matching that of the name-value properties in the selector. Does not support match expressions.                                           |

Once objects of most types are fetched they will be automatically updated. See [Watching Resources](#watching-resources) for more info. For some types this does not happen. For those cases, or when an immediate update is required, adding `force: true` to the `find` style actions will result in a fresh http request.

## Synchronous Fetching

It's possible to retrieve values from the store synchronously via `getters`. For resources this is not normally advised (they may not yet have been fetched), however for items such as schemas, it is valid. Some of the core getters are defined in `/plugins/dashboard-store/getters.js`:

```ts
$store.getters['<store type>/byId'](<resource type>, <id>])

$store.getters['<store type>/schemaFor'](<resource type>)`
```

The `all`, `byId` and `matching` getters are equivalents of the asynchronous `findAll`, `find` and `findMatching`, respectively.

## Watching Resources

For each Vuex Store a websocket connection is created. When requesting resources associated with that store a watch will be started via the socket connection. For example:

- If you `findAll` Pods, Rancher will watch all Pods after that.
- if you get an individual resource using `findMatching`, it will watch a particular resource with that ID in a namespace.

If you already called `findAll` for a resource, then do `findMatching`, no additional Pods would be watched because all of the Pod resources are already being watched. The subscribe call uses `equivalentWatch` to detect duplicate watches so that it won't send another request to watch the subset of resources that were already loaded previously.

The `unsubscribe` function is used to unwatch resources. However, as a general rule, resources are never unwatched because Rancher assumes that any data you have already loaded needs to be kept up-to-date.

The code related to watching resources is in `plugins/steve/subscribe.js`.

### Pinging

The UI normally has three websocket connections with `rancher` (Steve's global cluster management), `management` (Norman) and `cluster` (Steve for an individual cluster). The UI is pinged by Steve every five seconds and by Norman every thirty seconds. Steve's messages send the server version they are sent from, which sends another action and reloads the page if the server has been upgraded.

To avoid excessive rerendering, the messages that change state, such as `resource.{create, change, remove}`, are saved in a buffer. Once per second they are all flushed together to update the store.