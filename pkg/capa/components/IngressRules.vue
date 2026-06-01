<script setup lang="ts">
import { toRefs, computed, ref, watch } from 'vue';
import { _CREATE } from '@shell/config/query-params';
import { useStore } from 'vuex';
import * as AWS from '@shell/types/aws-sdk';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import RcSection from '@components/RcSection/RcSection.vue';
import RcSectionActions from '@components/RcSection/RcSectionActions.vue';

defineOptions({ name: 'IngressRules' });

const emit = defineEmits(['update:value']);

interface Props {
  value: any[];
  mode?: string;
  region?: string;
  credentialId?: any;
}

const props = withDefaults(defineProps<Props>(), {
  mode:         _CREATE,
  value:        () => [],
  region:       '',
  credentialId: null
});

const {
  value, mode, region, credentialId
} = toRefs(props);

const store = useStore();
const ec2Client = ref(null);
const securityGroupInfo = ref<AWS.SecurityGroup[]>([]);
const loadingSecurityGroups = ref(false);

const PROTOCOLS = [
  { label: 'All', value: '-1' },
  { label: 'TCP', value: 'tcp' },
  { label: 'UDP', value: 'udp' },
  { label: 'ICMP', value: 'icmp' },
  { label: 'ICMPv6', value: '58' },
  { label: 'IP in IP', value: '4' },
  { label: 'ESP', value: '50' }
];

const defaultRule = {
  description:              '',
  protocol:                 'tcp',
  fromPort:                 0,
  toPort:                   0,
  cidrBlocks:               [],
  ipv6CidrBlocks:           [],
  sourceSecurityGroupIDs:   [],
  sourceSecurityGroupRoles: [],
  natGatewaysIPsSource:     false
};

const localValue = computed({
  get: () => value.value || [],
  set: (neu) => {
    emit('update:value', neu);
  }
});

const securityGroupOptions = computed(() => {
  return securityGroupInfo.value.map((sg) => {
    return {
      label: `${ sg.GroupName } (${ sg.GroupId })`,
      value: sg.GroupId
    };
  });
});

async function getSecurityGroups() {
  loadingSecurityGroups.value = true;

  if (!ec2Client.value) {
    securityGroupInfo.value = [];
    loadingSecurityGroups.value = false;

    return;
  }

  const securityGroups = await ec2Client.value.describeSecurityGroups({ });

  securityGroupInfo.value = securityGroups?.SecurityGroups || [];
  loadingSecurityGroups.value = false;
}

function addRule() {
  const rules = [...localValue.value];

  rules.push({ ...defaultRule });
  localValue.value = rules;
}

function removeRule(index: number) {
  const rules = [...localValue.value];

  rules.splice(index, 1);
  localValue.value = rules;
}

function updateRule(index: number, field: string, newValue: any) {
  const rules = [...localValue.value];

  rules[index] = { ...rules[index], [field]: newValue };
  localValue.value = rules;
}

function updateCidrString(index: number, field: string, stringValue: string) {
  const rules = [...localValue.value];
  const arrayValue = stringValue
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  rules[index] = { ...rules[index], [field]: arrayValue };
  localValue.value = rules;
}

function getCidrString(cidrArray: string[]): string {
  return (cidrArray || []).join(', ');
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

    getSecurityGroups();
  } else {
    securityGroupInfo.value = [];
  }
}, { immediate: true });
</script>

<template>
  <div>
    <RcSection
      v-for="(rule, index) in localValue"
      :key="index"
      class="mb-20"
      type="secondary"
      mode="with-header"
      :expandable="false"
    >
      <template #actions>
        <RcSectionActions
          :actions="[
            { icon: 'trash', ariaLabel:'Delete', action: () => removeRule(index) },
          ]"
        />
      </template>
      <div class="row">
        <div class="col span-12">
          <LabeledInput
            :value="rule.description"
            :mode="mode"
            label="Description"
            @update:value="updateRule(index, 'description', $event)"
          />
        </div>
      </div>

      <div class="row mb-10">
        <div class="col span-1">
          <LabeledSelect
            :value="rule.protocol"
            :mode="mode"
            :options="PROTOCOLS"
            label="Protocol"
            @update:value="updateRule(index, 'protocol', $event)"
          />
        </div>
        <div class="col span-1">
          <LabeledInput
            :value="rule.fromPort"
            :mode="mode"
            type="number"
            label="From Port"
            @update:value="updateRule(index, 'fromPort', parseInt($event) || 0)"
          />
        </div>
        <div class="col span-1">
          <LabeledInput
            :value="rule.toPort"
            :mode="mode"
            type="number"
            label="To Port"
            @update:value="updateRule(index, 'toPort', parseInt($event) || 0)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getCidrString(rule.cidrBlocks)"
            :disabled="rule.sourceSecurityGroupIDs && rule.sourceSecurityGroupIDs.length && !(rule.cidrBlocks|| []).length"
            :mode="mode"
            label="CIDR Blocks"
            placeholder="e.g., 10.0.0.0/16, 192.168.1.0/24"
            @update:value="updateCidrString(index, 'cidrBlocks', $event)"
          />
        </div>
        <div class="col span-5">
          <LabeledSelect
            :disabled="rule.cidrBlocks && rule.cidrBlocks.length && !(rule.sourceSecurityGroupIDs|| []).length"
            :value="rule.sourceSecurityGroupIDs || []"
            :mode="mode"
            :options="securityGroupOptions"
            :loading="loadingSecurityGroups"
            :multiple="true"
            label="Source Security Group IDs"
            @update:value="updateRule(index, 'sourceSecurityGroupIDs', $event)"
          />
        </div>
      </div>

      <!-- <div class="row mb-10" /> -->

      <!-- <div class="row mb-10">
        <div class="col span-12">
          <LabeledInput
            :value="getCidrString(rule.ipv6CidrBlocks)"
            :mode="mode"
            label="IPv6 CIDR Blocks"
            placeholder="e.g., 2001:db8::/32, fd00::/8"
            @update:value="updateCidrString(index, 'ipv6CidrBlocks', $event)"
          />
        </div>
      </div> -->

      <div class="row" />

      <!-- <div class="row mb-10">
        <div class="col span-12">
          <LabeledSelect
            :value="rule.sourceSecurityGroupRoles || []"
            :mode="mode"
            :options="SECURITY_GROUP_ROLES"
            :multiple="true"
            label="Source Security Group Roles"
            @update:value="updateRule(index, 'sourceSecurityGroupRoles', $event)"
          />
        </div>
      </div> -->

      <!-- <div class="row mb-10">
        <div class="col span-12">
          <Checkbox
            :value="rule.natGatewaysIPsSource"
            :mode="mode"
            label="Use NAT Gateway IPs as Source"
            @update:value="updateRule(index, 'natGatewaysIPsSource', $event)"
          />
        </div>
      </div> -->
    </RcSection>

    <div class="row">
      <div class="col span-12">
        <button
          type="button"
          class="btn btn-sm role-secondary"
          @click="addRule"
        >
          Add Rule
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.remove-button {
  display: flex;
  justify-content: end;
  margin-bottom: 16px;
}
</style>
