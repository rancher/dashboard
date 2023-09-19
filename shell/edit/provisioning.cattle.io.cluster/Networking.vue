<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { Banner } from '@components/Banner';
import { Checkbox } from '@components/Form/Checkbox';
import ArrayList from '@shell/components/form/ArrayList';
import ACE from './ACE';

const NETBIOS_TRUNCATION_LENGTH = 15;

export default {
  components: {
    LabeledInput,
    Banner,
    Checkbox,
    ArrayList,
    ACE
  },

  mixins: [],

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
    clusterIsAlreadyCreated: {
      type:     Boolean,
      required: true,
    },
    isView: {
      type:     Boolean,
      required: true,
    },
    isEdit: {
      type:     Boolean,
      required: true,
    }

  },
  data() {
    const truncateLimit = this.value.defaultHostnameLengthLimit;

    return {
      truncateHostnames: truncateLimit === NETBIOS_TRUNCATION_LENGTH,
      truncateLimit,
    };
  },

  computed: {
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
      return this.truncateLimit && this.truncateLimit !== NETBIOS_TRUNCATION_LENGTH;
    },
  },

  methods: {},
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
          v-model="serverConfig['cluster-cidr']"
          :mode="mode"
          :disabled="clusterIsAlreadyCreated"
          :label="t('cluster.rke2.address.clusterCidr.label')"
        />
      </div>
      <div
        v-if="serverArgs['service-cidr']"
        class="col span-6"
      >
        <LabeledInput
          v-model="serverConfig['service-cidr']"
          :mode="mode"
          :disabled="clusterIsAlreadyCreated"
          :label="t('cluster.rke2.address.serviceCidr.label')"
        />
      </div>
    </div>

    <div class="row mb-20">
      <div
        v-if="serverArgs['cluster-dns']"
        class="col span-6"
      >
        <LabeledInput
          v-model="serverConfig['cluster-dns']"
          :mode="mode"
          :disabled="clusterIsAlreadyCreated"
          :label="t('cluster.rke2.address.dns.label')"
        />
      </div>
      <div
        v-if="serverArgs['cluster-domain']"
        class="col span-6"
      >
        <LabeledInput
          v-model="serverConfig['cluster-domain']"
          :mode="mode"
          :disabled="clusterIsAlreadyCreated"
          :label="t('cluster.rke2.address.domain.label')"
        />
      </div>
    </div>

    <div
      v-if="serverArgs['service-node-port-range']"
      class="row mb-20"
    >
      <div class="col span-6">
        <LabeledInput
          v-model="serverConfig['service-node-port-range']"
          :mode="mode"
          :label="t('cluster.rke2.address.nodePortRange.label')"
        />
      </div>
      <div
        class="col span-6"
      >
        <Checkbox
          v-if="!isView || isView && !hostnameTruncationManuallySet"
          value="truncateHostnames"
          class="mt-20"
          :disabled="isEdit || isView || hostnameTruncationManuallySet"
          :mode="mode"
          :label="t('cluster.rke2.truncateHostnames')"
          @input="$emit('kubernetes-changed', $event)"
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
          v-model="serverConfig['tls-san']"
          :protip="false"
          :mode="mode"
          :title="t('cluster.rke2.address.tlsSan.label')"
        />
      </div>
    </div>

    <ACE
      v-model="value"
      :mode="mode"
    />
  </div>
</template>
