import { formatSi } from '@/utils/units';

const CONFIG_KEYS = [
  {
    driver:           'aliyunecs',
    size:      { key: 'config.instanceType' },
    location: {
      getDisplayProperty(that) {
        return `${ that.config.region }${ that.config.zone }`;
      }
    }
  },
  {
    driver:           'amazonec2',
    size:      { key: 'config.instanceType' },
    location: {
      getDisplayProperty(that) {
        return `${ that.config.region }${ that.config.zone }`;
      }
    }
  },
  {
    driver:           'azure',
    size:      { key: 'config.size' },
    location: { key: 'config.location' }
  },
  {
    driver:           'digitalocean',
    size:      { key: 'config.size' },
    location: { key: 'config.region' }
  },
  {
    driver:           'exoscale',
    size:      { key: 'config.instanceProfile' },
    location: { key: 'config.availabilityZone' }
  },
  {
    driver:           'linode',
    size:      { key: 'config.instanceType' },
    location: { key: 'config.region' }
  },
  {
    driver:           'oci',
    size:      { key: 'config.nodeShape' },
    location: {}
  },
  {
    driver:           'packet',
    size:      { key: 'config.plan' },
    location: { key: 'config.facilityCode' }
  },
  {
    driver:           'pnap',
    size:      { key: 'config.serverType' },
    location: { key: 'config.serverLocation' }
  },
  {
    driver:           'rackspace',
    size:      { key: 'config.flavorId' },
    location: { key: 'config.region' }
  },
  {
    driver:           'vmwarevsphere',
    size:   {
      getDisplayProperty(that) {
        const size = formatSi(that.config.memorySize * 1048576, 1024, 'iB');

        return `${ size }, ${ that.config.cpuCount } Core`;
      }
    },
    location: { key: null }

  },
];

export default {
  provider() {
    const allKeys = Object.keys(this);
    const configKey = allKeys.find( k => k.endsWith('Config'));

    if ( configKey ) {
      return configKey.replace(/config$/i, '');
    }
  },

  providerConfig() {
    return this[`${ this.provider }Config`];
  },

  providerDisplay() {
    const provider = (this.provider || '').toLowerCase();

    return this.$rootGetters['i18n/withFallback'](`cluster.provider."${ provider }"`, null, 'generic.unknown', true);
  },

  providerLocation() {
    if (this.provider) {
      const config = CONFIG_KEYS.find(k => k.driver === this.provider);

      if (config?.location) {
        if (config.location.getDisplayProperty) {
          return config.location.getDisplayProperty(this);
        }
        const value = this.providerConfig[config.location.key];

        if (value) {
          return value;
        }
      }
    }

    return this.providerConfig?.region || 'No Region';
  },

  providerSize() {
    if (this.provider) {
      const config = CONFIG_KEYS.find(k => k.driver === this.provider);

      if (config?.size) {
        if (config.size.getDisplayProperty) {
          return config.size.getDisplayProperty(this);
        }
        const value = this.providerConfig[config.size.key];

        if (value) {
          return value;
        }
      }
    }

    return this.providerConfig?.size || 'No Size';
  }
};
