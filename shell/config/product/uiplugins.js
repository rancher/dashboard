import { DSL } from '@shell/store/type-map';
import { UI_PLUGIN } from '@shell/config/types';

export const NAME = 'uiplugins';

export function init(store) {
  const { product } = DSL(store, NAME);

  // Add a product for UI Plugins - will appear in the top-level menu
  product({
    ifHaveType:          UI_PLUGIN, // Only admins can see the UI Plugin Custom Resource by default
    inStore:             'management',
    icon:                'gear',
    removable:           false,
    showClusterSwitcher: false,
    category:            'configuration',
  });
}
