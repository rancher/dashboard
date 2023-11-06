import { PRODUCT_NAME } from '../config/image-repo.js';
import Config from '../pages/c/_cluster/manager/image/config.vue';
import Project from '../pages/c/_cluster/manager/image/project.vue';

const routes = [{
  name:      `${ PRODUCT_NAME }-c-cluster-manager-config`,
  path:      `/${ PRODUCT_NAME }/c/:cluster/:product/:resource/config`,
  component: Config
},
{
  name:      `${ PRODUCT_NAME }-c-cluster-manager-project`,
  path:      `/${ PRODUCT_NAME }/c/:cluster/:product/:resource/project`,
  component: Project
}
];

export default routes;
