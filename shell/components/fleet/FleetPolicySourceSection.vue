<script setup lang="ts">
import { computed, watch } from 'vue';
import { useStore } from 'vuex';
import { RcSection } from '@components/RcSection';
import { RadioGroup } from '@components/Form/Radio';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { RcContentGroup } from '@components/Layout';
import { Banner } from '@components/Banner';
import FleetPolicyAllowList from '@shell/components/fleet/FleetPolicyAllowList.vue';
import { useI18n } from '@shell/composables/useI18n';
import type { FleetPolicyNameOption, FleetPolicySource } from '@shell/types/fleet';

type Variant = 'gitRepo' | 'helmOp';

/**
 * GitRepo and HelmOp policies hold the same three settings under different field names,
 * so one section renders both and resolves the field names from the variant.
 */
const SECRET_FIELDS: Record<Variant, { default: keyof FleetPolicySource, allowed: keyof FleetPolicySource }> = {
  gitRepo: { default: 'defaultClientSecretName', allowed: 'allowedClientSecretNames' },
  helmOp:  { default: 'defaultHelmSecretName', allowed: 'allowedHelmSecretNames' },
};

const props = withDefaults(defineProps<{
  value: FleetPolicySource;
  variant: Variant;
  mode: string;
  serviceAccountOptions?: string[];
  secretOptions?: FleetPolicyNameOption[];
  defaultSecretAllowed?: boolean;
}>(), {
  serviceAccountOptions: () => [],
  secretOptions:         () => [],
  defaultSecretAllowed:  true,
});

const { t } = useI18n(useStore());

const secretFields = computed(() => SECRET_FIELDS[props.variant]);
const prefix = computed(() => `fleet.policy.${ props.variant }`);
const testid = computed(() => `fleet-policy-${ props.variant === 'gitRepo' ? 'git-repo' : 'helm-op' }`);

const setField = (field: keyof FleetPolicySource, value: string | string[]) => {
  (props.value as Record<string, unknown>)[field] = value;
};

const allowedSecrets = computed(() => (props.value[secretFields.value.allowed] as string[]) || []);
const restricted = defineModel<boolean>('restricted', { default: false });

const defaultServiceAccount = computed({
  get: () => props.value.defaultServiceAccount || '',
  set: (val: string) => {
    props.value.defaultServiceAccount = val || '';
  }
});

const defaultSecret = computed({
  get: () => (props.value[secretFields.value.default] as string) || '',
  set: (val: string) => setField(secretFields.value.default, val || ''),
});

const restrictOptions = computed(() => [
  { value: false, label: t(`${ prefix.value }.restrict.all`) },
  {
    value:       true,
    label:       t(`${ prefix.value }.restrict.selected`),
    description: t(`${ prefix.value }.restrict.description`),
  },
]);

watch(restricted, (val) => {
  if (!val) {
    setField(secretFields.value.allowed, []);
  }
});

const updateAllowed = (val: string[]) => setField(secretFields.value.allowed, val);

// Secrets are offered as options carrying a label, so a name typed in has to be shaped the same
// way, or the select hands back the option object instead of the name the policy stores
const createOption = (name: string) => ({ label: name, value: name });
</script>

<template>
  <RcSection
    :title="t(`${ prefix }.title`)"
    mode="with-header"
    type="primary"
    expandable
    :data-testid="testid"
  >
    <RcContentGroup>
      <div class="row">
        <div class="col span-6 policy-field">
          <LabeledSelect
            v-model:value="defaultServiceAccount"
            :options="props.serviceAccountOptions"
            :label="t(`${ prefix }.defaultServiceAccount.label`)"
            :placeholder="t('fleet.policy.placeholder.serviceAccount')"
            :mode="props.mode"
            :taggable="true"
            :searchable="true"
            :clearable="true"
            :create-option="createOption"
            :data-testid="`${ testid }-default-service-account`"
          />
          <p class="sub-description">
            {{ t(`${ prefix }.defaultServiceAccount.description`) }}
          </p>
        </div>
      </div>
    </RcContentGroup>
    <RcContentGroup>
      <RadioGroup
        v-model:value="restricted"
        :name="`${ testid }-restrict-secrets`"
        :options="restrictOptions"
        :mode="props.mode"
        :aria-label="t(`${ prefix }.title`)"
        :data-testid="`${ testid }-restrict-secrets`"
      />
      <FleetPolicyAllowList
        v-if="restricted"
        :value="allowedSecrets"
        :title="t(`${ prefix }.allowed.title`)"
        :label="t(`${ prefix }.allowed.label`)"
        :options="props.secretOptions"
        :mode="props.mode"
        :data-testid="`${ testid }-allowed-secrets`"
        @update:value="updateAllowed"
      />
      <div class="row">
        <div class="col span-6 policy-field">
          <LabeledSelect
            v-model:value="defaultSecret"
            :options="props.secretOptions"
            :label="t(`${ prefix }.defaultSecret.label`)"
            :placeholder="t('fleet.policy.placeholder.secret')"
            :mode="props.mode"
            :taggable="true"
            :searchable="true"
            :clearable="true"
            :create-option="createOption"
            :data-testid="`${ testid }-default-secret`"
          />
          <p class="sub-description">
            {{ t(`${ prefix }.defaultSecret.description`) }}
          </p>
        </div>
      </div>
      <Banner
        v-if="!props.defaultSecretAllowed"
        color="warning"
        :label="t('fleet.policy.defaultSecretNotAllowed')"
        :data-testid="`${ testid }-default-secret-not-allowed`"
      />
    </RcContentGroup>
  </RcSection>
</template>

<style lang="scss" scoped>
.policy-field {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .sub-description {
    color: var(--input-label);
    font-size: 12px;
  }
}
</style>
