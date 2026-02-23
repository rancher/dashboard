<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { Banner } from '@components/Banner';
import { Checkbox } from '@components/Form/Checkbox';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import ArrayList from '@shell/components/form/ArrayList';
import ACE from '@shell/edit/provisioning.cattle.io.cluster/tabs/networking/ACE';
import LabeledSelect from '@shell/components/form/LabeledSelect';

const NETBIOS_TRUNCATION_LENGTH = 15;

export const STACK_PREFS = {
  IPV4: 'ipv4',
  IPV6: 'ipv6',
  DUAL: 'dual'
};

export default {
  emits: [
    'update:value', 'cluster-cidr-changed', 'local-cluster-auth-endpoint-changed',
    'service-cidr-changed', 'cluster-domain-changed', 'cluster-dns-changed',
    'truncate-hostname-changed', 'ca-certs-changed', 'service-node-port-range-changed',
    'fqdn-changed', 'tls-san-changed', 'stack-preference-changed', 'validationChanged', 'flannel-ipv6-masq-changed'
  ],

  components: {
    LabeledInput,
    Banner,
    Checkbox,
    ArrayList,
    ACE,
    LabeledSelect
  },

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },

    selectedVersion: {
      type:     Object,
      required: true,
    },

    truncateLimit: {
      type:     Number,
      required: false,
      default:  0
    },

    hasSomeIpv6Pools: {
      type:    Boolean,
      default: false
    },

    flannelIpv6Masq: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return { STACK_PREFS };
  },

  computed: {
    truncateHostnames() {
      return this.truncateLimit === NETBIOS_TRUNCATION_LENGTH;
    },

    serverConfig() {
      return this.value.spec.rkeConfig.machineGlobalConfig;
    },

    serverArgs() {
      return this.selectedVersion?.serverArgs || {};
    },

    stackPreferenceOptions() {
      return [{
        label: this.t('cluster.rke2.stackPreference.options.ipv4'),
        value: STACK_PREFS.IPV4
      },
      {
        label: this.t('cluster.rke2.stackPreference.options.ipv6'),
        value: STACK_PREFS.IPV6
      }, {
        label: this.t('cluster.rke2.stackPreference.options.dual'),
        value: STACK_PREFS.DUAL
      },
      ];
    },

    hostnameTruncationManuallySet() {
      return !!this.truncateLimit && this.truncateLimit !== NETBIOS_TRUNCATION_LENGTH;
    },

    isEdit() {
      return this.mode === _EDIT;
    },

    isView() {
      return this.mode === _VIEW;
    },

    localValue: {
      get() {
        return this.value;
      },
      set(newValue) {
        this.$emit('update:value', newValue);
      }
    },

    stackPreference: {
      get() {
        return this.localValue.spec?.networking?.stackPreference || STACK_PREFS.IPV4;
      },
      set(neu) {
        if (!this.localValue.spec.networking) {
          this.localValue.spec.networking = {};
        }
        this.localValue.spec.networking.stackPreference = neu;
      }
    },

    isK3s() {
      return (this.selectedVersion?.label || '').includes('k3s');
    },

    showFlannelMasq() {
      const flannelEnabled = this.value?.spec?.rkeConfig?.machineGlobalConfig?.['flannel-backend'] !== 'none';

      return this.isK3s && flannelEnabled;
    },

    isIpv6StackPref() {
      return [STACK_PREFS.IPV6, STACK_PREFS.DUAL].includes(this.value?.spec?.rkeConfig?.networking?.stackPreference);
    },

    isIpv6ServerConfig() {
      const clusterCIDR = this.serverConfig['cluster-cidr'] || '';
      const serviceCIDR = this.serverConfig['service-cidr'] || '';

      return clusterCIDR.includes(':') || serviceCIDR.includes(':');
    },

    isProbablyIPv6() {
      return this.hasSomeIpv6Pools || this.isIpv6StackPref || this.isIpv6ServerConfig;
    },
  }
};
</script>

