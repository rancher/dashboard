# Resource page

## Defining a kubernetes resource as a page for an Extension (configureType)
One of the most common view types in Rancher Dashboard is the list view for a kubernetes resource. What if you wanted to include a similiar view on your Extension product for a given resource? For that we can use the function `configureType` coming from `$plugin.DSL`. As an example usage of that method, one could do the following:

```ts
import { IPlugin } from '@shell/core/types';

// this is the definition of a "blank cluster" for Rancher Dashboard
// definition of a "blank cluster" in Rancher Dashboard
const BLANK_CLUSTER = '_';


export function init($plugin: IPlugin, store: any) {
  const YOUR_PRODUCT_NAME = 'myProductName';
  // example of using an existing k8s resource as a page
  const YOUR_K8S_RESOURCE_NAME = 'provisioning.cattle.io.cluster';
  
  const { 
    product,
    configureType
  } = $plugin.DSL(store, YOUR_PRODUCT_NAME);

  // registering a top-level product
  product({
    icon: 'gear',
    inStore: 'management',
    weight: 100,
    to: {
      name: `${ YOUR_PRODUCT_NAME }-c-cluster-resource`,
      params: {
        product: YOUR_PRODUCT_NAME,
        cluster: BLANK_CLUSTER,
        resource: YOUR_K8S_RESOURCE_NAME
      }
    }
  });

  // => => => defining a k8s resource as page
  configureType(YOUR_K8S_RESOURCE_NAME, {
    displayName: 'some-custom-name-you-wish-to-assign-to-this-resource',
    isCreatable: true,
    isEditable:  true,
    isRemovable: true,
    showAge:     true,
    showState:   true,
    canYaml:     true,
    customRoute: {
      name: `${ YOUR_PRODUCT_NAME }-c-cluster-resource`,
      params: {
        product: YOUR_PRODUCT_NAME,
        cluster: BLANK_CLUSTER,
        resource: YOUR_K8S_RESOURCE_NAME
      }
    }
  });
}
```

> Note: We strongly encourange the usage of the `customRoute` to make sure we follow the same route structure as the other routes on the same Extension product. Check pattern [here](#overview-on-routing-structure-for-a-top-level-extension-product).

The acceptable parameters for the `configureType` function are defined here:

| Key | Type | Description |
| --- | --- | --- |
|`displayName`| String | Display name for the given resource. Defaults to `YOUR_K8S_RESOURCE_NAME` (based on example) if you haven't defined a `displayName`  |
|`isCreatable`| Boolean | If the 'create' button is available on the list view |
|`isEditable`| Boolean | If a resource instance is editable |
|`isRemovable`| Boolean | If a resource instance is deletable |
|`showAge`| Boolean | If the 'age' column is available on the list view |
|`showState`| Boolean | If the 'state' column is available on the list view |
|`canYaml`| Boolean | If the k8s resource can be edited/created via YAML editor |
| `customRoute` | [Vue Router route config](https://v3.router.vuejs.org/api/#routes) |  Route for this resource page |
