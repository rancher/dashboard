import { ConfigureVirtualTypeOptions, IPlugin } from '@shell/core/types';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { PRODUCT_NAME, ROUTE_SETTINGS, ROUTE_TEMPLATES, ROUTE_LAYOUTS } from './templating/template-engine';

// `exact` is honoured at runtime — nav/Group.vue binds it to the router-link and type-map clones the
// whole options object through — but it is missing from ConfigureVirtualTypeOptions, so each
// virtualType is cast. Dropping it instead would light Settings up on every sub-page, since its path
// is a prefix of them all. The type is the thing that is wrong; worth an upstream issue.
// The "AI Templating" product — a TOP-LEVEL global product (like Continuous Delivery / Cluster
// Management): inStore 'management', no cluster switcher. It is focused solely on the configurable
// Home: Settings (the kill switch), Home Templates (the panel building blocks) and Home Layouts (the
// assembled dashboards). Everything is stored as labeled ConfigMaps (not a CRD).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function init($extension: IPlugin, store: any): void {
  const { product, virtualType, basicType } = $extension.DSL(store, PRODUCT_NAME);

  product({
    icon:                'compass',
    inStore:             'management',
    removable:           false,
    showClusterSwitcher: false,
    weight:              -1,
    to:                  { name: ROUTE_SETTINGS, params: { cluster: BLANK_CLUSTER } },
  });

  // Settings (kill-switch toggle) — always reachable. `exact` so it only highlights on its own
  // route: its path `/c/_/configurable-views` is a prefix of every product route, and without exact the
  // <router-link> active match would light Settings up on every sub-page.
  virtualType({
    labelKey:   'aiTemplating.settings.label',
    name:       'configurable-views-settings',
    namespaced: false,
    weight:     103,
    exact:      true,
    route:      { name: ROUTE_SETTINGS, params: { cluster: BLANK_CLUSTER } },
  } as ConfigureVirtualTypeOptions);

  // Home Templates — the panel building blocks (home-template ConfigMaps).
  virtualType({
    labelKey:   'aiTemplating.templates.label',
    name:       'configurable-views-templates',
    namespaced: false,
    weight:     105,
    exact:      true,
    route:      { name: ROUTE_TEMPLATES, params: { cluster: BLANK_CLUSTER } },
  } as ConfigureVirtualTypeOptions);

  // Home Layouts — the assembled Home VIEWS (panels + the widgets on them).
  virtualType({
    labelKey:   'aiTemplating.layouts.label',
    name:       'configurable-views-layouts',
    namespaced: false,
    weight:     106,
    exact:      true,
    route:      { name: ROUTE_LAYOUTS, params: { cluster: BLANK_CLUSTER } },
  } as ConfigureVirtualTypeOptions);

  basicType(['configurable-views-layouts', 'configurable-views-templates', 'configurable-views-settings']);
}
