# Customising Default Table Columns

Customising columns and actions in a table can be done via changing the resources type's configuration. This is found in either the product's configuration or the resource types `model`, read on for more details. At this level the default `ResourceList` component is used and no additional pages have to be defined. T

More complicated customisation can be done via overriding the ResourceList component with a per resource type component defined in `/list`, e.g. `/list/catalog.cattle.io.app.vue` is used whenever the user clicks on the side nav for the Apps type. These components replace `ResourceList` but often use the same underlying table component `/components/ResourceTable`.

Table column definitions can be found in `/config/table-headers.js`. Common columns should be added here, list override specific types can be defined in the component.

```
export const SIMPLE_NAME = {
  name:     'name',
  labelKey: 'tableHeaders.simpleName',
  value:    'name',
  sort:     ['name'],
  width:    200
};
```

Column definitions will determine what is shown in it's section of the row. This will either be a property from the row (`value`), a component (`formatter`, which links to a component in `/components/formatter`) or an inline formatter (defined in the `ResourceTables` contents, see example below, requires custom list component). 

``` 
<ResourceTable ...>
  <template #cell:workspace="{row}">
    <span v-if="row.type !== MANAGEMENT_CLUSTER && row.metadata.namespace">{{ row.metadata.namespace }}</span>
    <span v-else class="text-muted">&mdash;</span>
  </template>
</ResourceTable>
```

Column definitions are grouped together and applied per resource type via `/store/type-map.js headers`. 

```
headers(CONFIG_MAP, [NAME_COL, NAMESPACE_COL, KEYS, AGE]);
```

When providing a custom list these default headers can be accessed via 

```
$store.getters['type-map/headersFor'](<schema>)
```

The actions menu for a table row is constructed from the actions returned via the resource type. Therefore the base list comes from the common `resource-instance` which can be supplemented/overridden by the resource type's `model`. Individual actions can be marked as `bulkable`, which means they are shown as buttons above the list and applied to all selected rows.

```
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
