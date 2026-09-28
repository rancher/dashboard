import { RouteRecordRaw } from 'vue-router';
import { PRODUCT_NAME, ROUTE_SETTINGS, ROUTE_LAYOUTS } from '../templating/template-engine';

import Settings from '../pages/Settings.vue';
import HomeLayouts from '../pages/HomeLayouts.vue';

// Routes for the Configurable Views product — the configurable Home only.
const routes: RouteRecordRaw[] = [
  {
    name:      ROUTE_SETTINGS,
    path:      `/c/:cluster/${ PRODUCT_NAME }`,
    component: Settings,
    meta:      { product: PRODUCT_NAME },
  },
  {
    name:      ROUTE_LAYOUTS,
    path:      `/c/:cluster/${ PRODUCT_NAME }/layouts`,
    component: HomeLayouts,
    meta:      { product: PRODUCT_NAME },
  },
];

export default routes;
