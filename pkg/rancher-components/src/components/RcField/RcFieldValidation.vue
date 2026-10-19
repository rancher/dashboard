<script setup lang="ts">
/**
 * A field's validation message and associated status icon.
 *
 * Validation messages keep to one line by default. When a message is too long
 * to fit in one line, a toggle to "Show more"/"Show less" is rendered to
 * expand/collapse the validation message content.
 *
 * Example:
 *
 * <rc-field-validation id="name-validation" status="error" message="Name is required" />
 */
import {
  computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch
} from 'vue';
import RcButton from '@components/RcButton/RcButton.vue';
import RcIcon from '@components/RcIcon/RcIcon.vue';
import type { RcIconType } from '@components/RcIcon/types';
import type { RcFieldValidationStatus } from './types';

const ICONS: Record<RcFieldValidationStatus, RcIconType> = {
  error:   'error',
  warning: 'warning',
  success: 'checkmark',
  info:    'info',
};

const props = defineProps<{
  /**
   * The id of the message text, which the field's control is described by.
   */
  id: string;

  message: string;

  status: RcFieldValidationStatus;
}>();

const text = useTemplateRef<HTMLElement>('text');

const expanded = ref(false);
const truncated = ref(false);

const showToggle = computed(() => expanded.value || truncated.value);

const measure = () => {
  const el = text.value;

  truncated.value = !expanded.value && !!el && el.scrollWidth > el.clientWidth + 1;
};

const toggle = () => {
  expanded.value = !expanded.value;
  nextTick(measure);
};

let observer: ResizeObserver | undefined;

onMounted(() => {
  measure();

  // The width the line has follows the form's, and with it whether the message fits
  if (typeof ResizeObserver !== 'undefined' && text.value) {
    observer = new ResizeObserver(measure);
    observer.observe(text.value);
  }
});

onBeforeUnmount(() => observer?.disconnect());

watch(() => props.message, () => {
  expanded.value = false;
  nextTick(measure);
});
</script>

<template>
  <div
    class="rc-field-validation"
    :class="[`rc-field-validation-${ props.status }`, { expanded }]"
  >
    <rc-icon
      class="rc-field-validation-icon"
      :type="ICONS[props.status]"
      :status="props.status"
      size="small"
    />
    <span
      :id="props.id"
      ref="text"
      class="rc-field-validation-message"
    >{{ props.message }}</span>
    <rc-button
      v-if="showToggle"
      type="button"
      variant="link"
      size="inherit"
      class="rc-field-validation-toggle"
      :aria-expanded="expanded"
      :aria-controls="props.id"
      @click="toggle"
    >
      {{ expanded ? t('component.rcField.showLess') : t('component.rcField.showMore') }}
    </rc-button>
  </div>
</template>

<style lang="scss" scoped>
.rc-field-validation {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;

  @each $status in error, warning, success, info {
    &.rc-field-validation-#{$status} {
      color: var(--rc-#{$status});
    }
  }

  &.expanded {
    align-items: flex-start;
  }
}

.rc-field-validation-icon {
  flex-shrink: 0;

  .expanded & {
    // Centred on the first line rather than the whole message
    margin-top: calc((1lh - 14px) / 2);
  }
}

.rc-field-validation-message {
  overflow: hidden;
  flex: 1 1 0;
  min-width: 0;
  white-space: nowrap;
  text-overflow: ellipsis;

  .expanded & {
    overflow-wrap: anywhere;
    white-space: normal;
  }
}

.rc-field-validation-toggle {
  flex-shrink: 0;
}
</style>
