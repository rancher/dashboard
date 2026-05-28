<script setup lang="ts">
import {
  toRefs, ref, watch, computed, WritableComputedRef
} from 'vue';
import { useStore } from 'vuex';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import { useI18n } from '@shell/composables/useI18n';
import { _CREATE } from '@shell/config/query-params';
import { RcSection } from '@components/RcSection';
import { getSubnetDisplayName, getVpcDisplayName, isIpv4Network, isIpv6Network } from '@shell/utils/aws';
import * as AWS from '@shell/types/aws-sdk';

defineOptions({ name: 'Networking' });

defineEmits([
  'update:vpcId',
  'update:subnetId',
  'validationChanged'
]);

interface Props {
  vpcId: string;
  subnetId: string;
  mode?: string;
  credentialId: any;
  region?: string;
}

const props = withDefaults(defineProps<Props>(), {
  mode:   _CREATE,
  region: ''
});

const {
  vpcId, subnetId, credentialId, region
} = toRefs(props);

const store = useStore();
const { t } = useI18n(store);
const ec2Client = ref(null);
const vpcInfo = ref<AWS.VPC[]>([]);
const subnetInfo = ref<AWS.Subnet[]>([]);
const loadingVpcs = ref(false);
const loadingSubnets = ref(false);

// TODO nb managed network should have a label applied by capi - check for this so edit loads the right strategy
const useUnmanagedNetwork = ref(false);

const networkStrategyOptions = [
  { label: t('capa.clusterConfig.network.strategy.managed'), value: false },
  { label: t('capa.clusterConfig.network.strategy.unmanaged'), value: true }
];

const vpcOptions = computed(() => {
  if (!vpcInfo.value) {
    return [];
  }

  return vpcInfo.value.map((v) => {
    return { label: getVpcDisplayName(v), value: v.VpcId };
  });
});

const subnetOptions = computed(() => {
  if (!subnetInfo.value) {
    return [];
  }

  return subnetInfo.value.reduce((opts, s) => {
    if (vpcId.value && s.VpcId !== vpcId.value ) {
      return opts;
    }
    opts.push( { label: getSubnetDisplayName(s), value: s.SubnetId });

    return opts;
  }, [] as {label: string, value: string}[]);
});

async function getVpcs() {
  loadingVpcs.value = true;

  if (!ec2Client.value) {
    vpcInfo.value = [];
    loadingVpcs.value = false;

    return;
  }

  const vpcs = await store.dispatch('aws/describeVpcs', { client: ec2Client.value });

  vpcInfo.value = vpcs || [];
  loadingVpcs.value = false;
}

async function getSubnets() {
  loadingSubnets.value = true;
  if (!ec2Client.value) {
    subnetInfo.value = [];
    loadingSubnets.value = false;

    return;
  }

  const subnets = await store.dispatch('aws/describeSubnets', { client: ec2Client.value });

  subnetInfo.value = subnets || [];
  loadingSubnets.value = false;
}

watch([
  () => region.value,
  () => credentialId.value,
], async([newRegion, newCredentialId]) => {
  if (!!newRegion && !!newCredentialId) {
    ec2Client.value = await store.dispatch('aws/ec2', {
      region:            region.value,
      cloudCredentialId: credentialId.value
    });
    getVpcs();
    getSubnets();
  } else {
    vpcInfo.value = [];
    subnetInfo.value = [];
  }
}, { immediate: true });

</script>

<template>
  <RcSection
    :title="t('capa.clusterConfig.network.title')"
    :expandable="true"
    mode="with-header"
    type="secondary"
  >
    <RadioGroup
      v-model:value="useUnmanagedNetwork"
      :label="t('capa.clusterConfig.network.strategy.label')"
      name="network-strategy"
      :options="networkStrategyOptions"
      :mode="mode"
    />
    <!-- TODO nb add localization -->
    <RcSection
      v-if="useUnmanagedNetwork"
      title="Unmanaged Network Settings"
      type="secondary"
      mode="with-header"
      :expandable="true"
    >
      <!-- //TODO nb make these inputs required when unmanagednetwork is true -->
      <div class="mb-20 span-4">
        <LabeledSelect
          :value="vpcId"
          :label="t('capa.clusterConfig.network.vpc.label')"
          :options="vpcOptions"
          :loading="loadingVpcs"
          @update:value="$emit('update:vpcId', $event)"
        />
      </div>
      <div class="mb-20 span-4">
        <LabeledSelect
          :value="subnetId"
          :label="t('capa.clusterConfig.network.subnets.label')"
          :options="subnetOptions"
          :loading="loadingSubnets"
          @update:value="$emit('update:subnetId', $event)"
        />
      </div>
    </RcSection>
  </RcSection>
</template>

<style scoped lang="scss">

</style>
