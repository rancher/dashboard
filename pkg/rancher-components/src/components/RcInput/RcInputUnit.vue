<script setup lang="ts">
/**
 * An RcInput for a quantity, with its unit of measurement after the value.
 * The unit is part of the input's accessible description. In view mode it
 * follows the value inline, so the two read as one phrase.
 *
 * Example:
 *
 * <rc-input-unit v-model.number="memory" type="number" label="Memory" unit="MiB" />
 */
import { ref, useId } from 'vue';
import RcInput from './RcInput.vue';
import type { RcInputExpose, RcInputUnitProps, RcInputValue } from './types';

const props = withDefaults(defineProps<RcInputUnitProps>(), {
  mode:              undefined,
  disabled:          undefined,
  size:              'medium',
  label:             undefined,
  tooltip:           undefined,
  helperText:        undefined,
  validationMessage: undefined,
  validationStatus:  'error',
  id:                undefined,
  type:              'text',
  placeholder:       undefined,
  resetValue:        undefined,
});

const model = defineModel<RcInputValue>();

const unitId = `rc-input-unit-${ useId() }`;

const input = ref<RcInputExpose | null>(null);

defineExpose<RcInputExpose>({
  focus:  () => input.value?.focus(),
  blur:   () => input.value?.blur(),
  select: () => input.value?.select(),
});
</script>

<template>
  <rc-input
    ref="input"
    v-model="model"
    v-bind="props"
    :aria-describedby="unitId"
  >
    <template #suffix>
      <span
        :id="unitId"
        class="rc-input-unit"
        :class="`rc-input-unit-${ props.size }`"
      >{{ props.unit }}</span>
    </template>
  </rc-input>
</template>

<style lang="scss" scoped>
.rc-input-unit {
  overflow: hidden;
  flex-shrink: 0;
  color: var(--input-label);
  white-space: nowrap;
  text-overflow: ellipsis;

  &.rc-input-unit-small {
    max-width: 100px;
    font-size: 10px;
    font-weight: 700;
    line-height: 15px;
  }

  &.rc-input-unit-medium {
    max-width: 120px;
    font-size: 12px;
    line-height: 18px;
  }

  &.rc-input-unit-large {
    max-width: 140px;
    font-size: 14px;
    line-height: 21px;
  }
}
</style>
