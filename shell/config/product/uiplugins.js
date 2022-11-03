import { DSL, IF_HAVE } from '@shell/store/type-map';

export const NAME = 'uiplugins';

export function init(store) {
  const { product } = DSL(store, NAME);

  // Add a product for UI Plugins - will appear in the top-level menu
  product({
    ifHave:              IF_HAVE.ADMIN, // Only admins can see the UI Plugin Custom Resource by default
    inStore:             'management',
    icon:                'extension',
    removable:           false,
    showClusterSwitcher: false,
    category:            'configuration',
    weight:              50,
  });
}
