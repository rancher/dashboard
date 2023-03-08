import Page4 from '../pages/page4.vue';
import DefaultListView from '@shell/pages/c/_cluster/_product/_resource/index.vue';
import DefaultCreateView from '@shell/pages/c/_cluster/_product/_resource/create.vue';
import DefaultEditView from '@shell/pages/c/_cluster/_product/_resource/_id.vue';

export const clusterProdName = 'clusterprodreg';

export const defaultRouteParams = { product: clusterProdName };

export const routes = [
  {
    name:      `c-cluster-${ clusterProdName }-page4`,
    path:      `/c/:cluster/:product/page4`,
    component: Page4,
    meta:      {
      id:     'page4',
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
