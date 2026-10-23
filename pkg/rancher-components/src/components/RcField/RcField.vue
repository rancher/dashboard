<script setup lang="ts">
/**
 * Provides the layout shared by Rancher Component fields: a header with the
 * label, required marker, info tooltip and Reset link, a box holding the
 * control, and a footer with the validation message and helper text.
 *
 * In view mode the box loses its border and background and a rail
 * marks the value.
 *
 * This is designed to construct fields and should not be commonly used for
 * Dashboard feature development.
 *
 * Example:
 *
 * <rc-field label="Name" helper-text="Lowercase letters only" required>
 *   <template #default="{ id, describedby, invalid, disabled, isView }">
 *     <span v-if="isView">{{ value }}</span>
 *     <input v-else :id="id" :aria-describedby="describedby" :aria-invalid="invalid" :disabled="disabled">
 *   </template>
 * </rc-field>
 */
import { computed, useId } from 'vue';
import RcButton from '@components/RcButton/RcButton.vue';
import { RcIconTooltip } from '@components/RcIconTooltip';
import RcFieldValidation from './RcFieldValidation.vue';
import { useFieldState } from './useFieldState';
import type { RcFieldProps, RcFieldSlotProps } from './types';

const props = withDefaults(defineProps<RcFieldProps>(), {
  mode:              undefined,
  disabled:          undefined,
  size:              'medium',
  label:             undefined,
  tooltip:           undefined,
  helperText:        undefined,
  validationMessage: undefined,
  validationStatus:  'error',
  id:                undefined,
});

const emit = defineEmits<{
  reset: [];
}>();

defineSlots<{
  default(props: RcFieldSlotProps): unknown;
}>();

const { disabled, isView } = useFieldState(props);

const uid = useId();
const controlId = computed(() => props.id || `rc-field-${ uid }`);
const helperId = computed(() => `${ controlId.value }-helper`);
const validationId = computed(() => `${ controlId.value }-validation`);

const showValidation = computed(() => !!props.validationMessage && !isView.value);
const showHelper = computed(() => !!props.helperText);
const showReset = computed(() => props.resettable && !isView.value && !disabled.value);

const describedby = computed(() => {
  const ids = [
    showValidation.value ? validationId.value : '',
    showHelper.value ? helperId.value : '',
  ].filter(Boolean);

  return ids.length ? ids.join(' ') : undefined;
});

const slotProps = computed<RcFieldSlotProps>(() => ({
  id:          controlId.value,
  describedby: describedby.value,
  invalid:     showValidation.value && props.validationStatus === 'error',
  required:    props.required && !isView.value,
  disabled:    disabled.value,
  isView:      isView.value,
}));

const tooltipSize = computed(() => (props.size === 'small' ? 'small' : 'medium'));
</script>

<template>
  <div
    class="rc-field"
    :class="{
      [`rc-field-${ props.size }`]: true,
      'rc-field-view': isView,
      'rc-field-disabled': disabled,
    }"
  >
    <div
      v-if="props.label"
      class="rc-field-header"
    >
      <div class="rc-field-label-wrapper">
        <component
          :is="isView ? 'span' : 'label'"
          class="rc-field-label"
          :for="isView ? undefined : controlId"
        >
          {{ props.label }}<span
            v-if="props.required && !isView"
            class="rc-field-required"
            aria-hidden="true"
          >*</span>
        </component>
        <rc-icon-tooltip
          v-if="props.tooltip && !isView"
          class="rc-field-tooltip"
          :content="props.tooltip"
          :size="tooltipSize"
        />
      </div>
      <rc-button
        v-if="showReset"
        type="button"
        variant="link"
        size="inherit"
        class="rc-field-reset"
        @click="emit('reset')"
      >
        {{ t('component.rcField.reset') }}
      </rc-button>
    </div>

    <div class="rc-field-box">
      <slot v-bind="slotProps" />
    </div>

    <div
      v-if="showValidation || showHelper"
      class="rc-field-footer"
    >
      <rc-field-validation
        v-if="showValidation"
        :id="validationId"
        :message="props.validationMessage || ''"
        :status="props.validationStatus"
      />
      <p
        v-if="showHelper"
        :id="helperId"
        class="rc-field-helper"
      >
        {{ props.helperText }}
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '../_variables.scss';

