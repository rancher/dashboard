import { RouteConfig } from 'vue-router';
import { ELEMENTAL_PRODUCT_NAME } from '../types';
import Dashboard from '../pages/index.vue';
import Operations from '../pages/Operations.vue';
import ListElementalResource from '../pages/resource/index.vue';

const routes: RouteConfig[] = [
  {
    name:      `${ ELEMENTAL_PRODUCT_NAME }-c-cluster`,
    path:      `/:product/c/:cluster/`,
    component: Dashboard,
  },
  {
    name:      `${ ELEMENTAL_PRODUCT_NAME }-c-cluster-operations`,
    path:      `/:product/c/:cluster/operations`,
    component: Operations,
  },
  {
    name:      `${ ELEMENTAL_PRODUCT_NAME }-c-cluster-resource`,
    path:      `/:product/c/:cluster/:resource`,
    component: ListElementalResource,
  },
];

export default routes;
