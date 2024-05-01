import Vue from 'vue';
import { Portal, PortalTarget, MountingPortal } from 'portal-vue';

const portalVue = {
  install: (Vue) => {
    Vue.component('portal', Portal);
    Vue.component('portal-target', PortalTarget);
    Vue.component('mounting-portal', MountingPortal);
  }
};

export default portalVue;
/* eslint-disable-next-line no-console */
console.warn('The implicit addition of portal-vue has been deprecated in Rancher Shell and will be removed in a future version. Make sure to invoke `Vue.use(portalVue)` to maintain compatibility.');

Vue.use(portalVue);