.rc-field {
  // Distance from the top of the box to the top of the value. View mode pads
  // the value by the same amount so it does not move between modes.
  --rc-field-value-offset: calc((var(--rc-field-height) - var(--rc-field-line-height)) / 2);

  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;

  &.rc-field-small {
    --rc-field-reset-font-weight: 700;
    --rc-field-height: #{$rc-field-small-height};
    --rc-field-padding-x: 8px;
    --rc-field-gap: 12px;
    --rc-field-font-size: 12px;
    --rc-field-line-height: 18px;
    --rc-field-label-font-size: 12px;
    --rc-field-label-line-height: 18px;
    --rc-field-label-font-weight: 600;
    --rc-field-meta-font-size: 10px;
    --rc-field-meta-line-height: 15px;
    --rc-field-meta-font-weight: 700;
  }

  &.rc-field-medium {
    --rc-field-reset-font-weight: 600;
    --rc-field-height: #{$rc-field-medium-height};
    --rc-field-padding-x: 12px;
    --rc-field-gap: 16px;
    --rc-field-font-size: 14px;
    --rc-field-line-height: 21px;
    --rc-field-label-font-size: 14px;
    --rc-field-label-line-height: 21px;
    --rc-field-label-font-weight: 400;
    --rc-field-meta-font-size: 12px;
    --rc-field-meta-line-height: 18px;
    --rc-field-meta-font-weight: 400;
  }

  &.rc-field-large {
    --rc-field-reset-font-weight: 400;
    --rc-field-height: #{$rc-field-large-height};
    --rc-field-padding-x: 16px;
    --rc-field-gap: 24px;
    --rc-field-font-size: 16px;
    --rc-field-line-height: 21px;
    --rc-field-label-font-size: 16px;
    --rc-field-label-line-height: 21px;
    --rc-field-label-font-weight: 400;
    --rc-field-meta-font-size: 14px;
    --rc-field-meta-line-height: 21px;
    --rc-field-meta-font-weight: 400;
  }
}

.rc-field-header {
  display: flex;
  align-items: center;
  gap: 24px;
  font-size: var(--rc-field-meta-font-size);
  font-weight: var(--rc-field-reset-font-weight);
  line-height: var(--rc-field-meta-line-height);
}

.rc-field-label-wrapper {
  display: flex;
  color: var(--input-label);
  flex: 1 1 0;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.rc-field-label {
  overflow: hidden;
  margin: 0;
  color: var(--input-label);
  font-size: var(--rc-field-label-font-size);
  font-weight: var(--rc-field-label-font-weight);
  line-height: var(--rc-field-label-line-height);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.rc-field-required {
  margin-left: 4px;
  color: var(--rc-error);
}

.rc-field-box {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--rc-field-gap);
  box-sizing: border-box;
  height: var(--rc-field-height);
  padding: 0 var(--rc-field-padding-x);
  border: 1px solid var(--input-border);
  border-radius: var(--border-radius, 4px);
  background-color: var(--input-bg);
  color: var(--input-text);
  font-size: var(--rc-field-font-size);
  line-height: var(--rc-field-line-height);

  &:has(.rc-field-control:focus) {
    @include focus-outline;
    outline-offset: 1px;
  }

  .rc-field-disabled & {
    border-color: var(--input-disabled-border);
    background-color: var(--input-disabled-bg);
    color: var(--input-disabled-text);
    cursor: not-allowed;
  }
}

// The design pulls the label 6px closer to the value in view mode. Keeping the
// edit spacing instead lines labels up across fields in different modes.
.rc-field-view {
  .rc-field-box {
    gap: 8px;
    padding: var(--rc-field-value-offset) var(--rc-field-padding-x) var(--rc-field-value-offset) calc(var(--rc-field-padding-x) + 1px);
    border: 0;
    background: none;
    cursor: auto;

    &::before {
      content: '';
      position: absolute;
      top: calc(var(--rc-field-value-offset) - 2px);
      left: 0;
      width: 3px;
      height: calc(var(--rc-field-line-height) + 4px);
      background-color: var(--input-border);
    }
  }
}

.rc-field-footer {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: var(--rc-field-meta-font-size);
  line-height: var(--rc-field-meta-line-height);
}

.rc-field-helper {
  margin: 0;
  color: var(--input-label);
  font-weight: var(--rc-field-meta-font-weight);
}
</style>
