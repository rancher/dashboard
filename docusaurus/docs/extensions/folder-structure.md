# Folder Structure

Follow instructions [here](./extensions-getting-started.md) to scaffold your extension. This will assist you in the creation of an extension as a top-level product inside Rancher Dashboard.

Once you've done so, there are some initialization steps specific to extensions. Beyond that, extensions largely work the same as the rest of the dashboard. There are a set of top-level folders that can be defined and used as they are in the dashboard: `chart`, `cloud-credential`, `content`, `detail`, `edit`, `list`, `machine-config`, `models`, `promptRemove`, `l10n`, `windowComponents`, `dialog`, and `formatters`. 


## chart
Components in the chart folder are used to add custom UI to a helm install flow. The dashboard will look up a custom chart component for a given helm chart by checking two annotations: `'catalog.cattle.io/ui-component'` if set, otherwise `'catalog.cattle.io/release-name'`.

## cloud-credential
Cloud credentials are components that add provider-specific UI to create cloud credentials, needed to provision clusters.

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
This is not a top-level folder in the shell, which uses `/components/formatter`, but a top-level `formatters` directory works the same way in an extension as the shell `formatter` directory does. Formatters are used to format data within tables.

## machine-config
Machine configs are used to add provider-specific UI to the rke2/k3s provisioning page.

## detail, edit, and list
`detail`, `edit`, and `list` folders are used to create custom CRUD views for kubernetes resources, and components in each should be given the same name as the targeted resource.

## models
Kubernetes resources loaded through the dashboard store are, by default, instances of the resource class found here: `plugins/dashboard-store/resource-class.js`. Add a file with the name of the resource to the `models` directory to expand on that functionality. Generally, models should be an extension of the Steve class (Norman resources should not, but they are primarily used around auth functionality):
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
It's possible that different products will use the same kubernetes resource, but need to add different model functionality (eg Harvester has a 'node' model). Files in a extension's `models` folder will overwrite any files in the `shell/models` directory across the application. To extend or overwrite model functionality for a given store, nest models within a subfolder with the same name as the vuex module's `namespace`.

## promptRemove
Components in the PromptRemove folder are used to customize the removal prompt for specific resource types. Components added to this folder should have the same file name as the resource they're intended for. These components do not control the actual removal action - they are intended to allow the developer to supply additional information about consequences of removing a given resource, eg the Global Role removal prompt warns how many users are bound to that role. 

## l10n
Extension translation strings are merged with those already present in `shell/assets/translations`. Translation strings with duplicate keys of those present in the relevant shell translation file will overwrite those shell translation strings _across the app_: be mindful if adding translation strings that are not explicitly scoped to your extension. Read more about translations [here](./advanced/localization)

## Extension Package Metadata

Each extension package has the ability to customize certain aspects when it comes to compatibility with Rancher Manager/Kubernetes or displaying extension names. These are determined by the `rancher.annotations` object applied to the `package.json` of an extension package.

These annotations allow you to specify compatibility with Kubernetes, Rancher Manager, the Extensions API, and the Rancher UI version by relying on [semver ranges](https://www.npmjs.com/package/semver/v/6.3.0#ranges). As well as version compatibility, you can also specify a Display Name for the Extension package as it appears on the "Extensions" page within the UI.


