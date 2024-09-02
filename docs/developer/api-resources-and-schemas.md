# API

> &#x26a0;&#xfe0f; Documentation in this directory is intended for internal use only. Any information contained here is unsupported.

There are lots of different APIs available in Rancher, but the primary two are [Norman](https://github.com/rancher/norman) and [Steve](https://github.com/rancher/steve)

## Norman

Norman is older and mainly used by the [Ember UI](https://github.com/rancher/ui).  It presents an opinionated view of some of the common resources in a Kubernetes cluster, with lots of features to make the client's life easier.  Fields are renamed to be named more consistently, deeply-nested structures are flattened out somewhat, complicated multi-step interactions with the k8s API are orchestrated in the server and hidden from you, etc.  It attempts to bridge the gap from Rancher 1.x's usability, and is quite nice if it does what you need.  But _only_ the types that Norman supports are exposed, and you can _only_ interact with the resources in the namespaces assigned to a Project.  Types Norman doesn't know about and namespaces not assigned to a project are effectively invisible.

## Steve

Steve is newer, and the primary API used here.  It works in the opposite direction, starting with a completely unopinionated view of every resource available in a cluster, and then adding custom logic only where needed.  Every type and every namespace are directly addressable.  This still adds some critical functionality over directly talking to the k8s API, such as:

- It's presented following our [api-spec](https://github.com/rancher/api-spec), so the same client libraries work for any of our APIs, including the in-browser generic [api-ui](https://github.com/rancher/api-ui).
- "Watches" to find out when a resource changes are aggregated into a single websocket which keeps track of what's connected and can resume the stream, rather than many independent calls to the native k8s implementation
- The "counts" resource internally watches everything to keep track of how many of every type of resource there are in every namespace and state, which allows us to show all the types that are "in use" and how many there are in the left nav.
- Schemas and links on each resource efficiently identify what permissions the user making the request has, so that actions in the UI can be hidden or disabled if not allowed for the current user instead of letting them try and having the server reject it.
- Normalizing the different and sometimes inconsistent state/status/conditions data from resources into a single logical view of the world the UI can present.
- RPC-style actions to do more complicated workflows on the server side when appropriate

A key concept in Steve is that although the UI makes imperative calls to the Steve API, Steve is designed to capture all operations in Kubernetes resources. That means the only way to perform any operation with the Steve API is by requesting it to create or manipulate YAML files.

This is in contrast to the Norman API, which had a concept of 'actions' - imperative API calls that would perform an operation. For example, while Norman had defined an action to perform encryption key rotation, the only way to achieve the same result in Steve would be to update the provisioning cluster Kubernetes resource.

## Endpoints

In a production setup these are all handled natively by Rancher.  For development of dashboard, they are proxied to the Rancher install that the `API` environment variable points at.

| Endpoint                | Notes                                                                 |
| ----------------------- | --------------------------------------------------------------------- |
| `/v3`                   | Norman API                                                            |
| `/v3-public`            | Norman unauthenticated API (mostly for info required to login)        |
| `/v1`                   | Steve API for the management ("local") cluster                        |
| `/k8s/clusters/<id>`    | Proxy straight to the native k8s API for the given downstream cluster |
| `/k8s/clusters/<id>/v1` | Steve API for given downstream cluster via the server proxy           |

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

There are other factors that assist in this, namely values from the `type-map`.

## Exploring the API

The API serves up an interface to [browse both Norman and Steve APIs](https://github.com/rancher/api-ui). Both will list supported schemas and allow the user to fetch individual or collections of resources. The schemas will describe the actions executable against individual or collections of resource. For Norman it will also show fields that can be filtered on.

The dashboard will proxy requests to the API, so the interfaces are available via `<Dashboard URL>/v3` (Norman) and `<Dashboard URL>/v1` (Steve)

## Synching State

The high-level way the entire UI works is that API calls are made to load data from the server, and then a "watch" is started to notify us of changes so that information can be kept up to date at all times without polling or refreshing.  You can load a single resource by ID, an entire collection of all those resources, or something in between, and they should still stay up to date.  This works by having an array of a single authoritative copy of all the "known" models saved in the API stores (`management` & `cluster`) and updating the data when an event is received from the "subscribe" websocket.  The update is done on the _existing_ copy, so that anything that refers to it finds out that it changed through Vue's reactivity.  When manipulating models or collections of results from the API, some care is needed to make sure you are keeping that single copy and not making extras or turning a "live" array of models into a "dead" clone of it.

