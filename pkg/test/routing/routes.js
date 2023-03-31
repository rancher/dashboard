import { BLANK_CLUSTER } from '@shell/store';
import ListResource from '@shell/pages/c/_cluster/_product/_resource/index.vue';
import CreateResource from '@shell/pages/c/_cluster/_product/_resource/create.vue';
import ViewResource from '@shell/pages/c/_cluster/_product/_resource/_id.vue';
import ListNamespacedResource from '@shell/pages/c/_cluster/_product/_resource/_namespace/_id.vue';
import page2 from '../pages/page2.vue';
import page1 from '../pages/page1.vue';

// to achieve naming consistency throughout the extension
// we recommend this to be defined on a config file and exported
// so that the developer can import it wherever it needs to be used
const YOUR_PRODUCT_NAME = 'myProd';

const routes = [
  {
    name:      `${ YOUR_PRODUCT_NAME }-c-cluster-page1`,
    path:      `/${ YOUR_PRODUCT_NAME }/c/:cluster/page1`,
    component: page1,
    meta:      {
      product: YOUR_PRODUCT_NAME,
      cluster: BLANK_CLUSTER
    },
  },
  {
    name:      `${ YOUR_PRODUCT_NAME }-c-cluster-page2`,
    path:      `/${ YOUR_PRODUCT_NAME }/c/:cluster/page2`,
    component: page2,
    meta:      {
      product: YOUR_PRODUCT_NAME,
      cluster: BLANK_CLUSTER
    },
  },
  {
    name:      `${ YOUR_PRODUCT_NAME }-c-cluster-page3`,
    path:      `/${ YOUR_PRODUCT_NAME }/c/:cluster/page3`,
    component: page2,
    meta:      {
      product: YOUR_PRODUCT_NAME,
      cluster: BLANK_CLUSTER
    },
  },
  {
    name:      `${ YOUR_PRODUCT_NAME }-c-cluster-resource`,
    path:      `/${ YOUR_PRODUCT_NAME }/c/:cluster/:resource`,
    component: ListResource,
    meta:      {
      product: YOUR_PRODUCT_NAME,
      cluster: BLANK_CLUSTER
    },
  },
  {
    name:      `${ YOUR_PRODUCT_NAME }-c-cluster-resource-create`,
    path:      `/${ YOUR_PRODUCT_NAME }/c/:cluster/:resource/create`,
    component: CreateResource,
    meta:      {
      product: YOUR_PRODUCT_NAME,
      cluster: BLANK_CLUSTER
    },
  },
  {
    name:      `${ YOUR_PRODUCT_NAME }-c-cluster-resource-id`,
    path:      `/${ YOUR_PRODUCT_NAME }/c/:cluster/:resource/:id`,
    component: ViewResource,
    meta:      {
      product: YOUR_PRODUCT_NAME,
      cluster: BLANK_CLUSTER
    },
  },
  {
    name:      `${ YOUR_PRODUCT_NAME }-c-cluster-resource-namespace-id`,
    path:      `/${ YOUR_PRODUCT_NAME }/:cluster/:resource/:namespace/:id`,
    component: ListNamespacedResource,
    meta:      {
      product: YOUR_PRODUCT_NAME,
      cluster: BLANK_CLUSTER
    },
  }
];

export default routes;
