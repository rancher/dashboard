import { RouteRecordRaw } from 'vue-router';
import { PRODUCT_NAME, ROUTE_SETTINGS, ROUTE_VIEWS } from '../templating/template-engine';

import Settings from '../pages/Settings.vue';
import SavedViews from '../pages/SavedViews.vue';

// Routes for the Configurable Views product: its Settings, and the views saved for each page.
const routes: RouteRecordRaw[] = [
  {
    name:      ROUTE_SETTINGS,
    path:      `/c/:cluster/${ PRODUCT_NAME }`,
    component: Settings,
    meta:      { product: PRODUCT_NAME },
  },
  {
    name:      ROUTE_VIEWS,
    path:      `/c/:cluster/${ PRODUCT_NAME }/views`,
    component: SavedViews,
    meta:      { product: PRODUCT_NAME },
  },
  // Where this page used to be, when it listed the Home's views only.
  {
    path:     `/c/:cluster/${ PRODUCT_NAME }/layouts`,
    redirect: (to) => ({ name: ROUTE_VIEWS, params: to.params }),
  },
];

export default routes;
