import type { RouteRecordRaw } from 'vue-router';
import { PRODUCT_NAME, ROUTE_SETTINGS, ROUTE_VIEWS } from '../templating/template-engine';

import Settings from '../pages/Settings.vue';
import SavedViews from '../pages/SavedViews.vue';

// Routes for the Configurable Views product: its Settings, and the views saved for each page. They
// sit under the 'default' layout - named, as the shell asks of an extension's routes.
const LAYOUT = 'default';

const routes: { parent: string; route: RouteRecordRaw }[] = [
  {
    parent: LAYOUT,
    route:  {
      name:      ROUTE_SETTINGS,
      path:      `/c/:cluster/${ PRODUCT_NAME }`,
      component: Settings,
      meta:      { product: PRODUCT_NAME },
    },
  },
  {
    parent: LAYOUT,
    route:  {
      name:      ROUTE_VIEWS,
      path:      `/c/:cluster/${ PRODUCT_NAME }/views`,
      component: SavedViews,
      meta:      { product: PRODUCT_NAME },
    },
  },
  // Where this page used to be, when it listed the Home's views only.
  {
    parent: LAYOUT,
    route:  {
      path:     `/c/:cluster/${ PRODUCT_NAME }/layouts`,
      redirect: (to) => ({ name: ROUTE_VIEWS, params: to.params }),
    },
  },
];

export default routes;
