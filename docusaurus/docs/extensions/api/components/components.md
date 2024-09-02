---
toc_max_heading_level: 4
---

# Components

Rancher uses dynamic components in the Dashboard UI. Extensions can register components for Rancher to discover and use. Components
are Vue components and similar to panels, but are used in a single specific context.

Components are added to Rancher via the `register` method.

## register

This method registers a component.

Method:

```ts
plugin.register(type: String, id: String, component: Function);
```

_Arguments_

| Name | Type | Description |
|---|---|---|
|`type`| String | Type of the component to register (indicates where the component is used)|
|`id`| String | Unique id for the component|
|`component`| Function | Vue Component|

### Component Types

The Rancher Dashboard provides the following standard component types:

| Type | Description |
|---|---|
|`detail`|Detail component for a given resource type|
|`edit`|Edit/Create/View component for a given resource type|
|`list`|List component for a given resource type|
|`cloud-credential`|Cloud credentials are components that add provider-specific UI to create cloud credentials, needed to provision clusters|
|`machine-config`|Machine configs components are used to add provider-specific UI to the rke2/k3s provisioning page|
