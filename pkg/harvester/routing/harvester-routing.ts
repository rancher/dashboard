import { RouteConfig } from 'vue-router';
import { PRODUCT_NAME } from '../types';

import ListHarvester from '../pages/c/_cluster/index.vue';
import ListHarvesterResource from '../pages/c/_cluster/_resource/index.vue';
import CreateHarvesterResource from '../pages/c/_cluster/_resource/create.vue';
import ViewHarvesterResource from '../pages/c/_cluster/_resource/_id.vue';
import ViewHarvesterNsResource from '../pages/c/_cluster/_resource/_namespace/_id.vue';

const routes: RouteConfig[] = [
  {
    name:      `${ PRODUCT_NAME }`,
    path:      `/:product`,
    component: ListHarvester,
  },
  {
    name:      `${ PRODUCT_NAME }-c-cluster`,
    path:      `/:product/c/:cluster`,
    component: ListHarvester,
  },
  {
    name:      `${ PRODUCT_NAME }-c-cluster-resource`,
    path:      `/:product/c/:cluster/:resource`,
    component: ListHarvesterResource,
  }, {
    name:      `${ PRODUCT_NAME }-c-cluster-resource-create`,
    path:      `/:product/c/:cluster/:resource/create`,
    component: CreateHarvesterResource,
  }, {
    name:      `${ PRODUCT_NAME }-c-cluster-resource-id`,
    path:      `/:product/c/:cluster/:resource/:id`,
    component: ViewHarvesterResource,
  }, {
    name:      `${ PRODUCT_NAME }-c-cluster-resource-namespace-id`,
    path:      `/:product/c/:cluster/:resource/:namespace/:id`,
    component: ViewHarvesterNsResource,
  }];

export default routes;
