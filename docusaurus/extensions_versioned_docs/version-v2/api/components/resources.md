# Resource Views

Rancher uses a standard mechanism for rendering views for Kubernetes Resources (such as Pods, Secrets as well as Custom Resources).

Rancher will present standard views for Custom Resources without any custom UI, showing a list of resources with a basic column set
and the ability to view and edit the resource YAML.

Extensions can register components to provide custom UI for a given resource type.

## List View

An extension can override the list view for a given resource type using the `list` component type.

e.g.

```ts
  plugin.register('list', ID, VueComponent);
```

where `ID` is the unique id of the resource type and `VueComponent` is the component to use.

## Detail View

An extension can override the detail view for a given resource type using the `detail` component type.

e.g.

```ts
  plugin.register('detail', ID, VueComponent);
```

where `ID` is the unique id of the resource type and `VueComponent` is the component to use.

## Edit/Config View

An extension can override the edit/config view for a given resource type using the `edit` component type.

> Note: The edit view is used for both creating and editing the resource as well as for viewing the resource configuration. The component is passed a `mode` property which indicates to the component which mode (edit/create/view) the component is being used in.

e.g.

```ts
  plugin.register('edit', ID, VueComponent);
```

where `ID` is the unique id of the resource type and `VueComponent` is the component to use.
