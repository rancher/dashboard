# Table Columns

Table Columns are added to Rancher via the `addTableColumn` method.

## addTableColumn

*(From Rancher version v2.7.2)*

This method adds a table column to a `ResourceTable` element-based table on the UI.

Method:

```ts
plugin.addTableColumn(where: String, when: LocationConfig, column: TableColumn);
```

_Arguments_

`where` string parameter admissible values for this method:

| Key | Type | Rancher Version | Description |
|---|---|---|---|
|`TableColumnLocation.RESOURCE`| String | v2.7.2 | Location for a table column on a Resource List View page |

<br/>

`when` Object admissible values:

`LocationConfig` as described above for the [LocationConfig object](./common#locationconfig).

*(**From Rancher version v2.13.0**)*

An addition parameter can be provided which will be used to support the column when server-side pagination is enabled. For more information and other changes required to server-side pagination see [here](../performance/scaling/lists.md).

*(**From Rancher version v2.14.0**)*

when adding a new column to a table on Rancher Dashboard, the default is for the table column to be added just before the `Age` column. 

There's a new property in the configuration object called `weight`, on which you can specify in which position you want to add the column to. Position `0` will be the first in the table columns order.

```ts
plugin.addTableColumn(where: String, when: LocationConfig, column: TableColumn, paginationColumn?: PaginationTableColumn);
```

### TableColumnLocation.RESOURCE column

*(From Rancher version v2.7.2)*

![Table Col](../screenshots/table-cols.png)

`column` config object. Admissible parameters for the `column` with `'TableColumnLocation.RESOURCE'` are:

| Key | Type | Description |
|---|---|---|
|`name`| String | Label for column |
|`weight` *(From Rancher version v2.14.0)* | Int | Order/position of the table column added inside a table |
|`labelKey`| String | Same as "name" but allows for translation. Will supersede "name" |
|`value`| String | Object property to obtain the value from |
|`getValue`| Function | Same as "value", but it can be a function. Will supersede "value" |
|`width`| Int | Column width (in `px`). Optional |
|`sort`| boolean,string,Array | Object properties to be bound to the table sorting. Optional |
|`search`| boolean,string,Array | Object properties to be bound to the table search. Optional |
| `formatter`| string | Name of a `formatter` component used to render the cell. Components should be in the extension `formatters` folder
| `formatterOpts`| any | Provide additional values to the `formatter` component via a `formatterOpts` component param

Usage example for `'TableColumnLocation.RESOURCE'`:

```ts
plugin.addTableColumn(
  TableColumnLocation.RESOURCE,
  { resource: ['configmap'] },
  {
    name:     'some-prop-col',
    labelKey: 'generic.comingSoon',
    weight: 2,
    getValue: (row: any) => {
      return `${ row.id }-DEMO-COL-STRING-ADDED!`;
    },
    width: 100,
    sort: ['stateSort', 'nameSort'],
    search: ['stateSort', 'nameSort'],
  }
);
```