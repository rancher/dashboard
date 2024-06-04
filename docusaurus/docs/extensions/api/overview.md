# Extensions API

Rancher provides a set of APIs to Extension developers.

You can find an installable extension providing some usage examples of the Extensions API here: https://github.com/rancher/ui-plugin-examples.

## Extension API Support matrix

Here's the support matrix for every Extension API hook available in Rancher:

| API | Rancher Version support (Minimum version)|
| --- | --- |
| [Metadata](./metadata) | v2.7.0 |
| [Products](./nav/products) | v2.7.0 |
| [Routes](./nav/routing) | v2.7.0 |
| [Actions](./actions) | v2.7.2 |
| [Cards](./cards) | v2.7.2 |
| [Panels](./panels) | v2.7.2 |
| [Tabs](./tabs) | v2.7.2 |
| [Table Columns](./table-columns) | v2.7.2 |
| [Components](./components) | v2.7.0 |


## LocationConfig support matrix

The `LocationConfig` object is one of the keystones to define in which place in the UI a given Extension API hook should be applied to. For more information about it's usage check the documentation **[here](./common#locationconfig)**.

| Key | Rancher Version support (Minimum version)|
|---|---|
|`product`| `v2.7.2` | 
|`resource`| `v2.7.2` + `v2.8.0` (wildcard support)|
|`namespace`| `v2.7.2` |
|`path`| `v2.7.7` |
|`cluster`| `v2.7.2` |
|`id`| `v2.7.2` |
|`mode`| `v2.7.2` + `v2.7.7` (`create` mode) |
|`context`| `v2.7.2`|
| `queryParam`| `v2.7.2` |
|`hash`| `v2.8.0` |