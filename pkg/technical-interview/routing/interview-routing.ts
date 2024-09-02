import TabPage from '../pages/tab-page.vue';
import { TECH_INTERVIEW_NAME } from '../config/tech-interview';
import { PluginRouteConfig } from '@shell/core/types';

export const TAB_PAGE = {
  name:   `interview-tabs`,
  params: { product: TECH_INTERVIEW_NAME },
  meta:   { product: TECH_INTERVIEW_NAME, pkg: TECH_INTERVIEW_NAME },
};

const routes: PluginRouteConfig[] = [{
  parent: 'plain',
  route:  {
    name:      TAB_PAGE.name,
    path:      `/:product/tab-page`,
    component: TabPage,
  }
}];

export default routes;
