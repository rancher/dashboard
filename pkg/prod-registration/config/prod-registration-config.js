import { routes, productName } from './routes-config';
import { setRoute } from '@shell/core/plugin-helpers';

export function init($plugin, store) {
  const {
    product,
    virtualType,
    basicType,
    headers,
    spoofedType,
    configureType
  } = $plugin.DSL(store, productName);

  // product({
  //   inStore:             'management',
  //   icon:                'gear',
  //   removable:           false,
  //   showClusterSwitcher: false,
  //   weight:              100,
  //   to:                  setRoute('dashboard', routes)
  // });

  // virtualType({
  //   label:  'My dashboard view',
  //   icon:   'folder',
  //   // group:  'Root',
  //   // namespaced:   false,
  //   name:   'dashboard-view',
  //   weight: 2,
  //   route:  setRoute('dashboard', routes)
  // });

  // virtualType({
  //   label:  'Page 2',
  //   icon:   'folder',
  //   // group:  'Root',
  //   // namespaced:   false,
  //   name:   'page2-view',
  //   weight: 1,
  //   route:  setRoute('page2', routes)
  // });

  // basicType(['dashboard-view', 'page2-view']);

  console.log('dashboard route', setRoute('dashboard', productName, routes));
  console.log('page2', setRoute('page2', productName, routes));

  $plugin.registerExtensionProduct(store, {
    inStore: 'management',
    // icon:    'gear',
    svg:     require('@pkg/prod-registration/icons/rancher-desktop.svg'),
    weight:  1,
    to:      setRoute('dashboard', productName, routes)
  });

  $plugin.registerType(store, [
    {
      type:    'custom-page',
      id:      'dashboard',
      options: {
        label:  'My dashboard view',
        icon:   'folder',
        weight: 2,
        route:  setRoute('dashboard', productName, routes)
      }
    },
    {
      type:    'custom-page',
      id:      'page2',
      options: {
        label:  'Page 2',
        icon:   'folder',
        weight: 1,
        route:  setRoute('page2', productName, routes)
      }
    }
  ]);
}
