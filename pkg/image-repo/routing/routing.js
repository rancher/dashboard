import { PRODUCT_NAME } from '../config/image-repo.js';
import Config from '../pages/c/_cluster/manager/image/config.vue';
import Project from '../pages/c/_cluster/manager/image/project.vue';
import Log from '../pages/c/_cluster/manager/image/log.vue';
import ProjectDetailV2 from '../pages/c/_cluster/manager/image/projectDetail/_id.vue';
import ProjectImageDetailV2 from '../pages/c/_cluster/manager/image/projectDetail/image/_imageId.vue';

const routes = [{
  name:      `${ PRODUCT_NAME }-c-cluster-manager-config`,
  path:      `/${ PRODUCT_NAME }/c/:cluster/:product/:resource/config`,
  component: Config
},
{
  name:      `${ PRODUCT_NAME }-c-cluster-manager-project`,
  path:      `/${ PRODUCT_NAME }/c/:cluster/:product/:resource/project`,
  component: Project
},
{
  name:      `${ PRODUCT_NAME }-c-cluster-manager-project-detail-v2`,
  path:      `/${ PRODUCT_NAME }/c/:cluster/:product/:resource/project/:id`,
  component: ProjectDetailV2
},
{
  name:      `${ PRODUCT_NAME }-c-cluster-manager-project-detail-image-v2`,
  path:      `/${ PRODUCT_NAME }/c/:cluster/:product/:resource/project/:id/:roleId/image/:imageName`,
  component: ProjectImageDetailV2
},
{
  name:      `${ PRODUCT_NAME }-c-cluster-manager-log`,
  path:      `/${ PRODUCT_NAME }/c/:cluster/:product/:resource/log`,
  component: Log
},
];

export default routes;
