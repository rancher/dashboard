<script setup lang="ts">
import {
  computed, onMounted, toRefs, ref, WritableComputedRef
} from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { RcSection } from '@components/RcSection';
import { _CREATE } from '@shell/config/query-params';
import merge from 'lodash/merge';
import Networking from '.././components/Networking.vue';
import { removeEmptyFields } from '../utils';
import { MANAGEMENT, NORMAN } from '@shell/config/types';
import { set } from '@shell/utils/object.js';

defineOptions({ name: 'ClusterConfiguration' });

const emit = defineEmits<{(e: 'update:value', value: any): void }>();

// const AWS_CLUSTER_SCHEMA = 'infrastructure.cluster.x-k8s.io.awscluster';
// const DEFAULT_WORKSPACE = 'fleet-default'; // TODO

const defaultConfig = {
  spec: {
    // region:  'us-west-2',
    network: {
      additionalControlPlaneIngressRules: [{ protocol: '-1', sourceSecurityGroupRoles: ['controlplane', 'node'] }], // allow all traffic from control plane security groups
      additionalNodeIngressRules:         [{ protocol: '-1', sourceSecurityGroupRoles: ['controlplane', 'node'] }],
      cni:                                { cniIngressRules: [] },
      securityGroupOverrides:             {},
      vpc:                                {},
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
const regionInfo = ref(null);
const sshKeyInfo = ref(null);
const loadingRegions = ref(false);
const loadingSshKeys = ref(false);

// TODO nb generic set-if-not-set for region, sshKeyName, vpcId, firstSubnetId
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

const firstSubnetId: WritableComputedRef<string> = computed({
  get: () => value?.value?.spec?.network?.subnets?.[0]?.id || '',
  set: (sn: string) => {
    if (value.value) {
      if (!value.value?.spec?.network?.subnets?.[0]) {
        set(value.value, 'spec.network.subnets', [{ id: sn }]);
      } else {
        value.value.spec.network.subnets[0].id = sn;
      }
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

// TODO nb re-fetch regions and sshKeys when cloud cred id changes
onMounted(async() => {
  initDefaultRegion();

  ec2Client.value = await store.dispatch('aws/ec2', {
    region:            region.value,
    cloudCredentialId: credentialId.value
  });
  getRegions();
  getSshKeys();
  // TODO remove non-required field
  // TODO nb make template paths work regardless of initialized cluster shape eg shouldn't error if vpc is undefined instead of {}
  const valueWithDefaults = merge({}, defaultConfig, value.value);
  const cleanedValueWithDefaults = removeEmptyFields(valueWithDefaults);

  delete cleanedValueWithDefaults.spec.s3Bucket;

  emit('update:value', cleanedValueWithDefaults || {});
});

</script>

<template>
  <div class="mb-20">
    <RcSection
      :title="t('capa.clusterConfig.title')"
      :expandable="true"
      mode="with-header"
      type="primary"
    >
      <div class="row mb-20">
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
            :placeholder="t('capa.clusterConfig.sshKeyName.placeholder')"
          />
        </div>
      </div>

      <Networking
        v-model:vpc-id="vpcId"
        v-model:subnet-id="firstSubnetId"
        :mode="mode"
        :region="region"
        :credentialId="credentialId"
      />
    </RcSection>
  </div>
</template>
