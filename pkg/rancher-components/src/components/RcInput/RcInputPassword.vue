<script setup lang="ts">
/**
 * An RcInput for secrets that need to be masked.
 *
 * Pass `autocomplete="new-password"` where a browser should not fill in a
 * saved password.
 *
 * Example:
 *
 * <rc-input-password v-model="token" label="Access token" autocomplete="new-password" />
 */
import { ref } from 'vue';
import RcInput from './RcInput.vue';
import RcInputAction from './RcInputAction.vue';
import type { RcInputExpose, RcInputPasswordProps, RcInputValue } from './types';

const props = withDefaults(defineProps<RcInputPasswordProps>(), {
  mode:              undefined,
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
const revealed = defineModel<boolean>('revealed', { default: false });

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
    :type="revealed ? 'text' : 'password'"
  >
    <template #suffix="{ isView }">
      <rc-input-action
        v-if="!isView || (model !== undefined && model !== null && model !== '')"
        :icon="revealed ? 'hide' : 'show'"
        :label="t('component.rcInput.showPassword')"
        :aria-pressed="revealed"
        :size="props.size"
        @click="revealed = !revealed"
      />
    </template>
  </rc-input>
</template>
