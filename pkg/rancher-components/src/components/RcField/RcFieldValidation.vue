<script setup lang="ts">
/**
 * A field's validation message and associated status icon.
 *
 * Validation messages wrap to at most two lines. A message too long for two
 * lines is replaced by a generic summary of its status, with a "Show more"
 * button that opens the full message in a popover. Screen readers are given
 * the full message either way.
 *
 * Example:
 *
 * <rc-field-validation id="name-validation" status="error" message="Name is required" />
 */
import {
  nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch
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
const toggle = useTemplateRef<InstanceType<typeof RcButton>>('toggle');
const dialog = useTemplateRef<HTMLElement>('dialog');

const truncated = ref(false);
const open = ref(false);

const summaryId = `${ props.id }-summary`;
const popoverId = `${ props.id }-popover`;

const measure = () => {
  const el = text.value;

  truncated.value = !!el && el.scrollHeight > el.clientHeight + 1;
};

const close = (returnFocus = false) => {
  open.value = false;

  if (returnFocus) {
    toggle.value?.focus();
  }
};

// The popover's content renders as it first shows, after the event
const focusDialog = () => nextTick(() => dialog.value?.focus());

// The toggle closes the popover itself; leaving for anything else closes it here
const onFocusout = (e: FocusEvent) => {
  const next = e.relatedTarget as Node | null;

  if (dialog.value?.contains(next) || toggle.value?.$el?.contains(next)) {
    return;
  }

  close();
};

let observer: ResizeObserver | undefined;

onMounted(() => {
  measure();

  // The width the message has follows the form's, and with it whether the message fits
  if (typeof ResizeObserver !== 'undefined' && text.value) {
    observer = new ResizeObserver(measure);
    observer.observe(text.value);
  }
});

onBeforeUnmount(() => observer?.disconnect());

watch(() => props.message, () => {
  close();
  nextTick(measure);
});
</script>

<template>
  <div
    class="rc-field-validation"
    :class="[`rc-field-validation-${ props.status }`, { truncated }]"
  >
    <rc-icon
      class="rc-field-validation-icon"
      :type="ICONS[props.status]"
      :status="props.status"
      size="small"
    />
    <span
      :id="props.id"
      class="rc-field-validation-text"
      aria-atomic="true"
    >
      <span class="rc-field-validation-status">{{ t(`component.rcField.status.${ props.status }`) + ' ' }}</span>
      <span
        ref="text"
        class="rc-field-validation-message"
      >{{ props.message }}</span>
    </span>
    <span
      v-if="truncated"
      class="rc-field-validation-summary"
    >
      <span
        :id="summaryId"
        aria-hidden="true"
      >{{ t(`component.rcField.summary.${ props.status }`) }}</span>
      {{ ' ' }}
      <v-dropdown
        class="rc-field-validation-more"
        no-auto-focus
        :triggers="[]"
        :shown="open"
        :auto-hide="false"
        placement="bottom-start"
        @apply-show="focusDialog"
      >
        <rc-button
          ref="toggle"
          type="button"
          variant="link"
          size="inherit"
          class="rc-field-validation-toggle"
          aria-haspopup="dialog"
          :aria-expanded="open"
          :aria-controls="open ? popoverId : undefined"
          @click="open = !open"
        >
          {{ t('component.rcField.showMore') }}
        </rc-button>
        <template #popper>
          <div
            :id="popoverId"
            ref="dialog"
            role="dialog"
            tabindex="-1"
            class="rc-field-validation-popover"
            :aria-labelledby="summaryId"
            @focusout="onFocusout"
            @keydown.escape.stop="close(true)"
            @keydown.tab.prevent="close(true)"
          >
            {{ props.message }}
          </div>
        </template>
      </v-dropdown>
    </span>
  </div>
</template>

<style lang="scss" scoped>
$icon-size: 14px;
$icon-gap: 8px;

.rc-field-validation {
  position: relative;
  font-weight: 700;
  white-space: normal;

  @each $status in error, warning, success, info {
    &.rc-field-validation-#{$status} {
      color: var(--rc-#{$status});
    }
  }
}

// Set into the first line's indent, so a second line wraps under it
.rc-field-validation-icon {
  position: absolute;
  top: calc((1lh - #{$icon-size}) / 2);
  left: 0;
}

.rc-field-validation-status {
  position: absolute;
  overflow: hidden;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.rc-field-validation-message,
.rc-field-validation-summary {
  display: block;
  text-indent: $icon-size + $icon-gap;
}

.rc-field-validation-message {
  // Clamped so that it measures whether it needs more than two lines
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow-wrap: anywhere;

  // Kept laid out at the full width to measure, and readable by screen readers, but not seen
  .truncated & {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    clip-path: inset(50%);
    pointer-events: none;
  }
}

.rc-field-validation-more {
  display: inline;
  text-indent: 0;
}

.rc-field-validation-popover {
  box-sizing: border-box;
  max-width: 320px;
  padding: 12px 16px;
  color: var(--body-text);
  font-size: 14px;
  font-weight: 400;
  line-height: 21px;
  overflow-wrap: anywhere;
  white-space: normal;

  &:focus-visible {
    @include focus-outline;
  }
}
</style>