<template>
  <div>
    <h3>
      {{ t('cluster.rke2.address.header') }}
      <i
        v-clean-tooltip="t('cluster.rke2.address.tooltip')"
        class="icon icon-info"
      />
    </h3>
    <div class="row mb-20">
      <div
        v-if="serverArgs['cluster-cidr']"
        class="col span-6"
      >
        <LabeledInput
          :value="serverConfig['cluster-cidr']"
          :mode="mode"
          :disabled="isEdit"
          :label="t('cluster.rke2.address.clusterCidr.label')"
          data-testid="cluster-cidr"
          @update:value="$emit('cluster-cidr-changed', $event)"
        />
      </div>
      <div
        v-if="serverArgs['service-cidr']"
        class="col span-6"
      >
        <LabeledInput
          :value="serverConfig['service-cidr']"
          :mode="mode"
          :disabled="isEdit"
          :label="t('cluster.rke2.address.serviceCidr.label')"
          data-testid="service-cidr"
          @update:value="$emit('service-cidr-changed', $event)"
        />
      </div>
    </div>

    <div class="row mb-20">
      <div
        v-if="serverArgs['cluster-dns']"
        class="col span-6"
      >
        <LabeledInput
          :value="serverConfig['cluster-dns']"
          :mode="mode"
          :disabled="isEdit"
          :label="t('cluster.rke2.address.dns.label')"
          @update:value="$emit('cluster-dns-changed', $event)"
        />
      </div>
      <div
        v-if="serverArgs['cluster-domain']"
        class="col span-6"
      >
        <LabeledInput
          :value="serverConfig['cluster-domain']"
          :mode="mode"
          :disabled="isEdit"
          :label="t('cluster.rke2.address.domain.label')"
          @update:value="$emit('cluster-domain-changed', $event)"
        />
      </div>
    </div>

    <div
      v-if="serverArgs['service-node-port-range']"
      class="row mb-20"
    >
      <div class="col span-6">
        <LabeledInput
          :value="serverConfig['service-node-port-range']"
          :mode="mode"
          :label="t('cluster.rke2.address.nodePortRange.label')"
          @update:value="$emit('service-node-port-range-changed', $event)"
        />
      </div>
      <div
        class="col span-6"
      >
        <Checkbox
          v-if="!isView || isView && !hostnameTruncationManuallySet"
          :value="truncateHostnames"
          class="mt-20"
          :disabled="isEdit || isView || hostnameTruncationManuallySet"
          :mode="mode"
          :label="t('cluster.rke2.truncateHostnames')"
          data-testid="network-tab-truncate-hostname"
          @update:value="$emit('truncate-hostname-changed', $event)"
        />
        <Banner
          v-if="hostnameTruncationManuallySet"
          color="info"
        >
          <div class="text">
            {{ t('cluster.machinePool.truncationCluster', { limit: truncateLimit }) }}
          </div>
        </Banner>
      </div>
    </div>

    <div
      v-if="serverArgs['tls-san']"
      class="row mb-20"
    >
      <div class="col span-6">
        <ArrayList
          :value="serverConfig['tls-san']"
          :protip="false"
          :mode="mode"
          :title="t('cluster.rke2.address.tlsSan.label')"
          @update:value="$emit('tls-san-changed', $event)"
        />
      </div>
    </div>
    <h3 v-t="'cluster.tabs.ace'" />
    <ACE
      v-model:value="localValue.spec.localClusterAuthEndpoint"
      :mode="mode"
      @fqdn-changed="$emit('fqdn-changed', $event)"
      @caCerts-changed="$emit('ca-certs-changed', $event)"
      @local-cluster-auth-endpoint-changed="$emit('local-cluster-auth-endpoint-changed', $event)"
    />

    <h3
      v-t="'cluster.rke2.stackPreference.label'"
      class="mt-20"
    />
    <t
      k="cluster.rke2.stackPreference.description"
      raw
      class="text-muted"
    />
    <div class="ro mt-10 mb-20">
      <div class="col span-3">
        <LabeledSelect
          :key="hasSomeIpv6Pools"
          :value="localValue?.spec?.rkeConfig?.networking?.stackPreference || STACK_PREFS.IPV4"
          :mode="mode"
          :options="stackPreferenceOptions"
          data-testid="network-tab-stackpreferences"
          :require-dirty="false"
          @selecting="e=>$emit('stack-preference-changed', e)"
          @update:validation="e=>$emit('validationChanged', e)"
        />
      </div>
    </div>
    <template v-if="showFlannelMasq">
      <h3
        v-t="'cluster.k3s.flannelMasq.title'"
        class="mt-20"
      />
      <Banner
        v-if="isProbablyIPv6"
        color="warning"
        data-testid="cluster-rke2-flannel-masq-banner"
        :label="t('cluster.k3s.flannelMasq.banner', null, true)"
      />
      <div
        class="row mb-20 "
      >
        <div
          class="col"
        >
          <Checkbox
            :value="flannelIpv6Masq"
            data-testid="cluster-rke2-flannel-masq-checkbox"
            :mode="mode"
            :label="t('cluster.k3s.flannelMasq.label')"
            @update:value="e=>$emit('flannel-ipv6-masq-changed', e)"
          />
        </div>
      </div>
    </template>
  </div>
</template>
