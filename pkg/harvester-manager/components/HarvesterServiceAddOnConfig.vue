<script>
import { mapGetters } from 'vuex';
import semver from 'semver';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { _CREATE, _EDIT } from '@shell/config/query-params';
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

const HARVESTER_CLOUD_PROVIDER = 'harvester-cloud-provider';

export default {
  name: 'HarvesterServiceAddOnConfig',

  components: { LabeledSelect },

  props: {
    resource: {
      type:    Object,
      default: () => {
        return {};
      }
    },
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
    const annotations = this.resource?.metadata?.annotations || {};

    const harvesterAddOnConfig = {};

    HARVESTER_ADD_ON_CONFIG.forEach((c) => {
      harvesterAddOnConfig[c.variableName] = annotations[c.key] || c.default;
    });

    const showShareIP = !!annotations[HCI_LABELS_ANNOTATIONS.PRIMARY_SERVICE];

    return {
      ...harvesterAddOnConfig,
      showShareIP,
      rke2Versions: {},
    };
  },

  computed: {
    ...mapGetters(['allowedNamespaces', 'namespaces', 'currentCluster']),

    currentMode() {
      return this.$route?.query?.mode === _EDIT ? _EDIT : _CREATE;
    },

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
      const ports = this.resource?.spec?.ports || [];

      return ports.filter((p) => p.port && p.protocol === 'TCP').map((p) => p.port) || [];
    },

    serviceOptions() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const services = this.$store.getters[`${ inStore }/all`](SERVICE);

      const namespaces = this.namespaces();

      const out = services.filter((s) => {
        const ingress = s?.status?.loadBalancer?.ingress || [];

        return ingress.length > 0 &&
                !s?.metadata?.annotations?.[HCI_LABELS_ANNOTATIONS.PRIMARY_SERVICE] &&
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
        let ccmVersion = charts?.[HARVESTER_CLOUD_PROVIDER]?.version || '';

        if (ccmVersion.endsWith('00')) {
          ccmVersion = ccmVersion.slice(0, -2);
        }

        // check since share IP is only supported in ccm version 0.2.0 and above
        return semver.satisfies(ccmVersion, '>=0.2.0');
      } else {
        return true;
      }
    },
  },

  watch: {
    ipam() {
      this.syncAnnotations();
    },

    sharedService() {
      this.syncAnnotations();
    },

    showShareIP() {
      this.syncAnnotations();
    }
  },

  methods: {
    syncAnnotations() {
      if (!this.resource?.metadata) {
        return;
      }

      this.resource.metadata.annotations = this.resource.metadata.annotations || {};

      HARVESTER_ADD_ON_CONFIG.forEach((c) => {
        this.resource.metadata.annotations[c.key] = String(get(this, c.variableName));
      });

      if (this.showShareIP) {
        delete this.resource.metadata.annotations[HCI_LABELS_ANNOTATIONS.CLOUD_PROVIDER_IPAM];
      } else {
        delete this.resource.metadata.annotations[HCI_LABELS_ANNOTATIONS.PRIMARY_SERVICE];
      }
    },

    toggleShareIP() {
      this.showShareIP = !this.showShareIP;
    },
  },
};
</script>

<template>
  <div class="row mt-30">
    <div class="col span-6">
      <LabeledSelect
        v-if="showShareIP"
        v-model:value="sharedService"
        :mode="currentMode"
        :options="serviceOptions"
        :label="t('servicesPage.harvester.shareIP.label')"
        :disabled="currentMode === 'edit'"
      />
      <LabeledSelect
        v-else
        v-model:value="ipam"
        :mode="currentMode"
        :options="ipamOptions"
        :label="t('servicesPage.harvester.ipam.label')"
        :disabled="currentMode === 'edit'"
      />
      <div
        v-if="currentMode === 'create'"
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
</template>
