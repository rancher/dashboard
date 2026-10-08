import type { ProductChildCustomPage, ProductMetadata } from '@shell/core/plugin-products-external';
import { PRODUCT_NAME, PAGE_SETTINGS, PAGE_VIEWS } from './templating/template-engine';

// The "Configurable Views" product - a TOP-LEVEL global product (like Continuous Delivery / Cluster
// Management), with no cluster switcher. Everything it shows is stored as labeled ConfigMaps (not a
// CRD).
export const product: ProductMetadata = {
  name:     PRODUCT_NAME,
  labelKey: 'product.configurable-views',
  sideBar:  { weight: -1, icon: { name: 'compass' } },
};

// Its two pages. The one on top is where the product opens, so Settings - the kill switch - leads:
// always reachable, including when the feature is off.
export const pages: ProductChildCustomPage[] = [
  {
    name:      PAGE_SETTINGS,
    labelKey:  'configurableViews.settings.label',
    component: () => import('./pages/Settings.vue'),
    sideMenu:  { weight: 2 },
  },
  // Each page's saved VIEWS, and the widgets on them.
  {
    name:      PAGE_VIEWS,
    labelKey:  'configurableViews.views.label',
    component: () => import('./pages/SavedViews.vue'),
    sideMenu:  { weight: 1 },
  },
];
