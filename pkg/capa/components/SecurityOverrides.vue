<script setup lang="ts">
import { toRefs, ref, watch, computed } from 'vue';
import { _CREATE } from '@shell/config/query-params';
import * as AWS from '@shell/types/aws-sdk';
import { useStore } from 'vuex';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { useI18n } from '@shell/composables/useI18n';
import KeyValue from '@shell/components/form/KeyValue.vue';

const SECURITY_GROUP_ROLES = [
  // SSH bastion role
  'bastion',

  // Kubernetes workload node role
  'node',

  // Kubernetes control plane node role
  'controlplane',

  // Kubernetes API Server Load Balancer role
  'apiserver-lb',

  // container for the cloud provider to inject its load balancer ingress rules
  'lb'
];

defineOptions({ name: 'SecurityGroupOverrides' });

const emit = defineEmits([
  'update:value',
]);

interface Props {
  vpcId: string;
  // TODO nb type as map
  value: any;
  mode?: string;
  credentialId: any;
  region?: string;
}

const props = withDefaults(defineProps<Props>(), {
  mode:   _CREATE,
  region: ''
});

const {
  vpcId, value, credentialId, region
} = toRefs(props);

const store = useStore();
const { t } = useI18n(store);
const securityGroupInfo = ref<AWS.SecurityGroup[]>([]);
const loadingSecurityGroups = ref(false);
const ec2Client = ref(null);
const localValue = ref({ ...value.value });

const securityGroupOptions = computed(() => {
  if (!vpcId.value) {
    return [t('capa.clusterConfig.network.securityGroups.selectVpc')];
  }

  return securityGroupInfo.value.reduce((opts, sg) => {
    if (sg.VpcId === vpcId.value) {
      opts.push({ label: `${ sg.GroupName } (${ sg.Description })`, value: sg.SecurityGroupArn });
    }

    return opts;
  }, [] as any);
});

const securityGroupRoleOptions = computed(() => {
  const inUse = Object.keys(localValue.value || {}).filter((r) => !!localValue.value[r]);

  return SECURITY_GROUP_ROLES.filter((r) => !inUse.includes(r)).map((r) => {
    return { label: t(`capa.clusterConfig.network.securityGroups.roles.${ r }`), value: r };
  });
});

function getRoleLabel(role: string) {
  return t(`capa.clusterConfig.network.securityGroups.roles.${ role }`);
}

function updateRowKey(oldKey: string, newKey: string, value: string) {
  const updated = { ...localValue.value };

  delete updated[oldKey];
  updated[newKey] = value;
  localValue.value = updated;
}

function updateRowValue(key: string, newValue: string) {
  localValue.value = {
    ...localValue.value,
    [key]: newValue
  };
}

async function getSecurityGroups() {
  loadingSecurityGroups.value = true;

  if (!ec2Client.value) {
    securityGroupInfo.value = [];
    loadingSecurityGroups.value = false;

    return;
  }
  // TODO nb store method with caching
  const securityGroups = await ec2Client.value.describeSecurityGroups({ });

  securityGroupInfo.value = securityGroups?.SecurityGroups || [];
  loadingSecurityGroups.value = false;
}

function addOverride() {
  const next = securityGroupRoleOptions?.value?.[0]?.value;

  // Create a new object to ensure reactivity triggers
  localValue.value = {
    ...localValue.value,
    [next]: securityGroupOptions.value[0].value
  };
}

function updateOverrides(neu: Record<string, string>) {
  // Create a new object reference to ensure reactivity
  localValue.value = { ...neu };
}

watch(vpcId, (neu, old) => {
  if (old) {
    emit('update:value', {});
  }
  getSecurityGroups();
});

watch(localValue, (neu) => {
  value.value = neu;
  emit('update:value', value);
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

    getSecurityGroups();
  } else {
    securityGroupInfo.value = [];
  }
}, { immediate: true });

</script>

<template>
  <div class="row">
    <div class="col span-12">
      <KeyValue
        :value="localValue"
        :mode="mode"
        :add-allowed="false"
        :read-allowed="false"
        :key-label="t('capa.clusterConfig.network.securityGroups.role')"
        :value-label="t('capa.clusterConfig.network.securityGroups.securityGroupId')"
        @update:value="updateOverrides"
      >
        <template #key="{row}">
          <LabeledSelect
            :value="row.key"
            :options="securityGroupRoleOptions"
            @update:value="(newKey) => updateRowKey(row.key, newKey, row.value)"
          >
            <template #selected-option>
              {{ getRoleLabel(row.key) }}
            </template>
          </LabeledSelect>
        </template>
        <template #value="{row}">
          <LabeledSelect
            :value="row.value"
            :options="securityGroupOptions"
            :loading="loadingSecurityGroups"
            @update:value="(newValue) => updateRowValue(row.key, newValue)"
          />
        </template>
      </KeyValue>
    </div>
  </div>
  <div class="row">
    <button
      v-if="securityGroupRoleOptions.length && vpcId"
      type="button"
      class="btn btn-sm role-secondary"
      @click="addOverride"
    >
      {{ t('capa.clusterConfig.network.securityGroups.addOverride') }}
    </button>
  </div>
</template>
