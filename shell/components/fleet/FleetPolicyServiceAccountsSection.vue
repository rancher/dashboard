<script setup lang="ts">
import { computed, watch } from 'vue';
import { useStore } from 'vuex';
import { RcSection } from '@components/RcSection';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { RadioGroup } from '@components/Form/Radio';
import { RcIcon } from '@components/RcIcon';
import { RcContentGroup } from '@components/Layout';
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
    <RcContentGroup>
      <Checkbox
        v-model:value="requireServiceAccount"
        :mode="props.mode"
        :label="t('fleet.policy.serviceAccounts.require.label')"
        :description="t('fleet.policy.serviceAccounts.require.description')"
        data-testid="fleet-policy-require-service-account"
      />
      <RcSection
        v-if="requireServiceAccount"
        :title="t('fleet.policy.serviceAccounts.allowNamespaceCreation.title')"
        mode="with-header"
        type="secondary"
        expandable
        data-testid="fleet-policy-namespace-creation"
      >
        <div class="namespace-creation-note">
          <p>{{ t('fleet.policy.serviceAccounts.allowNamespaceCreation.description') }}</p>
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
        <Checkbox
          v-model:value="allowNamespaceCreation"
          :mode="props.mode"
          :label="t('fleet.policy.serviceAccounts.allowNamespaceCreation.label')"
          data-testid="fleet-policy-allow-namespace-creation"
        />
      </RcSection>
    </RcContentGroup>
    <RcContentGroup>
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
    </RcContentGroup>
  </RcSection>
</template>

<style lang="scss" scoped>
.namespace-creation-note {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}
</style>
