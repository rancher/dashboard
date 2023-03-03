import { BLANK_CLUSTER } from '@shell/store';
import Dashboard from '../pages/index.vue';
import Page2 from '../pages/page2.vue';

export const productName = 'productregistration';

export const routes = [
  {
    name:      `${ productName }-c-cluster`,
    path:      `/:product/c/:cluster/dashboard`,
    component: Dashboard,
    meta:      {
      id:     'dashboard',
      params: {
        product: productName,
        cluster: BLANK_CLUSTER
      }
    }
  },
  {
    name:      `${ productName }-c-cluster-resource`,
    path:      `/:product/c/:cluster/page2`,
    component: Page2,
    meta:      {
      id:     'page2',
      params: {
        product: productName,
        cluster: BLANK_CLUSTER
      }
    }
  },
];
