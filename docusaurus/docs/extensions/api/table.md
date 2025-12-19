# Table

Table extension points in Rancher Dashboard.

## addTableHook

*(Rancher version v2.14.0)*

This method adds a hook to a `ResourceTable` element-based table on the UI. This allows to react to table events like changing page, sorting or filtering.

Method:

```ts
plugin.addTableHook(where: String, when: LocationConfig, action: TableAction);
```

_Arguments_

`where` string parameter admissible values for this method:

| Key | Type | Description |
|---|---|---|
|`TableLocation.RESOURCE`| String | Location for a table on a Resource List View page |

<br/>

`when` Object admissible values:

`LocationConfig` as described above for the [LocationConfig object](./common#locationconfig).

### TableLocation.RESOURCE action

`action` config object. Admissible parameters for the `action` with `'TableLocation.RESOURCE'` are:

| Key | Type | Description |
|---|---|---|
|`tableHook`| String | Callback function when a table action like changing page, sorting or filtering is triggered

Usage example for `'TableLocation.RESOURCE'`:

```ts
plugin.addTableHook(
  TableLocation.RESOURCE,
  { resource: ['pod'] },
  {
    tableHook: (arg: any) => {
      console.error('TABLE HOOK TRIGGERED', arg);
    }
  }
);
```