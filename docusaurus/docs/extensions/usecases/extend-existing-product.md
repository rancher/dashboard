# Extending an existing product

Extensions can "extend" an existing product (`StandardProductName`) with extra pages, groups, and resources. This next example will add some new pages to the Cluster Explorer according to the following code (`./index.ts`):

```ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin, ProductChild, StandardProductName } from '@shell/core/types';

export default function init(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide extension metadata from package.json
  // it will grab information such as `name` and `description`
  plugin.metadata = require('./package.json');

  const config: ProductChild[] = [
    {
      name:      'overview', // custom page
      label:     'Overview',
      component: () => import('./components/overview.vue'),
    },
    {
      type:   'upgrade.cattle.io.plan', // resource page
      weight: 80,
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

  plugin.extendProduct(StandardProductName.EXPLORER, productConfig);
}
```

To know more about all the admissible parameters for the product registration and pages, please check all the documentation for [Product Registration](./../api/products.md), more specifically `extendProduct` method.