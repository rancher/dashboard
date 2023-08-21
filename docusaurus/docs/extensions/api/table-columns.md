# Table Columns

Table Columns are added to Rancher via the `addTableColumn` method.

## addTableColumn

*(Rancher version v2.7.2)*

>**IMPORTANT NOTE:** on **Rancher version v2.8.0** we've introduced breaking changes to the behaviour of this extension enhancement (Table Columns). Previously, you would target the resource name of the table you were trying to extend, which was different from the usage of the [LocationConfig object](./common#locationconfig) in any of the other extension enhancements available. With these new changes, the [LocationConfig object](./common#locationconfig) will be used to target a specific page that contains a table and add it to that particular one, therefore having a better control of the new table column appearance.

This method adds a table column to a `ResourceTable` element-based table on the UI.

Method:

```ts
plugin.addTableColumn(where: String, when: LocationConfig, options: Object);
```

_Arguments_

`where` string parameter admissable values for this method:

| Key | Type | Description |
|---|---|---|
|`TableColumnLocation.RESOURCE`| String | Location for a table column on a Resource List View page |

<br/>

`when` Object admissable values:

`LocationConfig` as described above for the [LocationConfig object](./common#locationconfig).

<br/>
<br/>

### TableColumnLocation.RESOURCE options

![Table Col](../screenshots/table-cols.png)

`options` config object. Admissable parameters for the `options` with `'TableColumnLocation.RESOURCE'` are:

| Key | Type | Description |
|---|---|---|
|`name`| String | Label for column |
|`labelKey`| String | Same as "name" but allows for translation. Will superseed "name" |
|`value`| String | Object property to obtain the value from |
|`getValue`| Fuction | Same as "value", but it can be a function. Will superseed "value" |
|`width`| Int | Column width (in `px`). Optional |
|`sort`| Array | Object properties to be bound to the table sorting. Optional |
|`search`| Array | Object properties to be bound to the table search. Optional |

Usage example for `'TableColumnLocation.RESOURCE'`:

```ts
plugin.addTableColumn(
  TableColumnLocation.RESOURCE,
  { resource: ['configmap'] },
  {
    name:     'some-prop-col',
    labelKey: 'generic.comingSoon',
    getValue: (row: any) => {
      return `${ row.id }-DEMO-COL-STRING-ADDED!`;
    },
    width: 100,
    sort: ['stateSort', 'nameSort'],
    search: ['stateSort', 'nameSort'],
  }
);
```