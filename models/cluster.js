import day from 'dayjs';
import { escapeHtml } from '@/utils/string';
import { DATE_FORMAT } from '@/store/prefs';

export default {
  isReady() {
    return this.hasCondition('Ready') || this.type === 'cluster'; // @TODO no conditions on steve clusters yet
  },

  configName() {
    const allKeys = Object.keys(this.spec);
    const configKey = allKeys.find( kee => kee.includes('Config'));

    return configKey;
  },

  kubernetesVersion() {
    if ( this?.status?.version?.gitVersion ) {
      return this.status.version.gitVersion;
    } else {
      return this.$rootGetters['i18n/t']('generic.unknown');
    }
  },

  createdDisplay() {
    const dateFormat = escapeHtml( this.$rootGetters['prefs/get'](DATE_FORMAT));

    return day(this.metadata.creationTimestamp).format(`${ dateFormat }`);
  },

  canDelete() {
    return this.hasLink('remove') && !this?.spec?.internal;
  },
};
