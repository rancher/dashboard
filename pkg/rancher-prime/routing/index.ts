import { CUSTOM_PAGE_NAME, SETTING_PAGE_NAME, PRODUCT_SETTING_NAME } from '../config/constants';
import { RouteRecordRaw } from 'vue-router';

import Registration from '../pages/Registration.vue';

const routes: RouteRecordRaw[] = [
  {
    name:      SETTING_PAGE_NAME,
    path:      `/c/:cluster/settings/${ CUSTOM_PAGE_NAME }`, // /c/local/settings/registration
    component: Registration,
    meta:      { product: PRODUCT_SETTING_NAME },
  },
];

export default routes;
