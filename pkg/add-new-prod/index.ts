import { importTypes } from '@rancher/auto-import';
import { IPlugin, StandardProductName } from '@shell/core/types';

// Init the package
export default function(plugin: IPlugin) {
  if (!plugin.environment.isPrime) {
    return false;
  }

  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // // Add a simple product with a single page component with "plain" layout (no sidebar)
  // plugin.addProduct({
  //   name:      'alex-simple-one-page',
  //   weight:    -100,
  //   label:     'Simple One Page (no sidebar)',
  //   component: () => import('./components/Test.vue')
  // });

  // // Add a simple product without children
  // plugin.addProduct({
  //   name:   'alex-simple-top-level',
  //   weight: -100,
  //   label:  'Simple (with sidebar)'
  // }, []);

  // // Add a simple product with simple children (virtualTypes)
  // plugin.addProduct({
  //   name:   'alex-simple-children',
  //   weight: -100,
  //   label:  'Simple with Children'
  // }, [
  //   {
  //     name:      'page1',
  //     // weight: 10000,
  //     label:     'My label for page 1',
  //     component: () => import('./components/Test.vue')
  //   },
  //   {
  //     name:      'page2',
  //     // weight: 10000,
  //     label:     'My label for page 2',
  //     component: () => import('./components/Test.vue')
  //   },
  // ]);

  // // Add a simple product with 1 level children + type
  // plugin.addProduct({
  //   name:   'alex-simple-children',
  //   weight: -100,
  //   label:  'Simple with Children'
  // }, [
  //   {
  //     name:      'page1',
  //     // weight:    3000,
  //     label:     'My label for page 1',
  //     component: () => import('./components/Test.vue')
  //   },
  //   {
  //     name:      'page2',
  //     // weight:    5000,
  //     label:     'My label for page 2',
  //     component: () => import('./components/Test.vue')
  //   },
  //   {
  //     type: 'upgrade.cattle.io.plan',
  //     // weight: 150,
  //   }
  // ]);

  // Add a simple product with children + type
  plugin.addProduct({
    name:   'alex-simple-children',
    weight: -100, // does not matter for inner structure root weight (this is just for sidebar ordering)
    label:  'Simple with Children'
  }, [
    {
      name:      'page1',
      label:     'My label for page 1',
      component: () => import('./components/Test.vue'),
      children:  [
        {
          name:      'hello0',
          label:     'Testing 12',
          labelKey:  'aks.label',
          component: () => import('./components/Test.vue')
        } as any,
        {
          name:      'hello1',
          label:     'Testing 1',
          labelKey:  'aks.label',
          component: () => import('./components/Test.vue')
        },
        {
          name:      'hello3',
          labelKey:  'aks.label',
          component: () => import('./components/Test.vue')
        },
        {
          name:      'hello2',
          label:     'Testing 2',
          component: () => import('./components/Test.vue')
        }
      ]
    },
    { type: 'upgrade.cattle.io.plan' },
    {
      name:      'page2',
      label:     'My label for page 2',
      component: () => import('./components/Test.vue')
    },
  ]);

  // plugin.extendProduct(StandardProductName.SETTINGS, [
  //   {
  //     name:      'mysettings',
  //     label:     'Custom',
  //     component: () => import('./components/Test.vue')
  //   }
  // ]);
}
