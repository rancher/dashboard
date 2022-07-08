import { RouteConfig } from 'vue-router';

import { KUBEWARDEN_PRODUCT_NAME } from '../types';

import KubewardenResourcedList from '../pages/c/_cluster/_resource/index.vue';
import CreateKubewardenResource from '../pages/c/_cluster/_resource/create.vue';
import ViewKubewardenResource from '../pages/c/_cluster/_resource/_id.vue';
import ViewKubewardenNsResource from '../pages/c/_cluster/_resource/_namespace/_id.vue';

const routes: RouteConfig[] = [
  {
    name:       `${ KUBEWARDEN_PRODUCT_NAME }-c-cluster-resource`,
    path:       `/:product/c/:cluster/:resource`,
    component:  KubewardenResourcedList
  },
  {
    name:      `${ KUBEWARDEN_PRODUCT_NAME }-c-cluster-resource-create`,
    path:      `/:product/c/:cluster/:resource/create`,
    component: CreateKubewardenResource,
  },
  {
    name:      `${ KUBEWARDEN_PRODUCT_NAME }-c-cluster-resource-id`,
    path:      `/:product/c/:cluster/:resource/:id`,
    component: ViewKubewardenResource,
  },
  {
    name:      `${ KUBEWARDEN_PRODUCT_NAME }-c-cluster-resource-namespace-id`,
    path:      `/:product/c/:cluster/:resource/:namespace/:id`,
    component: ViewKubewardenNsResource,
  }
];

export default routes;
