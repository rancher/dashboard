<script>
import { mapGetters } from 'vuex';
import semver from 'semver';

import LabeledSelect from '@shell/components/form/LabeledSelect';
import { _CREATE } from '@shell/config/query-params';
import { get } from '@shell/utils/object';
import { HCI as HCI_LABELS_ANNOTATIONS } from '@shell/config/labels-annotations';
import { SERVICE } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

const HARVESTER_ADD_ON_CONFIG = [{
  variableName: 'ipam',
  key:          HCI_LABELS_ANNOTATIONS.CLOUD_PROVIDER_IPAM,
  default:      'dhcp'
}, {
  variableName: 'sharedService',
  key:          HCI_LABELS_ANNOTATIONS.PRIMARY_SERVICE,
  default:      ''
}];

export default {
  components: { LabeledSelect },

  props: {
    mode: {
      type:    String,
      default: _CREATE,
    },

    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    registerBeforeHook: {
      type:    Function,
      default: null
    },
  },

  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.willSave, 'harvesterWillSave');
    }
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    const hash = {
      rke2Versions: this.$store.dispatch('management/request', { url: '/v1-rke2-release/releases' }),
      services:     this.$store.dispatch(`${ inStore }/findAll`, { type: SERVICE }),
    };

    const res = await allHash(hash);

    this.rke2Versions = res.rke2Versions;
  },

  data() {
    const harvesterAddOnConfig = {};

    HARVESTER_ADD_ON_CONFIG.forEach((c) => {
      harvesterAddOnConfig[c.variableName] = this.value.metadata.annotations[c.key] || c.default;
    });

    let showShareIP;

    if (this.value.metadata.annotations[HCI_LABELS_ANNOTATIONS.PRIMARY_SERVICE]) {
      showShareIP = true;
    } else {
      showShareIP = false;
    }

    return {
      ...harvesterAddOnConfig,
      showShareIP,
      rke2Versions: {},
    };
  },

  computed: {
    ...mapGetters(['allowedNamespaces', 'namespaces', 'currentCluster']),

    ipamOptions() {
      return [{
        label: 'DHCP',
        value: 'dhcp',
      }, {
        label: 'Pool',
        value: 'pool',
      }];
    },

    portOptions() {
      const ports = this.value?.spec?.ports || [];

      return ports.filter((p) => p.port && p.protocol === 'TCP').map((p) => p.port) || [];
    },

    serviceOptions() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const services = this.$store.getters[`${ inStore }/all`](SERVICE);

      const namespaces = this.namespaces();

      const out = services.filter((s) => {
        const ingress = s?.status?.loadBalancer?.ingress || [];

        return ingress.length > 0 &&
                !s?.metadata?.annotations?.['cloudprovider.harvesterhci.io/primary-service'] &&
                s.spec?.type === 'LoadBalancer' &&
                namespaces[s.metadata.namespace];
      });

      return out.map((s) => s.id);
    },

    shareIPEnabled() {
      const kubernetesVersion = this.currentCluster.kubernetesVersion || '';
      const kubernetesVersionExtension = this.currentCluster.kubernetesVersionExtension;

      if (kubernetesVersionExtension.startsWith('+rke2')) {
        const charts = ((this.rke2Versions?.data || []).find((v) => v.id === kubernetesVersion) || {}).charts;
        let ccmVersion = charts?.['harvester-cloud-provider']?.version || '';

        if (ccmVersion.endsWith('00')) {
          ccmVersion = ccmVersion.slice(0, -2);
        }

        return semver.satisfies(ccmVersion, '>=0.2.0');
      } else {
        return true;
      }
    },
  },

  methods: {
    willSave() {
      const errors = [];

      if (this.showShareIP) {
        if (!this.sharedService) {
          errors.push(this.t('validation.required', { key: this.t('servicesPage.harvester.shareIP.label') }, true));
        }
      }

      if (errors.length > 0) {
        return Promise.reject(errors);
      }

      HARVESTER_ADD_ON_CONFIG.forEach((c) => {
        this.value.metadata.annotations[c.key] = String(get(this, c.variableName));
      });

      if (this.showShareIP) {
        delete this.value.metadata.annotations[HCI_LABELS_ANNOTATIONS.CLOUD_PROVIDER_IPAM];
      } else {
        delete this.value.metadata.annotations[HCI_LABELS_ANNOTATIONS.PRIMARY_SERVICE];
      }
    },

    toggleShareIP() {
      this.showShareIP = !this.showShareIP;
    },
  },
};
</script>

<template>
  <div>
    <div class="row mt-30">
      <div class="col span-6">
        <LabeledSelect
          v-if="showShareIP"
          v-model:value="sharedService"
          :mode="mode"
          :options="serviceOptions"
          :label="t('servicesPage.harvester.shareIP.label')"
          :disabled="mode === 'edit'"
        />
        <LabeledSelect
          v-else
          v-model:value="ipam"
          :mode="mode"
          :options="ipamOptions"
          :label="t('servicesPage.harvester.ipam.label')"
          :disabled="mode === 'edit'"
        />
        <div
          v-if="mode === 'create'"
          class="mt-10"
        >
          <a
            role="button"
            @click="toggleShareIP"
          >
            {{ showShareIP ? t('servicesPage.harvester.useIpam.label') : t('servicesPage.harvester.useShareIP.label') }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
