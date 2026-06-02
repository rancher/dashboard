<script setup lang="ts">
import {
  computed, onMounted, toRefs, ref, WritableComputedRef, watch
} from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { RcSection } from '@components/RcSection';
import { _CREATE } from '@shell/config/query-params';
import merge from 'lodash/merge';
import Networking from './Networking.vue';
import IngressRules from './IngressRules.vue';
import SecurityOverrides from './SecurityOverrides.vue';
import { removeEmptyFields } from '../utils';
import { NORMAN } from '@shell/config/types';
import { set } from '@shell/utils/object.js';
import KeyValue from '@shell/components/form/KeyValue.vue';

defineOptions({ name: 'ClusterConfiguration' });

const emit = defineEmits<{(e: 'update:value', value: any): void }>();

// const AWS_CLUSTER_SCHEMA = 'infrastructure.cluster.x-k8s.io.awscluster';
// const DEFAULT_WORKSPACE = 'fleet-default'; // TODO

const defaultConfig = {
  spec: {
    // region:  'us-west-2',
    network: {
      additionalControlPlaneIngressRules: [{
        protocol: '-1', sourceSecurityGroupRoles: ['controlplane', 'node'], description: 'Allow all traffic between control plane and node security groups'
      }],
      additionalNodeIngressRules: [{
        protocol: '-1', sourceSecurityGroupRoles: ['controlplane', 'node'], description: 'Allow all traffic between control plane and node security groups'
      }],
      cni:                    { cniIngressRules: [] },
      securityGroupOverrides: {},
      vpc:                    {},
      // vpc:                                { id: 'vpc-07cdd250a077f6773' }, // id: '', cidrBlock: '', ipv6: {},
      // subnets:                            [{ id: 'subnet-02e4caf6f4ee75111' }]
    },
    sshKeyName:               '',
    additionalTags:           {},
    identityRef:              { name: 'cluster-identity', kind: 'AWSClusterStaticIdentity' },
    controlPlaneLoadBalancer: {
      healthCheckProtocol: 'TCP',
      loadBalancerType:    'nlb'
    }
  }
};

interface Props {
  value: any;
  mode: string;
  provider?: string;
  credentialId?: any;
}

const props = withDefaults(defineProps<Props>(), {
  mode:         _CREATE,
  value:        () => ({ spec: {} }),
  provider:     '',
  credentialId: null,
});

const {
  mode,
  value,
  credentialId,
} = toRefs(props);

// Ensure spec is always present and reactive
if (value.value && !value.value.spec) {
  value.value.spec = {};
}

const store = useStore();
const { t } = useI18n(store);
// const config = ref({});
const ec2Client = ref(null);
const regionInfo = ref([]);
const sshKeyInfo = ref([]);
const loadingRegions = ref(false);
const loadingSshKeys = ref(false);
const allowAdditionalCPRules = ref(true);
const allowAdditionalNodeRules = ref(true);

// TODO nb generic set-if-not-set for region, sshKeyName, vpcId, firstSubnetId, se3curityGroupOverrides, xyzIngressRules
const region: WritableComputedRef<string> = computed({
  get: () => value?.value?.spec?.region || '',
  set: (newRegion: string) => {
    if (value.value) {
      value.value.spec = value.value.spec || {};
      value.value.spec.region = newRegion;
    }
    emit('update:value', value.value);
  },
});

const sshKeyName: WritableComputedRef<string> = computed({
  get: () => value?.value?.spec?.sshKeyName || '',
  set: (newKey: string) => {
    if (value.value) {
      value.value.spec = value.value.spec || {};
      value.value.spec.sshKeyName = newKey;
    }
    emit('update:value', value.value);
  },
});

const vpcId: WritableComputedRef<string> = computed({
  get: () => value?.value?.spec?.network?.vpc?.id || '',
  set: (vpc: string) => {
    if (value.value) {
      if (!value.value?.spec?.network?.vpc) {
        set(value.value, 'spec.network.vpc', { id: vpc });
      } else {
        value.value.spec.network.vpc.id = vpc;
      }
    }
    emit('update:value', value.value);
  },
});

const ipv6: WritableComputedRef<string> = computed({
  get: () => value?.value?.spec?.network?.ipv6 || null,
  set: (neu: object | undefined) => {
    if (value.value && neu) {
      if (!value.value.spec.network) {
        set(value.value, 'spec.network', {});
      }
      value.value.spec.network.ipv6 = neu;
    } else {
      delete value.value.spec.network.ipv6;
    }
    emit('update:value', value.value);
  },
});

