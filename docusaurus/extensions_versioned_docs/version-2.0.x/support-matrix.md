# Support matrixes

## Shell support matrix

The Shell package enables Extensions to integrate with Rancher.  
It's important to know which version of the Shell package is compatible with each Rancher version:

| | Rancher 2.7.x | Rancher 2.8.x <br/> (Extensions API V1) | Rancher 2.9.x <br/> (Extensions API V2) | Rancher 2.10.x <br/> (Extensions API V3) |
|---|---|---|---|---|
|Shell **0.3.8**|Supported|Limited support|Not supported|Not supported|
|Shell 0.5.3/**1.2.3**|Limited support|Supported|Not supported|Not supported|
|Shell **2.0.1**|Not supported|Not supported|Supported|Not supported|
|Shell **3.0.0**|Not supported|Not supported|Not supported|Supported|

To know more about the Shell package versioning take a look at the diagram [here](./rancher-2.9-support).

## Extension API support matrix

Here's the support matrix for every Extension API hook available in Rancher:

| API | Rancher Version support (Minimum version)|
| --- | --- |
| [Metadata](./api/metadata) | v2.7.0 |
| [Products](./api/nav/products) | v2.7.0 |
| [Routes](./api/nav/routing) | v2.7.0 |
| [Actions](./api/actions) | v2.7.2 |
| [Cards](./api/cards) | v2.7.2 |
| [Panels](./api/panels) | v2.7.2 |
| [Tabs](./api/tabs) | v2.7.2 |
| [Table Columns](./api/table-columns) | v2.7.2 |
| [Components](./api/components) | v2.7.0 |


## LocationConfig support matrix

The `LocationConfig` object is one of the keystones to define in which place in the UI a given Extension API hook should be applied to. For more information about it's usage and support matrix check the documentation **[here](./api/common#locationconfig)**.