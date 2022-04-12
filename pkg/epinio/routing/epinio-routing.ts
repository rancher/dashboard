import { RouteConfig } from 'vue-router';

import { EPINIO_PRODUCT_NAME } from '../types';

import CreateApp from '../pages/c/_cluster/applications/createapp/index.vue';
import ListApp from '../pages/c/_cluster/applications/index.vue';
import ListEpinio from '../pages/index.vue';
import ViewEpinioBase from '../pages/c/index.vue';
import ViewEpinio from '../pages/c/_cluster/index.vue';
import ListEpinioResource from '../pages/c/_cluster/_resource/index.vue';
import CreateEpinioResource from '../pages/c/_cluster/_resource/create.vue';
import ViewEpinioResource from '../pages/c/_cluster/_resource/_id.vue';
import ViewEpinioNsResource from '../pages/c/_cluster/_resource/_namespace/_id.vue';

const routes: RouteConfig[] = [{
  name:      `${ EPINIO_PRODUCT_NAME }-c-cluster-applications-createapp`,
  path:      `/epinio/c/:cluster/applications/createapp`,
  component: CreateApp,
}, {
  name:      `${ EPINIO_PRODUCT_NAME }-c-cluster-applications`,
  path:      `/epinio/c/:cluster/applications`,
  component: ListApp,
}, {
  name:      `${ EPINIO_PRODUCT_NAME }`,
  path:      `/epinio`,
  component: ListEpinio,
}, {
  name:      `${ EPINIO_PRODUCT_NAME }-c`,
  path:      `/epinio/c`,
  component: ViewEpinioBase,
}, {
  name:      `${ EPINIO_PRODUCT_NAME }-c-cluster`,
  path:      `/epinio/c/:cluster`,
  component: ViewEpinio,
}, {
  name:      `${ EPINIO_PRODUCT_NAME }-c-cluster-resource`,
  path:      `/epinio/c/:cluster/:resource`,
  component: ListEpinioResource,
}, {
  name:      `${ EPINIO_PRODUCT_NAME }-c-cluster-resource-create`,
  path:      `/epinio/c/:cluster/:resource/create`,
  component: CreateEpinioResource,
}, {
  name:      `${ EPINIO_PRODUCT_NAME }-c-cluster-resource-id`,
  path:      `/epinio/c/:cluster/:resource/:id`,
  component: ViewEpinioResource,
}, {
  name:      `${ EPINIO_PRODUCT_NAME }-c-cluster-resource-namespace-id`,
  path:      `/epinio/c/:cluster/:resource/:namespace/:id`,
  component: ViewEpinioNsResource,
}];

export default routes;
