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

    return this.spec[configName].kubernetesVersion;
  },

  createdDisplay() {
    const dateFormat = escapeHtml( this.$rootGetters['prefs/get'](DATE_FORMAT));

    return day(this.metadata.creationTimestamp).format(`${ dateFormat }`);
  },

  displayProvider() {
    const configName = this.configName.toLowerCase();
    // const pools = get(this, 'nodePools');
    // const firstPool = (pools || []).objectAt(0);

    switch ( configName ) {
    case 'amazonelasticcontainerserviceconfig':
      return 'Amazon EKS';
    case 'azurekubernetesserviceconfig':
      return 'Azure AKS';
    case 'googlekubernetesengineconfig':
      return 'Google GKE';
    case 'tencentengineconfig':
      return 'Tencent TKE';
    case 'aliyunengineconfig':
      return 'Alibaba ACK';
    case 'huaweiengineconfig':
      return 'Huawei CCE';
    case 'k3sconfig':
      return 'k3s';
    case 'rancherkubernetesengineconfig':
      // if ( !!pools ) {
      //   if ( firstPool ) {
      //     return get(firstPool, 'displayProvider') ? get(firstPool, 'displayProvider') : intl.t('clusterNew.rke.shortLabel');
      //   } else {
      //     return 'Custom';
      //   }
      // } else {
      //   return 'Custom';
      // }
      return 'Custom';
    default:
      if (this.status?.driver && this.configName) {
        return capitalize(this.status.driver);
      } else {
        return 'Imported';
      }
    }
  },
};
