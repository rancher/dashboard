import { RouteRecordRaw } from 'vue-router';
import { PRODUCT_NAME } from '../config/harvester-manager';

import Root from '../pages/c/_cluster/index.vue';
import ListHarvesterMgrResource from '../pages/c/_cluster/_resource/index.vue';
import CreateHarvesterMgrResource from '../pages/c/_cluster/_resource/create.vue';
import ViewHarvesterMgrResource from '../pages/c/_cluster/_resource/_id.vue';

const routes: RouteRecordRaw[] = [
  {
    name:      `${ PRODUCT_NAME }-c-cluster`,
    path:      `/:product/c/:cluster`,
    component: Root,
  },
  {
    name:      `${ PRODUCT_NAME }-c-cluster-resource`,
    path:      `/:product/c/:cluster/:resource`,
    component: ListHarvesterMgrResource,
  },
  {
    name:      `${ PRODUCT_NAME }-c-cluster-resource-create`,
    path:      `/:product/c/:cluster/:resource/create`,
    component: CreateHarvesterMgrResource,
  },
  {
    name:      `${ PRODUCT_NAME }-c-cluster-resource-id`,
    path:      `/:product/c/:cluster/:resource/:id`,
    component: ViewHarvesterMgrResource,
  },

];

export default routes;