const securityGroupOverrides: WritableComputedRef<{}> = computed({
  get: () => value?.value?.spec?.network?.securityGroupOverrides || {},
  set: (neu: any) => {
    if (value.value) {
      if (!value.value?.spec?.network) {
        set(value.value, 'spec.network', { securityGroupOverrides: neu });
      } else {
        value.value.spec.network.securityGroupOverrides = neu;
      }
      allowAdditionalNodeRules.value = !neu.node;
      allowAdditionalCPRules.value = !neu.controlplane;
    }
    emit('update:value', value.value);
  },
});

const subnets: WritableComputedRef<{id: string}[]> = computed({
  get: () => value?.value?.spec?.network?.subnets || [],
  set: (neu: {id: string}[]) => {
    if (value.value) {
      if (!value.value?.spec?.network) {
        set(value.value, 'spec.network', { subnets: neu });
      } else {
        value.value.spec.network.subnets = neu;
      }
    }
    emit('update:value', value.value);
  },
});

const additionalControlPlaneIngressRules = computed({
  get: () => value?.value?.spec?.network?.additionalControlPlaneIngressRules || [],
  set: (rules: any[]) => {
    if (value.value) {
      if (!value.value?.spec?.network) {
        set(value.value, 'spec.network', {});
      }
      value.value.spec.network.additionalControlPlaneIngressRules = rules;
    }
    emit('update:value', value.value);
  },
});

const additionalNodeIngressRules = computed({
  get: () => value?.value?.spec?.network?.additionalNodeIngressRules || [],
  set: (rules: any[]) => {
    if (value.value) {
      if (!value.value?.spec?.network) {
        set(value.value, 'spec.network', {});
      }
      value.value.spec.network.additionalNodeIngressRules = rules;
    }
    emit('update:value', value.value);
  },
});

const additionalTags = computed({
  get: () => value?.value?.spec?.additionalTags || {},
  set: (tags: {}) => {
    if (value.value) {
      set(value.value, 'spec.additionalTags', tags);
    }
    emit('update:value', value.value);
  },
});

const cniIngressRules = computed({
  get: () => value?.value?.spec?.network?.cni?.cniIngressRules || [],
  set: (rules: any[]) => {
    if (value.value) {
      if (!value.value?.spec?.network) {
        set(value.value, 'spec.network', {});
      }
      if (!value.value.spec.network.cni) {
        value.value.spec.network.cni = {};
      }
      value.value.spec.network.cni.cniIngressRules = rules;
    }
    emit('update:value', value.value);
  },
});

const regionOptions = computed(() => {
  if ( !regionInfo.value ) {
    return [];
  }

  return regionInfo.value.map((obj) => {
    return obj.RegionName;
  }).sort();
});

const sshKeyOptions = computed(() => {
  const noneOption = { label: t('capa.clusterConfig.sshKeyName.noneLabel'), value: '' };

  if (!sshKeyInfo.value) {
    return [noneOption];
  }

  return [noneOption, ...sshKeyInfo.value.map((k) => {
    return { label: k.KeyName, value: k.KeyPairId };
  })];
});

function initDefaultRegion() {
  let cloudCredential;

  try {
    cloudCredential = credentialId.value ? store.getters['rancher/byId']( NORMAN.CLOUD_CREDENTIAL, credentialId.value ) : {};
  } catch {
    // TODO nb cant load default region?
  }
  const region = value.value?.spec?.region || cloudCredential?.amazonec2credentialConfig?.defaultRegion || store.getters['aws/defaultRegion'];

  if (!value.value?.spec?.region) {
    value.value.spec.region = region;
  }
}

async function getRegions() {
  loadingRegions.value = true;
  // TODO get regions based on credentials
  if (!ec2Client.value || !region.value || !credentialId.value) {
    regionInfo.value = [];

    return;
  }

  const regions = await ec2Client.value.describeRegions({});

  regionInfo.value = regions?.Regions || [];
  loadingRegions.value = false;
}

async function getSshKeys() {
  loadingSshKeys.value = true;
  if (!ec2Client.value || !region.value || !credentialId.value) {
    sshKeyInfo.value = [];

    return;
  }
  const keys = await ec2Client.value.describeKeyPairs({});

  sshKeyInfo.value = keys.KeyPairs || [];
  loadingSshKeys.value = false;
}

onMounted(async() => {
  initDefaultRegion();

  ec2Client.value = await store.dispatch('aws/ec2', {
    region:            region.value,
    cloudCredentialId: credentialId.value
  });
  getRegions();
  getSshKeys();

  // TODO nb remove non-required field
  if (mode.value === _CREATE) {
    const valueWithDefaults = merge({}, defaultConfig, value.value);
    const cleanedValueWithDefaults = removeEmptyFields(valueWithDefaults);

    delete cleanedValueWithDefaults.spec.s3Bucket;

    emit('update:value', cleanedValueWithDefaults || {});
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
    getRegions();
    getSshKeys();
  } else {
    regionInfo.value = [];
    sshKeyInfo.value = [];
  }
}, { immediate: true });

