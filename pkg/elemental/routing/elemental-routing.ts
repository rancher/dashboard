import { RouteConfig } from 'vue-router';
import { ELEMENTAL_PRODUCT_NAME } from '../types';
import Dashboard from '../pages/index.vue';
import Operations from '../pages/Operations.vue';
import MachineInventories from '../pages/MachineInventories.vue';

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
    name:      `${ ELEMENTAL_PRODUCT_NAME }-c-cluster-machine-inventories`,
    path:      `/:product/c/:cluster/machine-inventories`,
    component: MachineInventories,
  },
];

export default routes;
