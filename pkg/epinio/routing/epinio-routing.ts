import { RouteConfig } from 'vue-router';

import { EPINIO_PRODUCT_NAME } from '../types';

import CreateApp from '../pages/c/_cluster/applications/createapp/index.vue';
import ListApp from '../pages/c/_cluster/applications/index.vue';
import ListEpinio from '../pages/index.vue';
import ListEpinioResource from '../pages/c/_cluster/_resource/index.vue';
import CreateEpinioResource from '../pages/c/_cluster/_resource/create.vue';
import ViewEpinioResource from '../pages/c/_cluster/_resource/_id.vue';
import ViewEpinioNsResource from '../pages/c/_cluster/_resource/_namespace/_id.vue';

const routes: RouteConfig[] = [{
  name:      `${ EPINIO_PRODUCT_NAME }-c-cluster-applications-createapp`,
  path:      `/:product/c/:cluster/applications/createapp`,
  component: CreateApp,
}, {
  name:      `${ EPINIO_PRODUCT_NAME }-c-cluster-applications`,
  path:      `/:product/c/:cluster/applications`,
  component: ListApp,
}, {
  name:      `${ EPINIO_PRODUCT_NAME }`,
  path:      `/:product`,
  component: ListEpinio,
}, {
  name:      `${ EPINIO_PRODUCT_NAME }-c-cluster-resource`,
  path:      `/:product/c/:cluster/:resource`,
  component: ListEpinioResource,
}, {
  name:      `${ EPINIO_PRODUCT_NAME }-c-cluster-resource-create`,
  path:      `/:product/c/:cluster/:resource/create`,
  component: CreateEpinioResource,
}, {
  name:      `${ EPINIO_PRODUCT_NAME }-c-cluster-resource-id`,
  path:      `/:product/c/:cluster/:resource/:id`,
  component: ViewEpinioResource,
}, {
  name:      `${ EPINIO_PRODUCT_NAME }-c-cluster-resource-namespace-id`,
  path:      `/:product/c/:cluster/:resource/:namespace/:id`,
  component: ViewEpinioNsResource,
}];

export default routes;
