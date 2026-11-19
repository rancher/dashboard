<script setup lang="ts">
/**
 * An RcInput for search terms, marked with a search icon.
 *
 * Search has no view mode, so it stays editable inside an RcFieldGroup in
 * view mode. It still takes the group's disabled state. A search box
 * usually has no visible label; give it an `aria-label` in that case.
 *
 * Example:
 *
 * <rc-input-search v-model="term" :aria-label="t('generic.search')" clearable />
 */
import { ref } from 'vue';
import { _EDIT } from '@shell/config/query-params';
import RcIcon from '@components/RcIcon/RcIcon.vue';
import RcInput from './RcInput.vue';
import type { RcInputExpose, RcInputSearchProps, RcInputValue } from './types';

const props = withDefaults(defineProps<RcInputSearchProps>(), {
  disabled:          undefined,
  size:              'medium',
  label:             undefined,
  tooltip:           undefined,
  helperText:        undefined,
  validationMessage: undefined,
  validationStatus:  'error',
  id:                undefined,
  name:              undefined,
  placeholder:       undefined,
  resetValue:        undefined,
});

const model = defineModel<RcInputValue>();

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
    type="search"
    :mode="_EDIT"
  >
    <template #suffix>
      <rc-icon
        class="rc-input-search-icon"
        type="search"
        :size="props.size === 'small' ? 'small' : 'medium'"
      />
    </template>
  </rc-input>
</template>

<style lang="scss" scoped>
.rc-input-search-icon {
  flex-shrink: 0;
}
</style>