</script>

<template>
  <div class="mb-20">
    <RcSection
      :title="t('capa.clusterConfig.title')"
      :expandable="true"
      mode="with-header"
      type="primary"
    >
      <RcSection
        title="General & Identity Configuration"
        :expandable="true"
        mode="with-header"
        type="secondary"
      >
        <div class="row">
          <div class="span-4">
            <LabeledSelect
              v-model:value="region"
              :loading="loadingRegions"
              :mode="mode"
              :options="regionOptions"
              required
              :label="t('capa.clusterConfig.region.label')"
              :placeholder="t('capa.clusterConfig.region.placeholder')"
            />
          </div>
        </div>
        <div class="row mb-20">
          <div class="span-4">
            <LabeledSelect
              v-model:value="sshKeyName"
              :loading="loadingSshKeys"
              :mode="mode"
              :options="sshKeyOptions"
              :label="t('capa.clusterConfig.sshKeyName.label')"
              :sub-label="t('capa.clusterConfig.sshKeyName.description')"
            />
          </div>
        </div>
      </RcSection>

      <RcSection
        :title="t('capa.clusterConfig.network.title')"
        :expandable="true"
        mode="with-header"
        type="secondary"
      >
        <Networking
          v-model:vpc-id="vpcId"
          v-model:subnets="subnets"
          v-model:ipv6="ipv6"
          :mode="mode"
          :region="region"
          :credentialId="credentialId"
        />
      </RcSection>

      <RcSection
        title="Network Security"
        :expandable="true"
        mode="with-header"
        type="secondary"
      >
        <!-- //TODO nb distinguish between vpc selected on create and prefilled vpc on edit; do not show in latter case -->
        <RcSection
          :title="t('capa.clusterConfig.network.securityGroups.label')"
          :expandable="true"
          mode="with-header"
          type="secondary"
          :expanded="!!vpcId"
        >
          <h5>{{ t('capa.clusterConfig.network.securityGroups.description') }}</h5>
          <SecurityOverrides
            v-if="vpcId"
            v-model:value="securityGroupOverrides"
            :vpc-id="vpcId"
            :region="region"
            :credential-id="credentialId"
            :mode="mode"
          />
        </RcSection>

        <RcSection
          :title="t('capa.clusterConfig.network.additionalControlPlaneIngressRules.label')"
          :expandable="true"
          mode="with-header"
          type="secondary"
          :expanded="allowAdditionalCPRules"
        >
          <h5>{{ t('capa.clusterConfig.network.additionalControlPlaneIngressRules.description') }}</h5>
          <IngressRules
            v-model:value="additionalControlPlaneIngressRules"
            :mode="allowAdditionalCPRules ? mode: 'view'"
            :region="region"
            :credential-id="credentialId"
            :vpc-id="vpcId"
          />
        </RcSection>

        <RcSection
          :title="t('capa.clusterConfig.network.additionalNodeIngressRules.label')"
          :expandable="true"
          mode="with-header"
          type="secondary"
          :expanded="allowAdditionalNodeRules"
        >
          <h5>{{ t('capa.clusterConfig.network.additionalNodeIngressRules.description') }}</h5>
          <IngressRules
            v-model:value="additionalNodeIngressRules"
            :mode="allowAdditionalNodeRules ? mode: 'view'"
            :region="region"
            :credential-id="credentialId"
            :vpc-id="vpcId"
          />
        </RcSection>

        <RcSection
          :title="t('capa.clusterConfig.network.cniIngressRules.label')"
          :expandable="true"
          mode="with-header"
          type="secondary"
        >
          <h5>{{ t('capa.clusterConfig.network.cniIngressRules.description') }}</h5>
          <IngressRules
            v-model:value="cniIngressRules"
            :mode="mode"
            :region="region"
            :credential-id="credentialId"
            :vpc-id="vpcId"
            :allow-targets="false"
          />
        </RcSection>
      </RcSection>

      <RcSection
        :title="t('capa.machineConfig.advanced.tags.title')"
        :expandable="true"
        mode="with-header"
        type="secondary"
      >
        <h5>{{ t('capa.machineConfig.advanced.tags.description') }}</h5>
        <KeyValue
          v-model:value="additionalTags"
          :mode="mode"
          :read-allowed="false"
          :as-map="true"
          :add-label="t('capa.machineConfig.advanced.tags.add')"
          data-testid="capa-resource-tags-input"
        />
      </RcSection>
    </RcSection>
  </div>
</template>
