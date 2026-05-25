<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import LabeledSelect from '@shell/components/form/LabeledSelect';

interface VersionOption {
  label: string;
  value: string;
  date?: string;
}

defineProps<{
  value?: string;
  options?: VersionOption[];
  loading?: boolean;
  mode: string;
}>();

// eslint-disable-next-line func-call-spacing
const emit = defineEmits<{
  (e: 'update:value', value: string): void;
}>();

const store = useStore();
const { t } = useI18n(store);
</script>

<template>
  <LabeledSelect
    :value="value"
    :options="options"
    :loading="loading"
    :mode="mode"
    :label="t('fleet.helmOp.appCoConfig.chartVersion')"
    :searchable="true"
    option-key="value"
    data-testid="appco-config-version-select"
    @update:value="emit('update:value', $event)"
  >
    <template #option="opt">
      <div class="version-option">
        <span>{{ opt.label }}</span>
        <span
          v-if="opt.date"
          class="version-option-date"
        >{{ opt.date }}</span>
      </div>
    </template>
    <template #selected-option="opt">
      <div class="version-option">
        <span>{{ opt.label }}</span>
        <span
          v-if="opt.date"
          class="version-option-date"
        >{{ opt.date }}</span>
      </div>
    </template>
  </LabeledSelect>
</template>

<style lang="scss" scoped>
.version-option {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.version-option-date {
  color: var(--muted);
}
</style>
