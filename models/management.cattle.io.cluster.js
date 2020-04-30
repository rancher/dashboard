import day from 'dayjs';
import { escapeHtml } from '@/utils/string';
import { DATE_FORMAT } from '@/store/prefs';

export default {
  isReady() {
    return this.hasCondition('Ready');
  },

  configName() {
    const allKeys = Object.keys(this.spec);
    const configKey = allKeys.find( kee => kee.includes('Config'));

    return configKey;
  },

  kubernetesVersion() {
    const k8sVersion = this?.status?.version?.gitVersion
      ? this.status.version.gitVersion
      : this.$rootGetters['i18n/t']('generic.unknown');

    return k8sVersion;
  },

  createdDisplay() {
    const dateFormat = escapeHtml( this.$rootGetters['prefs/get'](DATE_FORMAT));

    return day(this.metadata.creationTimestamp).format(`${ dateFormat }`);
  },

  canDelete() {
    return this.hasLink('remove') && !this?.spec?.internal;
  },
};
