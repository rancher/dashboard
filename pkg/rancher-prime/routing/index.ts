import { CUSTOM_PAGE_NAME, SETTING_PAGE_NAME, SETTING_PRODUCT } from '../config/constants';
import { RouteRecordRaw } from 'vue-router';

import Registration from '../pages/Registration.vue';

const routes: RouteRecordRaw[] = [
  {
    name:      SETTING_PAGE_NAME,
    path:      `/c/:cluster/settings/${ CUSTOM_PAGE_NAME }`, // /c/local/settings/registration
    component: Registration,
    meta:      { product: SETTING_PRODUCT },
  },
];

export default routes;
