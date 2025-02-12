import { CUSTOM_PAGE_NAME, PRODUCT_NAME } from '../config';
import { RouteRecordRaw } from 'vue-router';

import Registration from '../pages/Registration.vue';

const routes: RouteRecordRaw[] = [
  {
    name:      `${ PRODUCT_NAME }-c-cluster`,
    path:      `/:product/c/:cluster/${ CUSTOM_PAGE_NAME }`,
    component: Registration,
  },
];

export default routes;
