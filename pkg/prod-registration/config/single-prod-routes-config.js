import { BLANK_CLUSTER } from '@shell/store';
import Page1 from '../pages/page1.vue';
import Page2 from '../pages/page2.vue';
import Page3 from '../pages/page3.vue';
import DefaultListView from '@shell/pages/c/_cluster/_product/_resource/index.vue';
import DefaultCreateView from '@shell/pages/c/_cluster/_product/_resource/create.vue';
import DefaultEditView from '@shell/pages/c/_cluster/_product/_resource/_id.vue';

export const singleProdName = 'singleprodreg';

export const defaultRouteParams = {
  product: singleProdName,
  cluster: BLANK_CLUSTER
};

export const routes = [
  {
    name:      `${ singleProdName }-c-cluster`,
    path:      `/:product/c/:cluster/page1`,
    component: Page1,
    meta:      {
      id:     'page1',
      params: { ...defaultRouteParams }
    }
  },
  {
    name:      `${ singleProdName }-c-cluster-page2`,
    path:      `/:product/c/:cluster/page2`,
    component: Page2,
    meta:      {
      id:     'page2',
      params: { ...defaultRouteParams }
    }
  },
  {
    name:      `${ singleProdName }-c-cluster-page3`,
    path:      `/:product/c/:cluster/page3`,
    component: Page3,
    meta:      {
      id:     'page3',
      params: { ...defaultRouteParams }
    }
  },
  {
    name:      `${ singleProdName }-c-cluster-resource`,
    path:      `/:product/c/:cluster/:resource`,
    component: DefaultListView,
    meta:      {
      id:     'resource',
      params: { ...defaultRouteParams }
    }
  },
  {
    name:      `${ singleProdName }-c-cluster-resource-create`,
    path:      `/:product/c/:cluster/:resource/create`,
    component: DefaultCreateView,
  },
  {
    name:      `${ singleProdName }-c-cluster-resource-id`,
    path:      `/:product/c/:cluster/:resource/:id`,
    component: DefaultEditView,
  },
];
