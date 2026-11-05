<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { _EDIT } from '@shell/config/query-params';
import { DURATION_UNITS, DurationUnit, durationToParts, partsToDuration } from '../utils/duration';

/**
 * Value/unit pair bound to a single Go duration string. Emits `undefined` when cleared so the
 * caller can drop the field from the spec rather than persisting an empty string.
 */
const props = withDefaults(defineProps<{
  value?: string;
  label?: string;
  mode?: string;
  tooltip?: string;
}>(), {
  value:   undefined,
  label:   '',
  mode:    _EDIT,
  tooltip: undefined,
});

const emit = defineEmits<{(e: 'update:value', value: string | undefined): void}>();

const { t } = useI18n(useStore());

const initialParts = durationToParts(props.value);
const amount = ref(initialParts ? String(initialParts.value) : '');
const unit = ref<DurationUnit>(initialParts?.unit || 'd');

const unitOptions = computed(() => DURATION_UNITS.map((u) => ({ label: t(`certManager.duration.unit.${ u }`), value: u })));

// Keep in step when the parent replaces the resource, e.g. after a save or a form reset.
watch(() => props.value, (neu) => {
  if (neu === partsToDuration(amount.value, unit.value)) {
    return;
  }

  const parts = durationToParts(neu);

  amount.value = parts ? String(parts.value) : '';
  unit.value = parts?.unit || 'd';
});

function update() {
  emit('update:value', partsToDuration(amount.value, unit.value));
}
</script>

<template>
  <div class="row">
    <div class="col span-6">
      <LabeledInput
        v-model:value="amount"
        type="number"
        min="0"
        :label="label"
        :mode="mode"
        :tooltip="tooltip"
        @update:value="update"
      />
    </div>
    <div class="col span-6">
      <LabeledSelect
        v-model:value="unit"
        :label="t('certManager.duration.unitLabel')"
        :options="unitOptions"
        :mode="mode"
        @update:value="update"
      />
    </div>
  </div>
</template>
