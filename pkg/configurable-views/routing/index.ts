import type { RouteRecordRaw } from 'vue-router';
import { ROUTE_SETTINGS, ROUTE_VIEWS } from '../templating/template-engine';

// The product's own pages are routed by the Product API (see product.ts). These are only where they
// used to be, so an old link or bookmark still lands. They sit under the 'default' layout - named, as
// the shell asks of an extension's routes.
const LAYOUT = 'default';
const OLD = '/c/:cluster/configurable-views';

const routes: { parent: string; route: RouteRecordRaw }[] = [
  {
    parent: LAYOUT,
    route:  {
      path:     OLD,
      redirect: (to) => ({ name: ROUTE_SETTINGS, params: { cluster: to.params.cluster } }),
    },
  },
  {
    parent: LAYOUT,
    route:  {
      path:     `${ OLD }/views`,
      redirect: (to) => ({ name: ROUTE_VIEWS, params: { cluster: to.params.cluster } }),
    },
  },
  // Where the views page was when it listed the Home's views only.
  {
    parent: LAYOUT,
    route:  {
      path:     `${ OLD }/layouts`,
      redirect: (to) => ({ name: ROUTE_VIEWS, params: { cluster: to.params.cluster } }),
    },
  },
];

export default routes;
