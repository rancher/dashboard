<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { Banner } from '@components/Banner';
import { Checkbox } from '@components/Form/Checkbox';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import ArrayList from '@shell/components/form/ArrayList';
import ACE from '@shell/edit/provisioning.cattle.io.cluster/tabs/networking/ACE';

const NETBIOS_TRUNCATION_LENGTH = 15;

export default {
  emits: [
    'update:value', 'cluster-cidr-changed', 'local-cluster-auth-endpoint-changed',
    'service-cidr-changed', 'cluster-domain-changed', 'cluster-dns-changed',
    'truncate-hostname-changed', 'ca-certs-changed', 'service-node-port-range-changed',
    'fqdn-changed', 'tls-san-changed'
  ],

  components: {
    LabeledInput,
    Banner,
    Checkbox,
    ArrayList,
    ACE
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
    }
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

    showIpv6Warning() {
      const clusterCIDR = this.serverConfig['cluster-cidr'] || '';
      const serviceCIDR = this.serverConfig['service-cidr'] || '';

      return clusterCIDR.includes(':') || serviceCIDR.includes(':');
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
    <Banner
      v-if="showIpv6Warning"
      color="warning"
    >
      {{ t('cluster.rke2.address.ipv6.warning') }}
    </Banner>
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
  </div>
</template>
