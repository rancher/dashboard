import { RouteConfig } from 'vue-router';
import { NAME as MANAGER_NAME } from '@shell/config/product/manager';
import CreateAksCluster from './pages/c/_cluster/manager/aks/create.vue';
import ViewAksCluster from './pages/c/_cluster/manager/aks/_id.vue';

const routes: RouteConfig[] = [
  {
    name:      `c-cluster-${ MANAGER_NAME }-aks-create`,
    path:      `/c/:cluster/manager/aks/create`,
    component: CreateAksCluster,
  },
  {
    name:      `c-cluster-${ MANAGER_NAME }-aks-id`,
    path:      `/c/:cluster/manager/aks/:id`,
    component: ViewAksCluster,
  }
];

export default routes;
