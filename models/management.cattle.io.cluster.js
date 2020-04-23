import { capitalize } from 'lodash';
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
    const configName = this.configName;
    const k8sVersion = this.spec[configName]
      ? this.spec[configName].kubernetesVersion
      : this.$rootGetters['i18n/t']('generic.unknown');

    return k8sVersion;
  },

  createdDisplay() {
    const dateFormat = escapeHtml( this.$rootGetters['prefs/get'](DATE_FORMAT));

    return day(this.metadata.creationTimestamp).format(`${ dateFormat }`);
  },

  displayProvider() {
    const configName = this.configName?.toLowerCase();
    const driver = this.status?.driver;
    const key = `cluster.provider.${ configName }`;

    if ( this.$rootGetters['i18n/exists'](key) ) {
      return this.$rootGetters['i18n/t'](key);
    } else if (driver && configName) {
      return capitalize(driver);
    } else {
      return this.$rootGetters['i18n/t']('cluster.provider.importedconfig');
    }
  },
};
