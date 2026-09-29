import { defineAsyncComponent } from 'vue';
import { SHARE_USAGE_DATA } from '@shell/store/prefs';
import { isAdminUser } from '@shell/store/type-map';

export const SHARE_USAGE_DATA_OPTIONS = {
  SHARE:      'share',
  DONT_SHARE: 'dont-share',
};

/**
 * Only admins decide whether the installation shares usage data, and only once.
 * Not asked in single product mode (e.g. Harvester), the data is about Rancher
 */
export function shouldAskShareUsageData(getters: any): boolean {
  return !getters['isSingleProduct'] && isAdminUser(getters) && !getters['prefs/get'](SHARE_USAGE_DATA);
}

export function openShareUsageDataDialog(commit: any) {
  commit('modal/openModal', {
    component:           defineAsyncComponent(() => import('@shell/dialog/ShareUsageDataDialog.vue')),
    modalWidth:          '640px',
    // A choice is required, so the dialog can't be dismissed
    closeOnClickOutside: false,
  });
}

export function askShareUsageDataIfNeeded(commit: any, getters: any) {
  if (shouldAskShareUsageData(getters)) {
    openShareUsageDataDialog(commit);
  }
}
