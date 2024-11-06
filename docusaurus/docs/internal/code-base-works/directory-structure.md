# Directory Structure
The directory structure is mostly flat, with each top level directory being for a different important thing (or just required by Nuxt to be there). Plugin file structure should be largely the same.

## assets*
Uncompiled assets, eg .scss files.

## chart**
Components in the chart folder are used to add custom UI to a helm install flow. The dashboard will look up a custom chart component for a given helm chart by checking two annotations: `'catalog.cattle.io/ui-component'` if set, otherwise `'catalog.cattle.io/release-name'`.

## cloud-credential**
Cloud credentials are components that add provider-specific UI to create cloud credentials, needed to provision clusters. Read more about provisioning [here](./machine-drivers.md).

## config
This is specific to extensions. Product definitions should be added directly under the `config` folder (as opposed to being nested in `shell/config/product`). See [Defining Products](./products-and-navigation.md) for more information.

## dialog
Components in the dialog folder are used within the `PromptModal` component. Dispatch the `promptModal` action from the dashboard store to open a modal. This action takes a few props:

|Name |Type |Description|
|---|---|---|
|resources| Array or Object| Optional - Any resource(s) relevant to the custom modal component |
|componentProps| Object | Optional - additional props to pass to the custom modal component |
|component| String | Optional- the name of the custom modal component|
|modalWidth| String CSS Property | Desired width of the modal (default 600px)|
|modalSticky| Boolean | Whether or not to apply sticky positioning (default false)| 

## formatters 
This is not a top-level folder in the shell, which uses `/components/formatter`, but a top-level `formatters` directory works the same way in an extension as the shell `formatter` directory does. Formatters are used to format data within tables. see [Defining Products](./products-and-navigation.md) for more information on configuring resource tables.

## machine-config**
Machine configs are used to add provider-specific UI to the rke2/k3s provisioning page. Read more about provisioning [here](./machine-drivers.md)

## detail, edit, and list**
`detail`, `edit`, and `list` folders are used to create custom CRUD views for kubernetes resources, and components in each should be given the same name as the targeted resource. Read about how to leverage them in detail [here](./customising-how-k8s-resources-are-presented.md)

## models**
Kubernetes resources loaded through the dashboard store are, by default, instances of the resource class found here: `plugins/dashboard-store/resource-class.js`. Add a file with the name of the resource to the `models` directory to expand on that functionality. Generally, models should be an extension of the Steve class (Norman resources should not, but they are primarly used around auth functionality):
```
import SteveModel from '@shell/plugins/steve/steve-class';

export default class <resource name> extends SteveModel {
...
}
```
Some common model properties to overwrite are:
* `availableActions`: list of resource actions that appear in kebab menus (include/alter default actions with `_availableActions`)
* `canDelete`: whether or not the current user should be able to delete a resource
* `detailLocation`: route for the detail view of one instance of the resource

### Overlapping Model Names
It's possible that different products will use the same kubernetes resource, but need to add different model functionality (eg Harvester has a 'node' model). Files in a extension's `models` folder will overwrite any files in the `shell/models` directory across the application. To extend or overwrite model functionality for a given store, nest models within a subfolder with the same name as the vuex module's `namespace`. see [Extensions Configuration](/extensions/next/extensions-configuration) for more information on configuring an extension store.

## promptRemove**
Components in the PromptRemove folder are used to customize the removal prompt for specific resource types. Components added to this folder should have the same file name as the resource they're intended for. These components do not control the actual removal action - they are intended to allow the developer to supply additional information about consequences of removing a given resource, eg the Global Role removal prompt warns how many users are bound to that role. 


## l10n
Extension translation strings are merged with those already present in `shell/assets/translations`. Translation strings with duplicate keys of those present in the relevant shell translation file will overwrite those shell translation strings _across the app_: be mindful if adding translation strings that are not explicitly scoped to your extension. Read more about translations [here](./on-screen-text-and-translations.md)

## windowComponents
Components in this folder can be used within `WindowManager` component, which relies on the `wm` vuex store.

## The rest
The rest of the top level directories are mostly Nuxt directories that you can read about [here](https://nuxtjs.org/docs/directory-structure/nuxt). 


\*_not automatically imported with extensions_

\*\* _components in these directories need particular names to work: either the relevant k8s resource or cloud provider_
