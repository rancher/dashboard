<script setup lang="ts">
import { toRefs, ref, watch, computed } from 'vue';
import { useStore } from 'vuex';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import { useI18n } from '@shell/composables/useI18n';
import { _CREATE } from '@shell/config/query-params';
import { RcSection } from '@components/RcSection';
import { getSubnetDisplayName, getVpcDisplayName } from '@shell/utils/aws';
import * as AWS from '@shell/types/aws-sdk';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { CAPA } from '../labels-annotations';

defineOptions({ name: 'Networking' });

const emit = defineEmits([
  'update:vpcId',
  'update:subnets',
  'validationChanged',
  'update:ipv6',
  'update:cidrBlock'
]);

interface Props {
  vpcId: string;
  subnets: {id: string}[];
  cidrBlock?: string;
  ipv6?: {};
  mode?: string;
  credentialId: any;
  region?: string;
}

const props = withDefaults(defineProps<Props>(), {
  mode:   _CREATE,
  region: '',
  ipv6:   undefined
});

const {
  vpcId, subnets, credentialId, region, ipv6, cidrBlock
} = toRefs(props);

const store = useStore();
const { t } = useI18n(store);
const ec2Client = ref(null);
const vpcInfo = ref<AWS.VPC[]>([]);
const subnetInfo = ref<AWS.Subnet[]>([]);
const loadingVpcs = ref(false);
const loadingSubnets = ref(false);

// TODO nb managed network should have a label applied by capi - check for this so edit loads the right strategy
// sigs.k8s.io/cluster-api-provider-aws/cluster/<cluster-name> (where <cluster-name> matches the metadata.name field of the Cluster object) tag, with a value of owned
const useUnmanagedNetwork = ref(false);

const selectedSubnetIds = computed({
  get: () => (subnets.value || []).map((s) => s.id),
  set: (ids: string[]) => {
    emit('update:subnets', ids.map((id) => ({ id })));
  }
});

const enableIpv6 = computed({
  get() {
    return !!ipv6?.value;
  },
  set(value: boolean) {
    if (value) {
      emit('update:ipv6', {});
    } else {
      emit('update:ipv6', undefined);
    }
  }
});

const networkStrategyOptions = [
  {
    label:       t('capa.clusterConfig.network.strategy.managed.label'),
    value:       false,
    description: t('capa.clusterConfig.network.strategy.managed.description')
  },
  {
    label:       t('capa.clusterConfig.network.strategy.unmanaged.label'),
    value:       true,
    description: t('capa.clusterConfig.network.strategy.unmanaged.description')
  }
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

// TODO nb select first VPC when switching to unmanaged network?
watch(useUnmanagedNetwork, (neu) => {
  if (!neu) {
    emit('update:vpcId', '');
    emit('update:subnets', []);
  }
});

watch(vpcOptions, () => {
  if (vpcId.value && vpcInfo.value) {
    const vpc = vpcInfo.value.find((v) => v.VpcId === vpcId.value);

    useUnmanagedNetwork.value = !vpc?.Tags?.some((tag) => tag.Key.startsWith(CAPA.CAPA_CLUSTER_PREFIX));
  }
});

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
    <div class="mb-10 span-6">
      <LabeledSelect
        :value="vpcId"
        :label="t('capa.clusterConfig.network.vpc.label')"
        :options="vpcOptions"
        :loading="loadingVpcs"
        :sub-label="t('capa.clusterConfig.network.vpc.description')"
        @update:value="$emit('update:vpcId', $event)"
      />
    </div>
    <div class="mb-20 span-6">
      <LabeledSelect
        v-model:value="selectedSubnetIds"
        :label="t('capa.clusterConfig.network.subnets.label')"
        :sub-label="t('capa.clusterConfig.network.subnets.description')"
        :options="subnetOptions"
        :loading="loadingSubnets"
        :multiple="true"
      />
    </div>
  </RcSection>
  <div
    v-else
    class="row mb-20"
  >
    <div class="col span-6">
      <LabeledInput
        :value="cidrBlock"
        :label="t('capa.clusterConfig.network.vpc.cidrBlock.label')"
        :placeholder="t('capa.clusterConfig.network.vpc.cidrBlock.placeholder')"
        :sub-label="t('capa.clusterConfig.network.vpc.cidrBlock.description')"
        :mode="mode"
        @update:value="$emit('update:cidrBlock', $event)"
      />
    </div>
  </div>
  <div class="row">
    <!-- TODO nb localization -->
    <Checkbox
      v-model:value="enableIpv6"
      :mode="mode"
      label="Enable IPv6"
    />
  </div>
</template>

<style scoped lang="scss">

</style>
