<script setup lang="ts">
import { computed, watch } from 'vue';
import { useStore } from 'vuex';
import { RcSection } from '@components/RcSection';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { RadioGroup } from '@components/Form/Radio';
import FleetPolicyAllowList from '@shell/components/fleet/FleetPolicyAllowList.vue';
import { useI18n } from '@shell/composables/useI18n';
import type { FleetPolicy } from '@shell/types/fleet';

const props = withDefaults(defineProps<{
  value: FleetPolicy;
  mode: string;
  serviceAccountOptions?: string[];
}>(), { serviceAccountOptions: () => [] });

const { t } = useI18n(useStore());

const restricted = defineModel<boolean>('restricted', { default: false });

const requireServiceAccount = computed({
  get: () => !!props.value.requireServiceAccount,
  set: (val: boolean) => {
    props.value.requireServiceAccount = val;
  }
});

const allowedServiceAccounts = computed(() => props.value.allowedServiceAccounts || []);

const restrictOptions = computed(() => [
  { value: false, label: t('fleet.policy.serviceAccounts.restrict.all') },
  {
    value:       true,
    label:       t('fleet.policy.serviceAccounts.restrict.selected'),
    description: t('fleet.policy.serviceAccounts.restrict.description'),
  },
]);

watch(restricted, (val) => {
  if (!val) {
    props.value.allowedServiceAccounts = [];
  }
});

const updateAllowed = (val: string[]) => {
  props.value.allowedServiceAccounts = val;
};
</script>

<template>
  <RcSection
    :title="t('fleet.policy.serviceAccounts.title')"
    mode="with-header"
    type="primary"
    expandable
    data-testid="fleet-policy-service-accounts"
  >
    <Checkbox
      v-model:value="requireServiceAccount"
      :mode="props.mode"
      :label="t('fleet.policy.serviceAccounts.require.label')"
      :description="t('fleet.policy.serviceAccounts.require.description')"
      data-testid="fleet-policy-require-service-account"
    />
    <RadioGroup
      v-model:value="restricted"
      name="fleet-policy-restrict-service-accounts"
      :options="restrictOptions"
      :mode="props.mode"
      data-testid="fleet-policy-restrict-service-accounts"
    />
    <FleetPolicyAllowList
      v-if="restricted"
      :value="allowedServiceAccounts"
      :title="t('fleet.policy.serviceAccounts.allowed.title')"
      :label="t('fleet.policy.serviceAccounts.allowed.label')"
      :options="props.serviceAccountOptions"
      :mode="props.mode"
      data-testid="fleet-policy-allowed-service-accounts"
      @update:value="updateAllowed"
    />
  </RcSection>
</template>
