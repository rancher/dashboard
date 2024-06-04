# Sortable Table

The SortableTable component provides a rich list UI component.

## Delayed loading

Sortable Table supports columns with delayed loading.

A column can be declared as such by adding the property `delayLoading: true` to the column definition.

The Component being rendered for the column must support the `startDelayedLoading` method - this will be called on the component (with the value `true`)
whtn the table is ready for the component to render itself.

The Sortable Table will delay the loading of delay-loaded columns until the table has initially rendered and then will only ask the visible
components in view to render themselves - it does this in batches until all visible columns aer updated.

When the user scrolls the page and other columns become visible, Sortable Table will ensure that these are rendered.

Typically a delayed component would initally not render itself at all - or render a simple indicator that the content has not loaded. When its
`startDelayedLoading` method is called, it will then render its full content, fetching data as needed etc,


### Table header

There are two ways table headers are populated:

- Custom header: You can create a customized header for the sortable table by defining it in the appropriate configuration file under shell/config/product folder. Read more [how to create custom table headers](./customising-how-k8s-resources-are-presented#customising-tables) for each type.

- Header coming from Schema: If table data is coming from Schema, headers are dynamically populated by the Schema data. For the Internationalization make sure to add table headers locale key in translations YAML files.

