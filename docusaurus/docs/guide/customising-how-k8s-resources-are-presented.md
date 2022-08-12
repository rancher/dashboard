---
sidebar_label: Customizing Kubernetes Resources
---

# Customizing how Kubernetes Resources are Presented

These are where you do most of the daily work of customizing of how a particular k8s resource is presented.

| Path   | Used for                                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------ |
| config | Configuration of how products look and work; constants for labels, types, cookies, query params, etc that are used |
| chart  | Custom components to present when installing a Product chart                                                       |
| detail | Custom components to show as the detail view for a particular resource instance                                    |
| edit   | Custom components to show as the edit (or view config) view for a particular resource instance                     |
| list   | Custom components to show as the list view for a resource type                                                     |
| models | Custom logic extending the standard resource class for each API type and model returned by the API                 |

There is one `Config` entry for each "product", which are the result of installing one of our helm charts to add a feature into Rancher such as Istio, monitoring, logging, CIS scans, etc.  The config defines things like:
  - The condition for when that product should appear (usually the presence of a type in a certain k8s API group)
  - What types should appear in the left nav, how they're labeled, grouped, ordered
  - Custom table headers for each type

Helm charts have a generic installer control which lets you edit their `values.yaml` by default.  To present a custom form for the user to configure a chart (especially the ones for our products), you create a matching `chart/<name>.vue` component, where the name corresponds to the `catalog.cattle.io/ui-component` annotation's value on the chart.

Similarly, instead of a generic YAML detail or edit screen, you can provide your own component for any type in `detail/<type>.vue` or `edit/<type>.vue`.  Detail components should generally use the `<ResourceTabs>` component to show the standard detail tabs + any specific ones you want to define.  Edit components similarly generally use `<CruResource>`.

To customize the list view for a type, you can either change the header definitions (in `config/`) or provide a `list/<type>.vue` component to use instead of the standard one.

All objects returned from the API have a base-class of Resource, and extend from one of 3 sub-classes:
  - SteveModel: For regular resources accessed through the Steve API (/v1)
  - HybridModel For Rancher-defined resources with non-standard behaviors (e.g. name and description at the top-level) accessed through Steve (/v1).  Primarily `management.cattle.io.*`.
  - NormanModel: For Rancher-defined resources accessed through the older Norman API (/v3)

Additional customization can be done on a per-type basis by defining a `models/<type>.js`.

All `<type>`s throughout are the **lowercased** version of the k8s API group and kind, such as `apps.deployment`.  Lowercase won't matter in case-insensitive macOS but will break when built in CI or on Linux.  Use the "Jump" menu in the UI to find the type you want and then copy the string out of the URL.


# Customising Default Table Columns

Customising columns and actions in a table can be done via changing the resources type's configuration. This is found in either the product's configuration or the resource types `model`, read on for more details. At this level the default `ResourceList` component is used and no additional pages have to be defined. T

More complicated customisation can be done via overriding the ResourceList component with a per resource type component defined in `/list`, e.g. `/list/catalog.cattle.io.app.vue` is used whenever the user clicks on the side nav for the Apps type. These components replace `ResourceList` but often use the same underlying table component `/components/ResourceTable`.

Table column definitions can be found in `/config/table-headers.js`. Common columns should be added here, list override specific types can be defined in the component.

```ts
export const SIMPLE_NAME = {
  name:     'name',
  labelKey: 'tableHeaders.simpleName',
  value:    'name',
  sort:     ['name'],
  width:    200
};
```

Column definitions will determine what is shown in it's section of the row. This will either be a property from the row (`value`), a component (`formatter`, which links to a component in `/components/formatter`) or an inline formatter (defined in the `ResourceTables` contents, see example below, requires custom list component). 

``` html
<ResourceTable ...>
  <template #cell:workspace="{row}">
    <span v-if="row.type !== MANAGEMENT_CLUSTER && row.metadata.namespace">{{ row.metadata.namespace }}</span>
    <span v-else class="text-muted">&mdash;</span>
  </template>
</ResourceTable>
```

Column definitions are grouped together and applied per resource type via `/store/type-map.js headers`. 

```ts
headers(CONFIG_MAP, [NAME_COL, NAMESPACE_COL, KEYS, AGE]);
```

When providing a custom list these default headers can be accessed via 

```ts
$store.getters['type-map/headersFor'](<schema>)
```

The actions menu for a table row is constructed from the actions returned via the resource type. Therefore the base list comes from the common `resource-instance` which can be supplemented/overridden by the resource type's `model`. Individual actions can be marked as `bulkable`, which means they are shown as buttons above the list and applied to all selected rows.

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
