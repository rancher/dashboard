import { PRODUCT_NAME } from '../config/image-repo.js';
import Config from '../pages/c/_cluster/manager/image/config.vue';

const routes = [{
  name:      `${ PRODUCT_NAME }-c-cluster-manager-config`,
  path:      `/${ PRODUCT_NAME }/c/:cluster/:product/:resource/config`,
  component: Config
}];

export default routes;
