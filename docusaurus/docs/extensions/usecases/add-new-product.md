# Adding a new product (top-level extension)

To get started with a new extension, just replace the contents of the `./index.ts` file with:

```ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin, ProductMetadata, ProductChild } from '@shell/core/types';

// Init the package
export default function (plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide extension metadata from package.json
  // it will grab information such as `name` and `description`
  plugin.metadata = require('./package.json');

  const productMetadata: ProductMetadata = {
    name:  'my-product',
    label: 'My Product',
    icon:  'gear',
  };

  const productConfig: ProductChild[] = [
    {
      name:      'overview', // custom page
      label:     'Overview',
      component: () => import('./components/overview.vue'),
    },
    {
      type:   'provisioning.cattle.io.cluster', // resource page
      label:  'Custom Clusters view',
    },
    {
      name:      'custom-settings', // group with children (only allowed for custom pages)
      label:     'Custom Settings',
      children: [
        {
          name:      'general',
          label:     'General',
          component: () => import('./components/general.vue'),
        },
      ],
    },
  ];

  // adds a new extension
  plugin.addProduct(productMetadata, productConfig);
}
```

To know more about all the admissible parameters for the product registration and pages, please check all the documentation for [Product Registration](./../api/products.md), more specifically `addProduct` method.