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

defineOptions({ name: 'ClusterConfiguration' });

const emit = defineEmits<{(e: 'update:value', value: any): void }>();

// const AWS_CLUSTER_SCHEMA = 'infrastructure.cluster.x-k8s.io.awscluster';
// const DEFAULT_WORKSPACE = 'fleet-default'; // TODO

const defaultConfig = {
  spec: {
    region:  'us-west-2',
    network: {
      additionalControlPlaneIngressRules: [{ protocol: '-1', sourceSecurityGroupRoles: ['controlplane', 'node'] }], // allow all traffic from control plane security groups
      additionalNodeIngressRules:         [{ protocol: '-1', sourceSecurityGroupRoles: ['controlplane', 'node'] }],
      cni:                                { cniIngressRules: [] },
      securityGroupOverrides:             {},
      vpc:                                { id: 'vpc-07cdd250a077f6773' }, // id: '', cidrBlock: '', ipv6: {},
      subnets:                            [{ id: 'subnet-02e4caf6f4ee75111' }]
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

// const clusterSchema = computed(() => {
//   return store.getters['management/schemaFor'](AWS_CLUSTER_SCHEMA, true, false);
// });

const region: WritableComputedRef<string> = computed({
  get: () => value.value?.spec?.region || '',
  set: (newRegion: string) => {
    if (value.value) {
      value.value.spec = value.value.spec || {};
      value.value.spec.region = newRegion;
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

const network = computed({
  get: () => value.value?.spec?.network || '',
  set: (newNetwork: string) => {
    if (value.value) {
      value.value.spec = value.value.spec || {};
      value.value.spec.network = newNetwork;
    }
    emit('update:value', value.value);
  },
});
// async function initCapiCluster() {
//   // TODO handle edit
//   let configMissing = false;

//   if (!clusterSchema.value) {
//     // eslint-disable-next-line no-console
//     console.warn('initCapiCluster: missing clusterSchema, cluster object creation skipped');
//   }

//   const clusterSchemaType = clusterSchema.value?.id || clusterSchema.value;

//   if (clusterSchemaType && store.getters['management/canList'](clusterSchemaType)) {
//     try {
//       config.value = await store.dispatch('management/find', {
//         type: clusterSchemaType,
//         // id: `${ value.value.metadata.namespace }/${ pool.machineConfigRef.name }`,
//       });
//       if (!config.value) {
//         configMissing = true;
//       }
//       // TODO handle edit?? clone existing config?
//     } catch (e) {
//       configMissing = true;
//     }
//     if (configMissing) {
//       try {
//         config.value = await store.dispatch('management/createPopulated', {
//           type:     clusterSchemaType,
//           metadata: { namespace: DEFAULT_WORKSPACE }
//         });
//       } catch (e) {
//         console.log('Error creating cluster config', e);
//       }
//     }
//     // TODO handle case where config is still missing and make sure spec is setup correctly
//     // TODO apply defaults
//     console.log('config', config.value);
//   }
// }

function initDefaultRegion() {
  const region = value.value?.spec?.region || credentialId.value?.decodedData?.defaultRegion || store.getters['aws/defaultRegion'];

  if (!value.value?.spec?.region) {
    value.value.spec.region = region;
  }
}

async function getRegions() {
  // TODO get regions based on credentials
  if (!ec2Client.value || !region.value || !credentialId.value) {
    regionInfo.value = [];

    return;
  }

  const regions = await ec2Client.value.describeRegions({});

  regionInfo.value = regions?.Regions || [];
}

onMounted(async() => {
  // await initCapiCluster();

  initDefaultRegion();

  ec2Client.value = await store.dispatch('aws/ec2', {
    region:            region.value,
    cloudCredentialId: credentialId.value
  });
  getRegions();
  // TODO remove non-required field
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
      <div class="mb-20 span-4">
        <LabeledSelect
          v-model:value="region"
          :mode="mode"
          :options="regionOptions"
          required
          :label="t('capa.clusterConfig.region.label')"
          :placeholder="t('capa.clusterConfig.region.placeholder')"
        />
      </div>
      <Networking
        v-model:value="network"
        :mode="mode"
        :region="region"
        :credentialId="credentialId"
      />
    </RcSection>
  </div>
</template>
