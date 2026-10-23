<script setup lang="ts">
/**
 * A single line text input with a label, helper text, and validation message.
 *
 * Attributes other than `class` and `style` go to the native input, so
 * `autocomplete`, `maxlength`, and listeners such as `@blur` reach it.
 * The `.number` and `.trim` modifiers work on `v-model`.
 *
 * The input registers validation with the form when given a `name` inside
 * vee-validate's `useForm`.
 *
 * Example:
 *
 * <rc-input
 *   v-model="name"
 *   label="Name"
 *   helper-text="Lowercase letters, numbers and hyphens"
 *   :validation-message="errors.name"
 *   required
 *   clearable
 * />
 *
 * <rc-input v-model="name" name="name" label="Name" />
 *
 * <rc-input v-model="host" label="Host">
 *   <template #suffix>
 *     <rc-icon type="globe" />
 *   </template>
 * </rc-input>
 */
import { computed, ref, useAttrs } from 'vue';
import RcField from '@components/RcField/RcField.vue';
import { useFieldValidation } from '@components/RcField/useFieldValidation';
import RcInputAction from './RcInputAction.vue';
import type { RcInputAffixSlotProps, RcInputExpose, RcInputProps, RcInputValue } from './types';

const MASKED_VALUE = '••••••••';
const EMPTY_VALUE = '—';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<RcInputProps>(), {
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
  type:              'text',
  placeholder:       undefined,
  resetValue:        undefined,
});

const model = defineModel<RcInputValue>();

const emit = defineEmits<{
  clear: [];
  reset: [];
}>();

defineSlots<{
  prefix?(props: RcInputAffixSlotProps): unknown;
  suffix?(props: RcInputAffixSlotProps): unknown;
}>();

const attrs = useAttrs();

const inputAttrs = computed(() => {
  const {
    class: _class, style: _style, 'aria-describedby': _describedby, ...rest
  } = attrs;

  return rest;
});

const describedbyWith = (fieldDescribedby: string | undefined) => {
  const ids = [fieldDescribedby, attrs['aria-describedby'] as string | undefined].filter(Boolean);

  return ids.length ? ids.join(' ') : undefined;
};

const hasValue = computed(() => model.value !== undefined && model.value !== null && `${ model.value }` !== '');

const resettable = computed(() => props.resetValue !== undefined && model.value !== props.resetValue);

const viewValue = computed(() => {
  if (!hasValue.value) {
    return EMPTY_VALUE;
  }

  return props.type === 'password' ? MASKED_VALUE : `${ model.value }`;
});

const validation = useFieldValidation({
  name:              props.name,
  value:             model,
  validationMessage: () => props.validationMessage,
  validationStatus:  () => props.validationStatus,
});

const input = ref<HTMLInputElement | null>(null);

const clear = () => {
  model.value = '';
  emit('clear');
  input.value?.focus();
};

const reset = () => {
  model.value = props.resetValue;
  emit('reset');
};

defineExpose<RcInputExpose>({
  focus:  () => input.value?.focus(),
  blur:   () => input.value?.blur(),
  select: () => input.value?.select(),
});
</script>

<template>
  <rc-field
    :id="props.id"
    :class="['rc-input', attrs.class]"
    :style="attrs.style"
    :mode="props.mode"
    :disabled="props.disabled"
    :size="props.size"
    :label="props.label"
    :required="props.required"
    :tooltip="props.tooltip"
    :helper-text="props.helperText"
    :validation-message="validation.message.value"
    :validation-status="validation.status.value"
    :resettable="resettable"
    @reset="reset"
  >
    <template #default="{ id, describedby, invalid, required, disabled, isView }">
      <template v-if="isView">
        <span class="rc-input-view-value">{{ viewValue }}</span>
        <slot
          name="suffix"
          :disabled="disabled"
          :is-view="true"
        />
      </template>
      <template v-else>
        <slot
          name="prefix"
          :disabled="disabled"
          :is-view="false"
        />
        <input
          :id="id"
          ref="input"
          v-model="model"
          v-bind="inputAttrs"
          class="rc-input-control rc-field-control"
          :name="props.name"
          :type="props.type"
          :placeholder="props.placeholder"
          :disabled="disabled"
          :required="required"
          :aria-invalid="invalid || undefined"
          :aria-describedby="describedbyWith(describedby)"
          @blur="validation.onBlur"
        >
        <rc-input-action
          v-if="props.clearable && hasValue && !disabled"
          icon="close"
          :label="t('component.rcInput.clear')"
          :size="props.size"
          @click="clear"
        />
        <slot
          name="suffix"
          :disabled="disabled"
          :is-view="false"
        />
      </template>
    </template>
  </rc-field>
</template>

<style lang="scss" scoped>
// The global INPUT[type] rules set a border, padding and background, and the
// build adds them to scoped styles as INPUT[type]:not(.vs__search)[data-v].
// The extra classes outrank that; the field box draws the chrome instead.
.rc-field-box .rc-input-control.rc-field-control {
  flex: 1 1 0;
  width: 100%;
  min-width: 0;
  height: auto;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  outline: none;
  background: none;
  color: inherit;
  font: inherit;
  line-height: inherit;

  &::placeholder {
    color: var(--input-placeholder);
  }

  &:focus-visible {
    outline: none;
  }

  &:disabled {
    background: none;
    color: inherit;
    cursor: not-allowed;
  }

  &::-webkit-search-cancel-button {
    appearance: none;
  }
}

.rc-input-view-value {
  overflow: hidden;
  min-width: 0;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
