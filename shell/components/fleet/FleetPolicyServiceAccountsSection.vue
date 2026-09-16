<script setup lang="ts">
import { computed, watch } from 'vue';
import { useStore } from 'vuex';
import { RcSection } from '@components/RcSection';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { RadioGroup } from '@components/Form/Radio';
import { RcIcon } from '@components/RcIcon';
import FleetPolicyAllowList from '@shell/components/fleet/FleetPolicyAllowList.vue';
import { useI18n } from '@shell/composables/useI18n';
import { getPolicyNamespaceCreationDocsUrl } from '@shell/utils/fleet-docs';
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

const allowNamespaceCreation = computed({
  get: () => !!props.value.allowNamespaceCreation,
  set: (val: boolean) => {
    props.value.allowNamespaceCreation = val;
  }
});

const namespaceCreationDocsUrl = getPolicyNamespaceCreationDocsUrl();

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

// Fleet unions this across the namespace, so a value left behind here would re-enable namespace
// creation for any other policy that does require a service account
watch(requireServiceAccount, (required) => {
  if (!required && props.value.allowNamespaceCreation) {
    props.value.allowNamespaceCreation = false;
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
    <div
      v-if="requireServiceAccount"
      class="namespace-creation"
    >
      <Checkbox
        v-model:value="allowNamespaceCreation"
        :mode="props.mode"
        :label="t('fleet.policy.serviceAccounts.allowNamespaceCreation.label')"
        :description="t('fleet.policy.serviceAccounts.allowNamespaceCreation.description')"
        data-testid="fleet-policy-allow-namespace-creation"
      />
      <a
        :href="namespaceCreationDocsUrl"
        target="_blank"
        rel="noopener noreferrer nofollow"
        data-testid="fleet-policy-namespace-creation-docs-link"
      >
        {{ t('fleet.policy.serviceAccounts.allowNamespaceCreation.link') }}
        <RcIcon
          type="external-link"
          size="small"
          :aria-hidden="true"
        /><span class="sr-only">{{ t('generic.opensInNewTab') }}</span>
      </a>
    </div>
    <RadioGroup
      v-model:value="restricted"
      name="fleet-policy-restrict-service-accounts"
      :options="restrictOptions"
      :mode="props.mode"
      :aria-label="t('fleet.policy.serviceAccounts.title')"
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

<style lang="scss" scoped>
.namespace-creation {
  display: flex;
  flex-direction: column;
  gap: 4px;
  // The design keeps explanatory text to half the section width rather than the full page
  max-width: 50%;

  a {
    font-size: 12px;
    // Line the link up with the checkbox description rather than the checkbox itself
    padding-left: 19px;
  }
}
</style>
