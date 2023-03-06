import { BLANK_CLUSTER } from '@shell/store';
import Dashboard from '../pages/index.vue';
import Page2 from '../pages/page2.vue';
import DefaultListView from '@shell/pages/c/_cluster/_product/_resource/index.vue';
import DefaultCreateView from '@shell/pages/c/_cluster/_product/_resource/create.vue';
import DefaultEditView from '@shell/pages/c/_cluster/_product/_resource/_id.vue';

export const productName = 'productregistration';

export const defaultRouteParams = {
  product: productName,
  cluster: BLANK_CLUSTER
};

export const routes = [
  {
    name:      `${ productName }-c-cluster`,
    path:      `/:product/c/:cluster/dashboard`,
    component: Dashboard,
    meta:      {
      id:     'dashboard',
      params: { ...defaultRouteParams }
    }
  },
  {
    name:      `${ productName }-c-cluster-page2`,
    path:      `/:product/c/:cluster/page2`,
    component: Page2,
    meta:      {
      id:     'page2',
      params: { ...defaultRouteParams }
    }
  },
  {
    name:      `${ productName }-c-cluster-resource`,
    path:      `/:product/c/:cluster/:resource`,
    component: DefaultListView,
    meta:      {
      id:     'resource',
      params: { ...defaultRouteParams }
    }
  },
  {
    name:      `${ productName }-c-cluster-resource-create`,
    path:      `/:product/c/:cluster/:resource/create`,
    component: DefaultCreateView,
  },
  {
    name:      `${ productName }-c-cluster-resource-id`,
    path:      `/:product/c/:cluster/:resource/:id`,
    component: DefaultEditView,
  },
];
