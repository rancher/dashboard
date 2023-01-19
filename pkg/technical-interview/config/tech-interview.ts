
import { TAB_PAGE } from '../routing/interview-routing';

export function init($plugin: any, store: any) {
  const {
    product,
    virtualType
  } = $plugin.DSL(store, $plugin.name);

  product({
    isMultiClusterApp:     true,
    labelKey:              'interview.label',
    icon:                  'application',
    removable:             false,
    showClusterSwitcher:   false,
    to:                    TAB_PAGE,
    showNamespaceFilter:   false,
    customNamespaceFilter: false,
    weight:                99,
  });

  virtualType({
    name:       'tab-page',
    group:      'Root',
    namespaced: false,
    route:      TAB_PAGE,
  });
}
