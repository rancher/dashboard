<script setup lang="ts">
/**
 * The modal itself: the chrome, the focus trap and the dismiss gestures.
 *
 * Internal to the package. `RcModal` is the component consumers render, and it
 * owns the two things this one deliberately does not: where the dialog is
 * teleported, and whether it exists at all. `RcModal` mounts this with `v-if`,
 * so a dialog exists only while the modal is open, and every open gets a fresh
 * focus trap and fresh element ids.
 *
 * Props are `RcModalProps` without `show`, since visibility is settled by the
 * time this is mounted:
 *
 * - `title` renders the heading and names the dialog for assistive technology.
 * - `size` picks the width, padding included.
 * - `clickToClose` decides whether a background click is a dismiss gesture.
 *
 * Emits `open` when it mounts, `close` whenever the user asks to leave,
 * `cancel` when they backed out specifically (always followed by `close`), and
 * `primary-action` when the confirming button is invoked.
 *
 * Slots are `title`, the default body, `actions` and `primary-action`. Both
 * footer slots receive `close`, `cancel` and `primaryAction` so a button in
 * either raises the matching event. Given `primary-action` alone, the footer
 * supplies the cancel button beside it; given `actions`, the whole row is the
 * consumer's. Given neither, no footer is rendered.
 *
 * Attributes that are not props land on the dialog element, so a consumer's
 * `class` and `data-testid` reach it through `RcModal`.
 */
import {
  computed, onBeforeUnmount, onMounted, ref, useSlots
} from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { DEFAULT_FOCUS_TRAP_OPTS, useBasicSetupFocusTrap } from '@shell/composables/focusTrap';
import { generateRandomAlphaString } from '@shell/utils/string';
import RcButton from '@components/RcButton/RcButton.vue';
import { widthFor, type RcModalProps } from './types';

defineOptions({ inheritAttrs: false });

const props = defineProps<Omit<RcModalProps, 'show'>>();

const emit = defineEmits<{
  open: [];
  close: [];
  cancel: [];
  'primary-action': [];
}>();

const slots = useSlots();

const store = useStore();
const { t } = useI18n(store);

const uid = generateRandomAlphaString(12);
const dialogId = `rc-modal-${ uid }`;
const titleId = `rc-modal-title-${ uid }`;

const width = computed(() => widthFor(props.size));

const hasTitle = computed(() => !!props.title || !!slots.title);

const hasActions = computed(() => !!slots.actions || !!slots['primary-action']);

const dialog = ref<HTMLElement | null>(null);
const body = ref<HTMLElement | null>(null);

/**
 * Whether the body is scrolling its content. A scroll container that is not
 * focusable leaves whatever it scrolls reachable by mouse only, so the body
 * becomes a tab stop for exactly as long as it has something to scroll.
 */
const bodyScrolls = ref(false);

const measureBody = () => {
  bodyScrolls.value = !!body.value && body.value.scrollHeight > body.value.clientHeight;
};

let bodyResize: ResizeObserver | undefined;

onMounted(() => {
  emit('open');

  measureBody();

  // The body's own box changes size as its content grows, right up to the point
  // the modal's height caps it, so watching the box catches content that
  // arrives after the modal opened.
  if (body.value && typeof ResizeObserver !== 'undefined') {
    bodyResize = new ResizeObserver(measureBody);
    bodyResize.observe(body.value);
  }
});

onBeforeUnmount(() => bodyResize?.disconnect());

useBasicSetupFocusTrap(`#${ dialogId }`, {
  ...DEFAULT_FOCUS_TRAP_OPTS,
  escapeDeactivates: false,
  allowOutsideClick: () => props.clickToClose,
  fallbackFocus:     `#${ dialogId }`,
});

function close() {
  emit('close');
}

function cancel() {
  emit('cancel');
  close();
}

function primaryAction() {
  emit('primary-action');
}

const slotContext = {
  close,
  cancel,
  primaryAction,
};

// `Esc` closes whatever `clickToClose` says. A modal can be built with no
// cancel button, from the actions slot, and a keyboard user needs a way out of
// every one of them. Refusing a close stays the consumer's call, made in its
// `close` handler, where the same refusal already covers the cancel button.
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.stopPropagation();
    cancel();
  }
}

function onOverlayClick(event: MouseEvent) {
  if (props.clickToClose && dialog.value && !dialog.value.contains(event.target as Node)) {
    cancel();
  }
}
</script>

<template>
  <div
    class="rc-modal-overlay"
    @click="onOverlayClick"
  >
    <div
      :id="dialogId"
      ref="dialog"
      v-bind="$attrs"
      class="rc-modal"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="hasTitle ? titleId : undefined"
      tabindex="-1"
      @keydown="onKeydown"
    >
      <div class="content">
        <h2
          v-if="hasTitle"
          :id="titleId"
          class="title"
          data-testid="rc-modal-title"
        >
          <slot name="title">
            {{ title }}
          </slot>
        </h2>
        <div
          ref="body"
          class="body"
          :tabindex="bodyScrolls ? 0 : undefined"
          data-testid="rc-modal-body"
        >
          <slot />
        </div>
      </div>
      <div
        v-if="hasActions"
        class="actions"
        data-testid="rc-modal-actions"
      >
        <slot
          name="actions"
          v-bind="slotContext"
        >
          <RcButton
            variant="tertiary"
            size="large"
            data-testid="rc-modal-cancel"
            @click="cancel"
          >
            {{ t('generic.cancel') }}
          </RcButton>
          <slot
            name="primary-action"
            v-bind="slotContext"
          />
        </slot>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// A focus ring is drawn outside the element it belongs to, and a scroll
// container clips anything that leaves its box. This is the room the body's
// scroll box leaves for one.
$focus-ring-gutter: 4px;

.rc-modal-overlay {
  --rc-modal-width: v-bind(width);

  position: fixed;
  inset: 0;
  padding: 40px;
  overflow: auto;
  overscroll-behavior: contain;
  background-color: var(--overlay-bg);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: z-index('modalOverlay');
}

.rc-modal {
  display: flex;
  flex-direction: column;
  gap: 40px;
  width: var(--rc-modal-width);
  min-width: 0;
  max-width: 100%;
  max-height: 100%;
  overflow: hidden;
  padding: 24px;
  background-color: var(--modal-bg);
  border-radius: var(--border-radius-lg);

  &:focus-visible {
    @include focus-outline;
    outline-offset: 2px;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1 1 auto;
    min-height: 0;
  }

  .title {
    flex-shrink: 0;
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--body-text);
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: 24px;
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    line-height: 1.4;

    // Pad the scroll box by the gutter and take the same back off the outside,
    // so a ring on the content has room and the content itself stays where the
    // design puts it.
    padding: $focus-ring-gutter;
    margin: -$focus-ring-gutter;

    &:focus-visible {
      @include focus-outline;
      outline-offset: -2px;
    }

    > :deep(:first-child) {
      margin-top: 0;
    }

    > :deep(:last-child) {
      margin-bottom: 0;
    }
  }

  .actions {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
  }
}

</style>
