import Page3 from '../pages/page3.vue';
import DefaultListView from '@shell/pages/c/_cluster/_product/_resource/index.vue';
import DefaultCreateView from '@shell/pages/c/_cluster/_product/_resource/create.vue';
import DefaultEditView from '@shell/pages/c/_cluster/_product/_resource/_id.vue';

export const clusterProdName = 'clusterprodreg';

export const defaultRouteParams = { product: clusterProdName };

export const routes = [
  {
    name:      `c-cluster-${ clusterProdName }-page3`,
    path:      `/c/:cluster/:product/page3`,
    component: Page3,
    meta:      {
      id:     'page3',
      params: { ...defaultRouteParams },
    }
  },
  {
    name:      `c-cluster-${ clusterProdName }-resource`,
    path:      `/c/:cluster/:product/:resource`,
    component: DefaultListView,
    meta:      {
      id:     'resource',
      params: { ...defaultRouteParams },
    }
  },
  {
    name:      `c-cluster-${ clusterProdName }-resource-create`,
    path:      `/c/:cluster/:product/:resource/create`,
    component: DefaultCreateView,
  },
  {
    name:      `c-cluster-${ clusterProdName }-resource-id`,
    path:      `/c/:cluster/:product/:resource/:id`,
    component: DefaultEditView,
  },
];
