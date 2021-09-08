# Development

This is part of the developer [getting started guide](./README.md). 

## API
See [APIs](../../../README.md#apis).

The older Norman API is served on `/v3`. The newer Steve API (see [here](https://github.com/rancher/api-spec/blob/master/specification.md) for spec) is served on `/v1` .

In both cases the schemas returned dictate 
- Which resources are shown
- What operations (create, update, delete, etc) can be made against resource/s
- What actions (archive, change password, etc) can be made against resource/s

In addition the resources themselves can dictate 
- What actions can be made against the collection

The above, plus other factors, will effect what is shown by the UI
- Resources in the cluster explorer
- Edit resource buttons
- Delete resource
- etc

There are other factors that assist in this, namely values from the `type-map`. More details can be found throughout this document.

> When catching exceptions thrown by anything that contacts the API use `utils/error exceptionToErrorsArray` to correctly parse the response into a commonly accepted array of errors

## Store
State is cached locally via [Vuex](https://vuex.vuejs.org/). See the Model section for retrieving information from the store.

See [README#vuex-stores](../../../README.md#what-is-it) for the basics. The most important concepts are described first i.e. the three store parts `management`, `cluster` and `rancher`. These sections contain schema information for each supported type and, per type, the resource instance and list data. 

Store objects are accessed in different ways, below are common ways they are referenced by models and components

|Location|type|object|example|
|----|----|----|----|
| `/model/<resource type>` | Dispatching Actions | `this.$dispatch` | `this.$dispatch('cluster/find', { type: WORKLOAD_TYPES.JOB, id: relationship.toId }, { root: true })`
| `/model/<resource type>` | Access getters (store type) | `this.$getters` | `this.$getters['schemaFor'](this.type)`
| `/model/<resource type>` | Access getters (all) | `this.$rootGetters` | `this.$rootGetters['productId']`
| component | Dispatching Actions | `this.$store.dispatch` | ``this.$store.dispatch(`${ inStore }/find`, { type: row.type, id: row.id })``
| component | Access getters | `this.$store.getters` | `this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.value)`

> Prefixing a property in a model with `$`, as per `model` rows above, results in calling properties on the store object directly. For further details on resources, proxy's and types see further below in this doc.

> Troubleshooting: Fetching the name of a resource type
>
> Good - Trims the text and respects `.` in path to type's string - `store.getters['type-map/labelFor']({ id: NORMAN.SPOOFED.GROUP_PRINCIPAL }, 2)`
>
> Bad - Does not trim text, issues when resource type contains "`.`" - ``store.getters['i18n/t'](`typeLabel.${ NORMAN.SPOOFED.GROUP_PRINCIPAL }`, { count: 2 })``

## Resources
A resource is an instance of a schema e.g. the `admin` user is an instance of type `management.cattle.io.user` from the `Steve` API. 

### Schemas
Schemas are provided in bulk via the APIs and cached locally in the relevant store (`management`, `rancher`, etc).

A schema can be fetched synchronously via store getter

```
import { POD } from '@/config/types';

this.$store.getters['cluster/schemaFor'](POD)`
```

> Troubleshooting: Cannot find new schema
> 
> Ensure that your schema text in `/config/types.js` is singular, not plural

As mentioned before a schema dictates the functionality available to that type and what is shown for the type in the UI.

### Virtual and Spoofed Resource Types

The side nav is populated by resource types that have been applied to the current product. Virtual Types are a way to add additional menu items. These are purely for adding navigation and do not support tables or details views. Examples of virtual types can be found by searching for `virtualType`. For instance the `Users & Authentication` product has a virtual type of 'config' to show the `Auth Providers` page.

Spoofed Types, like virtual types, add menu items but also define a spoofed schema and a `getInstances` function. The latter provides a list of objects of the spoofed type. This allows the app to then make use of the generic list, detail, edit, etc pages used for standard types.

> Any resources returned by `getInstances` should have a `kind` matching required type. This results in the tables showing the correct actions, handling create/edit, etc.


### Model Architecture

There are two types of models used to represent resources: proxy models and ES6 class models. In both cases, the models apply properties and methods to the resource, which defines how the resource can function in the UI and what other components can do with it. Different APIs return models in different structures, but the implementation of the models allows some common functionality to be available for any of them, such as `someModel.name`, `someModel.description`, `setLabels` or `setAnnotations`.

Originally only [proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) models were used. In September 2021, class-based model support was added to increase performance because proxies were about 1/100th the speed of native property access in Firefox and Safari.

In the `models` directory, the proxy-based models are the `.js` files and the class-based models end in `.class.js`.

Much of the reused functionality for each model is taken from the Steve plugin. The proxy-based models use functionality from `plugins/steve/resource-instance.js`, while the class-based models use functionality from `plugins/steve/resource-class.js`. Those two files share a lot of duplicated functionality, and if one is changed, the other probably needs to be changed to match until we drop support for proxy-based models.

The `Resource` class in `plugins/steve/resource-class.js` should not have any fields defined that conflict with any key ever returned by the APIs (e.g. name, description, state, etc used to be a problem). The `SteveModel` (`plugins/steve/steve-class.js`) and `NormanModel` (`plugins/steve/norman-class.js`) know how to handle those keys separately now, so the computed name/description/etc is only in the Steve implementation. It is no longer needed to use names like `_name` to avoid naming conflicts.

### Proxy Models

For proxy models, when resources are retrieved from the store they will be wrapped in a Proxy object - `/plugins/steve/resource-proxy.js`. This exposes common properties and functions from `/plugins/steve/resource-instance.js`. These can be overridden per resource type via optional files in `/models`. For example the `nameDisplay` value for the type `management.cattle.io.user` avoids using the `nameDisplay` from `resource-instance` by adding a `nameDisplay` function to `/models/management.cattle.io.user.js`.

To avoid naming conflicts with fields defined on models that come in from an API, some fields were renamed to `_name` or similar because a property on a model couldn't override the getter defined in the proxy.

> As resources are proxy instances spreading (`{ ...<resource>}`) will not work as expected. In such cases it's normally better to first `clone` (see below) and then make the required changes.

Common functionality provided by `resource-instance` includes information on how to display common properties, capabilities of the resource type and actions to execute such as `save`, `remove`, `goToEdit`

```

<user object>.save();

<project object>.remove();

<role binding object>.goToEdit();

```

> Note the `toString` property in `resource-instance`. This will change how the object is presented via console.log, etc. Read on to understand other ways to view resource properties.


### Converting Proxy Models to Class Models

To convert models from a proxy-based implementation to a class implementation, properties structured like this:

```
property() {
  ...
}
```
should be changed to:
```
get property() {
  ....
}
```
and 
```
methods() {
  return () => {
    ...
  }
}
```
should be converted to:
```
method() {
  ...
}
```
Examples of the conversion are in [this PR](https://github.com/rancher/dashboard/pull/4153), which converted some of the high-volume models. The rest should be converted as well.

### Extending Models

The `Resource` class in `plugins/steve/resource-class.js` is the base class for everything and should not be directly extended. (There is a proxy-based counterpart of `Resource` which is the default export from `plugins/steve/resource-instance.js` as well.) If a model needs to extend the basic functionality of a resource, it should extend one of these three models:

- `NormanModel`: For a Rancher management type being loaded via the Norman API (/v3, the Rancher store). These have names, descriptions and labels at the root of the object. 
- `HybridModel`: This model is used for old Rancher types, such as a Project (mostly in management.cattle.io), that are loaded with the Steve API (/v1, the cluster/management stores). These have the name and description at the root, but labels under metadata.
- `SteveModel`: Use this model for normal Kubernetes types such as workloads and secrets. The name, description and labels are under metadata.

The Norman and Hybrid models extend the basic Resource class. The Hybrid model is extended by the Steve model.

### Create and Fetch Resource/s

Most of the options to create and fetch resources can be achieved via dispatching actions defined in `/plugins/steve/actions.js`

| Action| Example Command | Description |
|--------|-------|-----|
| Create | `$store.$dispatch('<store type>/create', <new object>)`| Creates a new Proxy object of the required type (`type` property must be included in the new object) |
| Clone | `$store.$dispatch('<store type>/clone', { resource: <existing object> })` | Performs a deep clone and creates a proxy from it |
| Fetch all of a resource type | `$store.dispatch('<store type>/findAll', { type: <resource type> })` | Fetches all resources of the given type. Also, when applicable, will register the type for automatic updates. If the type has already been fetched return the local cached list instead |
| Fetch a resource by ID | `$store.dispatch('<store type>/find', { type: <resource type>, id: <resource id> })` | Finds the resource matching the ID. If the type has already been fetched return the local cached instance. |
| Fetch resources by label | `$store.dispatch('<store type>/findMatching', { type: <resource type>, selector: <label name:value map> })` | Fetches resources that have `metadata.labels` matching that of the name-value properties in the selector |

> Once objects of most types are fetched they will be automatically updated. See [README#synching-state](../../../README.md#synching-state) for more info. For some types this does not happen. For those cases, or when an immediate update is required, adding `force: true` to the `find` style actions will result in a fresh http request.

It's possible to retrieve values from the store synchronously via `getters`. For resources this is not normally advised (they may not yet have been fetched), however for items such as schema's is valid. Some of the core getters are defined in `/plugins/steve/getters.js`

```
$store.getters['<store type>/byId'](<resource type>, <id>])

$store.getters['<store type>/schemaFor'](<resource type>)`
```

## SSR - Transferring store and component state from server to client

SSR causes certain NUXT component functions to execute server side, for example `async fetch`, `asyncData` and `nuxtServerInit`. State returned by these and the core Vuex store is transferred back to the client by the `window.__NUXT__` property. As these contain resources that should be Proxy objects the Dashboard rehydrates them as such via `plugins/steve/index.js`. There you can see any resource tagged with `__rehydrate` or array with  `__rehydrateAll__<x>` will be converted into back into a Proxy object in the client.

## Products & Side Nav
Products are top level features that are reached via the header top left menu. Some are built in (`Cluster Explorer`, `Apps`, `Users & Authentication`) and some are enabled after installing the required helm charts via `Apps` (see 'Rancher' charts in the `Charts` page ).

Configuration for each product can be found in `/config/product`. These define the product itself, menu items in side nav, spoofed types, etc. These settings are stored in the `type-map` section of the store and manipulated with functions in `/store/type-map.js`. Some stand out functions include

- `basicType` - Defines a type or group of types that will show in the side nav
-  `weightGroup`/`weightType` - Set the position of the group/tye for this product. Pay attention to the `forBasic` boolean which should be true if the menu item is classed as basic.
- `configureType` - Provider/Override UI features for the type (is creatable, show state in header/table, etc). These are accessible via the `type-map/optionsFor` action

> There's some docs for these functions are the top of the `type-map.js` file

## UI Components for Resource Types

The dashboard has a framework and set of components to support (conditional) representation of resource type/s. Common UI features include

- Collections of resources in a common table (Resource List). Usually shown when clicking on the side nav name type.
- Visual overview of a resource (Resource Detail). Usually shown when clicking on a List's row's name.
- Creating, Viewing and Editing a resource as a form (Resource Edit).
- Viewing and Editing a resource as YAML (Resource YAML)

By default only the table and, if enabled by the resource type, viewing/editing as YAML are enabled. To provide a richer experience the resource's table columns should be defined and custom overview and edit pages provided.

### Resource List

The top level list page is defined in `./components/ResourceList`. This displays a common masthead and table for the given resource type. Without any customisation the columns are restricted to a base set of `state`, `nameDisplay`, `namespace` and `ages`. More information can be found in function `/store/type-map.js headersFor`.


#### Customisation
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

### Resource Detail

The top level detail page is defined in `./components/ResourceDetail`. This is a container page that covers a number of resource instance use cases (create, edit, view, etc). Like resource list this contains a common `Masthead` and additionally a sub header `DetailTop` (displays common properties of resources such as description, labels, annotations, etc). For a resource type that provides no customisation it will mostly likely just display a way to view and edit the resource by YAML.

The Create/Edit Yaml experience is controlled by `/components/ResourceYaml.vue`. Other features are handled by custom components described below.

Special attention should be made of the `mode` and `as` params that's available via the `CreateEditView` mixin (as well as other helpful functionality). Changing these should change the behaviour of the resource details page (depending on the availability of resource type custom components).

| `mode` | `as` | Content |
|------------|----------|-------|
| falsy | falsy | Shows the View YAML or Customised Detail component|
| falsy | `config` | Shows the View YAML or Customised Edit component (in read only mode)|
| `edit` | falsy | Shows the Customised Edit component|
| `edit` | `yaml` | Shows the Edit Yaml component|

In addition the Create process (assessable with the same url + `/create`) is also managed by the resource detail page with similar param options. 

| `mode` | `as` | Content |
|------------|----------|-------| 
| falsy | `yaml` | Show the Edit YAML component in create mode
| `edit` | falsy | Show the Customised Edit component in create mode
| `clone` | falsy | Shows the Customised Edit component in create mode pre-populated with an existing resource

#### Detail Customisation

A more detailed overview page can be added by creating a resource type component in `/detail/`. This should provide a more eye pleasing presentation than a collection of inputs or yaml blob.

#### Edit Customisation

A more compelling edit experience can be created by adding a resource type component in `/edit/`. This should display a form like experience. Wrapping this in `CruResource` will provide generic error handling and cancel/save buttons.

This customisation should also support the `as=config` param, where the form is displayed and populated but is not editable.

## Styling

SCSS Styles can be found in `assets/styles/`. It's recommended to browse through some of the common styles in `_helpers.scss` and `_mixins.scss`.

### Examples

The following pages contain example components and their styling

- Buttons - `<dashboard url>/design-system`
- Form Controls - `<dashboard url>/design-system/form-controls`
- Provider Images - `<dashboard url>/design-system/provider-images`


## Internationalisation i18n / Localisation i10n

### i18n
All on screen text should be localised and implemented in the default `en-US` locale. There are different ways to access localised text

> `t` can be exposed via adding the i18n getter as a computed property with `...mapGetters({ t: 'i18n/t' })`

In HTML

```
<t k="<path to localisation>" />
{{ t("<path to localisation>") }}
```

Many components will also accept a localisation path via a `value-key` property, instead of the translated text in `value`.

In JS

```
this.t('<path to localisation>')
```

A localisation can be checked with

```
this.$store.getters['i18n/exists']('<path to localisation>')

this.$store.getters['i18n/withFallback']('<path to localisation>', null, '<fallback>'))
```

#### Using Variables in i18n Paths

In Javascript files, variables in localisation paths must be wrapped in quotation marks when the variable contains a slash.

For example, if we want to dynamically fill in the description of a resource based on its type, we can use a `type` variable when referencing the localisation path to the description:

```
{
  description: this.t(`secret.typeDescriptions.'${ type }'.description`),
}
```

In this case, the quotation marks are required because some Secret types, such as `kubernetes.io/basic-auth`, include a slash.

### i10n 

Localisation files can be found in `./assets/translations/en-us.yaml`.

Please follow precedents in file to determine where new translations should be place.

Form fields are conventionally defined in translations as <some prefix>.<field name>.{label,description,enum options if applicable} e.g.

```
account:
  apiKey:
    description:
      label: Description
      placeholder: Optionally enter a description to help you identify this API Key
```

## Forms 

### UX

Automatically give focus to the first field in a form with the `v-focus` directive. Auto-focusing the first form element saves the user an additional click and provides a clear starting point.

Example:

```html
  <LabeledInput 
    v-focus
    v-model="value" 
  />
```

### Custom Form Validators 

Adding custom validation logic to forms and models requires changes to three different parts of Dashboard:

1. Create a new validation function to `utils/validators`
2. Export the new validation function `utils/custom-validators.js`
3. Add `customValidationRules` prop to appropriate model under `models`

#### 1. Create a new validation function

Custom validators are stored under `utils/validators`. Validation functions should define positional parameters of `value, getters, errors, validatorArgs` with an optional fifth `displayKey` parameter: 

```javascript
export function exampleValidator(value, getters, errors, validatorArgs, displayKey) {
  ...
}
```

Make sure the validation function pushes a value to the `error` collection in order to display error messages on the form:

> In this example, we're making use of i18n getters to produce a localized error message. 

```javascript
export function exampleValidator(value, getters, errors, validatorArgs, displayKey) {
  ... 

  if (validationFails) {
    errors.push(getters['i18n/t']('validation.setting.serverUrl.https'));
  }

  ...
}
```

#### 2. Export new validation function

In order to make a custom validator available for usage in forms and component, it will need to exposed by importing the new validator function into `utils/custom-validators.js`:

```diff
import { podAffinity } from '@/utils/validators/pod-affinity';
import { roleTemplateRules } from '@/utils/validators/role-template';
import { clusterName } from '@/utils/validators/cluster-name';
+ import { exampleValidator } from '@/utils/validators/setting';
```

and add it to the default exports:

```diff
export default {
  containerImages,
  cronSchedule,
  podAffinity,
- roleTemplateRules
+ roleTemplateRules,
+ exampleValidator
};
```

#### 3. Add `customValidationRules` to model

Locate the model that will make use of the custom validation function and add `customValidationRules` property if one does not already exist. `customValidationRules` returns a collection of validation rules to run against the model:

```javascript
customValidationRules() {
  return [
    {
      path: 'value',
      validators: [`exampleValidator`]
    }
  ]
}
```

> ##### A validation rule can contain the following keys:
> 
> `path` {string}: the model property to validate
> 
> `nullable` {boolean}: asserts if property accepts `null` value
> 
> `required` {boolean}: asserts if property requires a value
> 
> `translationKey` {string}: path to validation key in `assets/translations`
> 
> `type` {string}: name of built-in validation rule to assert
> 
> `validators` {string}: name of custom validation rule to assert

Add `:${arg}` to pass custom arguments to a validation function:

```javascript
customValidationRules() {
  return [
    {
      path: 'value',
      validators: [`exampleValidator:${ this.metadata.name }`]
    }
  ]
}
```

Multiple custom arguments can be passed to a validator function; each argument is separated by `:`, for example:

```javascript
validators: [`exampleValidator:${ this.metadata.name }:'customString':42]
```

### Form Architecture

The forms for creating and editing resources are in the `edit` directory. Common functionality for the create/edit forms is reused by importing `CreateEditView` from `/mixins/create-edit-view`. For example, the `registerBeforeHook` is used across many create/edit forms to save the form data before a resource is created.

If a form element was repeated for every row in a table, it would make the UI slower. To increase performance, components such as `ActionMenu` and `PromptModal` are not repeated for every row in a table, and they don't directly interact with the data from a table row. Instead, they communicate with each row indirectly through the store. All the information about the actions that should be available for a certain resource is contained in a model, and the `ActionMenu` or `PromptModal` components take that information about the selected resource from the store. Modals and menus are opened by telling the store that they should be opened. For example, this call to the store  `this.$store.commit('action-menu/togglePromptModal');` is used to open the action menu. Then each component uses the `dispatch` method to get all the information it needs from the store.


## Other UI Features
### Icons 
Icons are font based and can be shown via the icon class

```
<i class="icon icon-fw icon-gear" /></a>
```

Icons can be browsed via `assets/fonts/icons/demo.html`.

Additional icon styles can be found in via `assets/styles/fonts/_icons.scss`.

### Date
The Dashboard uses the [dayjs](https://day.js.org/) library to handle dates, times and date algebra. However when showing a date and time they should take into account the date and time format. Therefore it's advised to use a formatter such as `/components/formatter/Date.vue` to display them.

### Loading Indicator

When a component uses `async fetch` it's best practise to gate the component template on fetch's `$fetchState.pending`. When the component is page based this should be applied to the `/components/Loading` component

```
<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    ...
  </div>
</template>
```

### Keyboard shortcuts 

Shortcuts are implemented via [`vue-shortkey`](https://github.com/iFgR/vue-shortkey)

```
<button v-shortkey.once="['n']" class="hide" @shortkey="focus()" />
```

Configuration for this is in `plugins/shortkey.js`. At the time of writing this contains options to disable keyboard shortcuts in `input`, `textarea` and `select` elements.
