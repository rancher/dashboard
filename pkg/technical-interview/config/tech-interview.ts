
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { TAB_PAGE } from '../routing/interview-routing';

export const TECH_INTERVIEW_NAME = 'interview';

export function init($plugin: any, store: any): void {
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
    rootProduct:           TECH_INTERVIEW_NAME,
  });

  virtualType({
    name:       'tab-page',
    group:      'Root',
    namespaced: false,
    route:      TAB_PAGE,
  });
}
