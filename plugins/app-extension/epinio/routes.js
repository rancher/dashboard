import { EXTENSION_PREFIX } from '../../../utils/extensions';
import { EPINIO_PRODUCT_NAME } from './types';

export default resolve => [{
  name:      `${ EXTENSION_PREFIX }-${ EPINIO_PRODUCT_NAME }`,
  path:      `/${ EXTENSION_PREFIX }/epinio`,
  component: resolve(__dirname, 'pages/index.vue'),
}, {
  name:      `${ EXTENSION_PREFIX }-${ EPINIO_PRODUCT_NAME }-c`,
  path:      `/${ EXTENSION_PREFIX }/epinio/c`,
  component: resolve(__dirname, 'pages/c/index.vue'),
}, {
  name:      `${ EXTENSION_PREFIX }-${ EPINIO_PRODUCT_NAME }-c-cluster`,
  path:      `/${ EXTENSION_PREFIX }/epinio/c/:cluster`,
  component: resolve(__dirname, 'pages/c/_cluster/index.vue')
}, {
  name:      `${ EXTENSION_PREFIX }-${ EPINIO_PRODUCT_NAME }-c-cluster-resource`,
  path:      `/${ EXTENSION_PREFIX }/epinio/c/:cluster/:resource`,
  component: resolve(__dirname, 'pages/c/_cluster/_resource/index.vue')
}, {
  name:      `${ EXTENSION_PREFIX }-${ EPINIO_PRODUCT_NAME }-c-cluster-resource-create`,
  path:      `/${ EXTENSION_PREFIX }/epinio/c/:cluster/:resource/create`,
  component: resolve(__dirname, 'pages/c/_cluster/_resource/create.vue')
}, {
  name:      `${ EXTENSION_PREFIX }-${ EPINIO_PRODUCT_NAME }-c-cluster-resource-id`,
  path:      `/${ EXTENSION_PREFIX }/epinio/c/:cluster/:resource/:id`,
  component: resolve(__dirname, 'pages/c/_cluster/_resource/_id.vue')
}];
