---
sidebar_label: Customizing Kubernetes Resources
---

# Customizing how Kubernetes Resources are Presented

## Type-specific Folders
These are where you do most of the daily work of customizing of how a particular k8s resource is presented. All `<type>`s throughout are the **lowercased** version of the k8s API group and kind, such as `apps.deployment`.  Lowercase won't matter in case-insensitive macOS but will break when built in CI or on Linux.  Use the "Jump" menu in the UI to find the type you want and then copy the string out of the URL.

| Path   | Used for                                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------ |
| config | Configuration of how products look and work; constants for labels, types, cookies, query params, etc that are used |
| detail | Custom components to show as the detail view for a particular resource instance                                    |
| edit   | Custom components to show as the edit (or view config) view for a particular resource instance                     |
| list   | Custom components to show as the list view for a resource type                                                     |
| models | Custom logic extending the standard resource class for each API type and model returned by the API                 |

### Config
Product configuration should precede everything else outlined in this guide as it determines which kubernetes resources are shown to the user and how they are grouped. There is one `config` entry for each "product", which defines things like:
  - The condition for when that product should appear (usually the presence of a type in a certain k8s API group)
  - What types should appear in the left nav, how they're labeled, grouped, ordered
  - Custom table headers for each type
Read more about products [here](../products-and-navigation.md).

### Detail and Edit
Kubernetes resources added to the side nav during product configuration will, by default, have list, edit-as-yaml and view-as-yaml pages, as well as some standard table/kebab menu actions (edit, clone, delete, etc) as outlined in `plugins/dashboard-store/resource-instance.js`. These views can be customized using components with the resource's name in the `list`, `detail`, and `edit` directories. Custom detail and edit components are nested within the `ResourceDetail` component.  Custom `detail` and `edit` components have a few props available: value, doneParams, doneRoute, mode, initialValue, liveValue, and realValue.  Detail components should generally use the `ResourceTabs` component to show the standard detail tabs as well as any specific ones you want to define.  Edit components similarly generally use `CruResource`.

### List
Resource lists can be customized a few different ways, one of which is to add a resource-specific component to the `list` directory. These components are nested within `ResourceList`. Table columns, and each cell's component, can be customized other ways. When providing a custom list the resource's default headers (defined in the product config) can be accessed via 

```ts
$store.getters['type-map/headersFor'](<schema>)
```

`list` components are generally created to either: load resource-specific extra data up front, expand on page functionality outside the table, or use the table's slots to add additional content within the table, eg custom cells: 

``` html
<ResourceTable ...>
  <template #cell:workspace="{row}">
    <span v-if="row.type !== MANAGEMENT_CLUSTER && row.metadata.namespace">{{ row.metadata.namespace }}</span>
    <span v-else class="text-muted">&mdash;</span>
  </template>
</ResourceTable>
```




If all you need to do is change table headers or use a particular component for a partiuclar column, that should be done during product configuration.

### Models

All objects returned from the API have a base-class of Resource, and extend from one of 3 sub-classes:
  - SteveModel: For regular resources accessed through the Steve API (/v1)
  - HybridModel For Rancher-defined resources with non-standard behaviors (e.g. name and description at the top-level) accessed through Steve (/v1).  Primarily `management.cattle.io.*`.
  - NormanModel: For Rancher-defined resources accessed through the older Norman API (/v3)

Additional customization can be done on a per-type basis by defining a `models/<type>.js`.

## Customising Tables
The which table columns to show for a given type are defined in the product config, using the `headers` function. (If no additional configuration is defined for a resource, table headers are taken from the schema) 

```ts
headers(CONFIG_MAP, [NAME_COL, NAMESPACE_COL, KEYS, AGE]);
```
Where the first argument is the resource type, and the second is an array of table column definitions. 

Common table column definitions can be found in `/config/table-headers.js`. If a column is specific to one type, it may be defined in-place in the product config instead. These definitions determine some basic positioning, which data should be used in the column, what component should be used in each cell, and how to sort the column. What's shown in the row will either be a property from the row (`value`) or a component (`formatter`, which links to a component in `/components/formatter` or `<plugin dir>/formatters`), or overriden using a custom list component and ResourceTable slots (see example above).

```ts
export const STATE = {
  name:      'state',
  labelKey:  'tableHeaders.state',
  sort:      ['stateSort', 'nameSort'],
  value:     'stateDisplay',
  getValue:  row => row.stateDisplay,
  width:     100,
  default:   'unknown',
  formatter: 'BadgeStateFormatter',
};
```

### Formatters
Formatters are used for any table content beyond plain text. Consequently, there are many existing formatters already defined in `shell/components/formatter` and examples of how to use them. Formatters are given `value`, `row`, and `col` props: `value` is as it is defined in `headers`, `row` is the current resource, and `col` is the column definition. 


### Actions
The actions menu for a table row is constructed from the actions returned via the resource class' `availableActions` property. Therefore the base list comes from the common `resource-instance` which can be supplemented/overridden by the resource type's `model`. Individual actions can be marked as `bulkable`, which means they are shown as buttons above the list and applied to all selected rows that also have the action enabled.

```ts
{
  action:     'promptRemove',
  altAction:  'remove',
  label:      this.t('action.remove'),
  icon:       'icon icon-trash',
  bulkable:   true,
  enabled:    this.canDelete,
  bulkAction: 'promptRemove',
}
```
