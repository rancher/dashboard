import { formatSi } from '@shell/utils/units';
import HybridModel from '@shell/plugins/steve/hybrid-class';

const CONFIG_KEYS = [
  {
    driver:   'aliyunecs',
    size:     { key: 'instanceType' },
    location: {
      getDisplayProperty(that) {
        return `${ that.providerConfig?.region }${ that.providerConfig?.zone }`;
      }
    }
  },
  {
    driver:   'amazonec2',
    size:     { key: 'instanceType' },
    location: {
      getDisplayProperty(that) {
        return `${ that.providerConfig?.region }${ that.providerConfig?.zone }`;
      }
    }
  },
  {
    driver:   'azure',
    size:     { key: 'size' },
    location: { key: 'location' }
  },
  {
    driver:   'digitalocean',
    size:     { key: 'size' },
    location: { key: 'region' }
  },
  {
    driver:   'exoscale',
    size:     { key: 'instanceProfile' },
    location: { key: 'availabilityZone' }
  },
  {
    driver:   'linode',
    size:     { key: 'instanceType' },
    location: { key: 'region' }
  },
  {
    driver:   'oci',
    size:     { key: 'nodeShape' },
    location: {}
  },
  {
    driver:   'packet',
    size:     { key: 'plan' },
    location: { key: 'facilityCode' }
  },
  {
    driver:   'pnap',
    size:     { key: 'serverType' },
    location: { key: 'serverLocation' }
  },
  {
    driver:   'rackspace',
    size:     { key: 'flavorId' },
    location: { key: 'region' }
  },
  {
    driver: 'vmwarevsphere',
    size:   {
      getDisplayProperty(that) {
        const size = formatSi(that.providerConfig?.memorySize * 1048576, 1024, 'iB');

        return `${ size }, ${ that.providerConfig?.cpuCount } Core`;
      }
    },
    location: { key: null }

  },
];

export default class NodeTemplate extends HybridModel {
  get provider() {
    const allKeys = Object.keys(this);

    const configKey = allKeys
      .filter((k) => this[k] !== null)
      .find((k) => k.endsWith('Config'));

    if ( configKey ) {
      return configKey.replace(/config$/i, '');
    }

    return null;
  }

  get providerConfig() {
    return this[`${ this.provider }Config`];
  }

  get providerDisplay() {
    const provider = (this.provider || '').toLowerCase();

    return this.$rootGetters['i18n/withFallback'](`cluster.provider."${ provider }"`, null, 'generic.unknown', true);
  }

  get providerLocation() {
    if (this.provider) {
      const config = CONFIG_KEYS.find((k) => k.driver === this.provider);

      if (config?.location) {
        if (config.location.getDisplayProperty) {
          return config.location.getDisplayProperty(this);
        }
        const value = this.providerConfig?.[config.location.key];

        if (value) {
          return value;
        }
      }
    }

    return this.providerConfig?.region || this.t('node.list.poolDescription.noLocation');
  }

  get providerSize() {
    if (this.provider) {
      const config = CONFIG_KEYS.find((k) => k.driver === this.provider);

      if (config?.size) {
        if (config.size.getDisplayProperty) {
          return config.size.getDisplayProperty(this);
        }
        const value = this.providerConfig?.[config.size.key];

        if (value) {
          return value;
        }
      }
    }

    return this.providerConfig?.size || this.t('node.list.poolDescription.noSize');
  }
}
