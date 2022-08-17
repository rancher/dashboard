import { RouteConfig } from 'vue-router';

import { EXAMPLE_PRODUCT_NAME } from '../types';

import LandingPage from '../pages/index.vue';
import ListResource from '../pages/c/_cluster/_resource/index.vue';
import CreateResource from '../pages/c/_cluster/_resource/create.vue';
import ViewResource from '../pages/c/_cluster/_resource/_id.vue';

const routes: RouteConfig[] = [{
  name:      `${ EXAMPLE_PRODUCT_NAME }`,
  path:      `/:product`,
  component: LandingPage,
}, {
  name:      `${ EXAMPLE_PRODUCT_NAME }-c-cluster-resource`,
  path:      `/:product/c/:cluster/:resource`,
  component: ListResource,
}, {
  name:      `${ EXAMPLE_PRODUCT_NAME }-c-cluster-resource-create`,
  path:      `/:product/c/:cluster/:resource/create`,
  component: CreateResource,
}, {
  name:      `${ EXAMPLE_PRODUCT_NAME }-c-cluster-resource-id`,
  path:      `/:product/c/:cluster/:resource/:id`,
  component: ViewResource,
}];

export default routes;
