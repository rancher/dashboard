import { IPlugin } from '@shell/core/types';

/**
 * Product name for the product (also used for product route)
 */
export const TECH_INTERVIEW_NAME = 'interview';

export function init($plugin: IPlugin, store: any) {
  const { product } = $plugin.DSL(store, TECH_INTERVIEW_NAME);

  product({
    inStore:             'management',
    icon:                'application',
    showClusterSwitcher: false,
    category:            'global',
    to:                  { name: TECH_INTERVIEW_NAME },
    showNamespaceFilter: false,
    weight:              99,
  });
}
