import TabPage from '../pages/tab-page.vue';
import { TECH_INTERVIEW_NAME } from '../config/tech-interview';
import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [{
  name:      `${ TECH_INTERVIEW_NAME }`,
  path:      `/${ TECH_INTERVIEW_NAME }`,
  component: TabPage,
}];

export default routes;
