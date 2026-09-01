<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';

import Select from '@shell/components/form/Select';
import UnitInput from '@shell/components/form/UnitInput';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RcButton } from '@components/RcButton';

import { TYPES } from './shared';
import { useI18n } from '@shell/composables/useI18n';

const props = defineProps<{
  id: string,
  index: number,
  mode: string,
  types: any[],
}>();

const emit = defineEmits(['remove']);

const store = useStore();
const { t } = useI18n(store);

const resourceType = defineModel<string>('resourceType');
const resourceIdentifier = defineModel<string>('resourceIdentifier');
const projectLimit = defineModel<string>('projectLimit');
const namespaceDefaultLimit = defineModel<string>('namespaceDefaultLimit');

const typeOption = computed(() => {
  return props.types.find((type) => type.value === resourceType.value) || {};
});

const isCustom = computed(() => {
  return resourceType.value === TYPES.EXTENDED;
});

const removeAriaLabel = computed(() => {
  let identifier;

  if (isCustom.value) {
    identifier = resourceIdentifier.value || t('generic.ariaLabel.genericRow', { index: String(props.index) });
  } else {
    identifier = typeOption.value?.label || t('generic.ariaLabel.genericRow', { index: String(props.index) });
  }

  return t('resourceQuota.ariaLabel.remove', { identifier });
});

const customTypeRules = computed(() => {
  // Return a validation rule that makes the field required when isCustom is true
  if (isCustom.value) {
    return [
      (value: string) => {
        if (!value) {
          return t('resourceQuota.errors.customTypeRequired');
        }

        return undefined;
      }
    ];
  }

  return [];
});

const remove = (id: string) => {
  emit('remove', id);
};

const updateResourceIdentifier = (resourceType: string) => {
  if (resourceType === TYPES.EXTENDED) {
    return;
  }

  resourceIdentifier.value = resourceType;
};
</script>

<template>
  <div
    role="row"
    class="row mb-10"
  >
    <Select
      v-model:value="resourceType"
      class="mr-10"
      :mode="mode"
      :options="types"
      :aria-label="t('resourceQuota.ariaLabel.resourceType', { row: index })"
      data-testid="projectrow-type-input"
      @update:value="updateResourceIdentifier"
    />
    <LabeledInput
      v-model:value="resourceIdentifier"
      :disabled="!isCustom"
      :required="isCustom"
      :mode="mode"
      :placeholder="t('resourceQuota.resourceIdentifier.placeholder')"
      :rules="customTypeRules"
      :require-dirty="false"
      :aria-label="t('resourceQuota.ariaLabel.resourceIdentifier', { row: index })"
      class="mr-10"
      data-testid="projectrow-custom-type-input"
    />
    <UnitInput
      v-model:value="projectLimit"
      class="mr-10"
      :mode="mode"
      :placeholder="typeOption.placeholder"
      :increment="typeOption.increment"
      :input-exponent="typeOption.inputExponent"
      :base-unit="typeOption.baseUnit"
      :output-modifier="true"
      :aria-label="t('resourceQuota.ariaLabel.projectLimit', { row: index })"
      data-testid="projectrow-project-quota-input"
    />
    <UnitInput
      v-model:value="namespaceDefaultLimit"
      :mode="mode"
      :placeholder="typeOption.placeholder"
      :increment="typeOption.increment"
      :input-exponent="typeOption.inputExponent"
      :base-unit="typeOption.baseUnit"
      :output-modifier="true"
      :aria-label="t('resourceQuota.ariaLabel.namespaceDefaultLimit', { row: index })"
      data-testid="projectrow-namespace-quota-input"
    />
    <RcButton
      variant="tertiary"
      :aria-label="removeAriaLabel"
      @click="remove(id)"
    >
      {{ t('generic.remove') }}
    </RcButton>
  </div>
</template>

<style lang='scss' scoped>
  .row {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
  }
</style>
