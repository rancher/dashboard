import type { Store } from 'vuex';
import { ConfigureVirtualTypeOptions, IPlugin } from '@shell/core/types';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { PRODUCT_NAME, ROUTE_SETTINGS, ROUTE_LAYOUTS } from './templating/template-engine';

// The "Configurable Views" product — a TOP-LEVEL global product (like Continuous Delivery / Cluster
// Management): inStore 'management', no cluster switcher. It is focused solely on the configurable
// Home: Settings (the kill switch) and Home Layouts (the assembled views). Everything is stored as
// labeled ConfigMaps (not a CRD).
export function init($extension: IPlugin, store: Store<unknown>): void {
  const { product, virtualType, basicType } = $extension.DSL(store, PRODUCT_NAME);

  product({
    icon:                'compass',
    inStore:             'management',
    removable:           false,
    showClusterSwitcher: false,
    weight:              -1,
    to:                  { name: ROUTE_SETTINGS, params: { cluster: BLANK_CLUSTER } },
  });

  // Both entries are cast: `exact` is honoured at runtime — nav/Group.vue binds it to the router-link
  // and type-map clones the whole options object through — but it is missing from
  // ConfigureVirtualTypeOptions. It is needed here because Settings sits at `/c/_/configurable-views`,
  // a prefix of every other product route, so without it the active match lights Settings up on every
  // sub-page. The type is the thing that is wrong; worth an upstream issue.

  // Settings — the kill-switch toggle. Always reachable, including when the feature is off.
  virtualType({
    labelKey:   'configurableViews.settings.label',
    name:       'configurable-views-settings',
    namespaced: false,
    weight:     103,
    exact:      true,
    route:      { name: ROUTE_SETTINGS, params: { cluster: BLANK_CLUSTER } },
  } as ConfigureVirtualTypeOptions);

  // Home Layouts — the assembled Home VIEWS (views + the widgets on them).
  virtualType({
    labelKey:   'configurableViews.layouts.label',
    name:       'configurable-views-layouts',
    namespaced: false,
    weight:     106,
    exact:      true,
    route:      { name: ROUTE_LAYOUTS, params: { cluster: BLANK_CLUSTER } },
  } as ConfigureVirtualTypeOptions);

  basicType(['configurable-views-layouts', 'configurable-views-settings']);
}
