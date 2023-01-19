import { RouteConfig } from 'vue-router';

import TabPage from '../pages/tab-page.vue';

export const TAB_PAGE = {
  name:   `interview-tabs`,
  params: { product: 'interview' }
};

const routes: RouteConfig[] = [{
  name:      TAB_PAGE.name,
  path:      `/:product/tab-page`,
  component: TabPage,
}];

export default routes;
