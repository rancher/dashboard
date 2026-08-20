<script setup lang="ts">
import { computed, ref, useSlots } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { DEFAULT_FOCUS_TRAP_OPTS, useBasicSetupFocusTrap } from '@shell/composables/focusTrap';
import { generateRandomAlphaString } from '@shell/utils/string';
import RcButton from '@components/RcButton/RcButton.vue';
import type { RcModalProps } from './types';
import { widthFor } from './widths';

defineOptions({ inheritAttrs: false });

const props = defineProps<Omit<RcModalProps, 'show'>>();

const emit = defineEmits<{ cancel: []; close: [] }>();

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

useBasicSetupFocusTrap(`#${ dialogId }`, {
  ...DEFAULT_FOCUS_TRAP_OPTS,
  // Both of these default to letting the user out of the trap while the modal
  // is still on screen: Escape tears the trap down, and an outside click moves
  // focus to the body. The modal decides whether either dismisses it, so the
  // trap holds until it is gone.
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

const slotContext = { cancel, close };

function onKeydown(event: KeyboardEvent) {
  if (props.clickToClose && event.key === 'Escape') {
    // Scoped to the dialog rather than the document, so that stacking a second
    // modal does not close both on one keypress. Focus is trapped inside, so
    // Escape always reaches this.
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
      <h2
        v-if="hasTitle"
        :id="titleId"
        class="rc-modal__title"
        data-testid="rc-modal-title"
      >
        <slot name="title">
          {{ title }}
        </slot>
      </h2>
      <div
        class="rc-modal__body"
        data-testid="rc-modal-body"
      >
        <slot />
      </div>
      <div
        v-if="hasActions"
        class="rc-modal__actions"
        data-testid="rc-modal-actions"
      >
        <slot
          name="actions"
          v-bind="slotContext"
        >
          <RcButton
            variant="secondary"
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
.rc-modal-overlay {
  --rc-modal-width: v-bind(width);

  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--overlay-bg);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: z-index('modalOverlay');
}

.rc-modal {
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-width: 100vw;
  max-height: 95vh;
  overflow: hidden;
  background-color: var(--modal-bg);
  border: 2px solid var(--modal-border);
  border-radius: var(--border-radius-lg);

  &:focus-visible {
    @include focus-outline;
    outline-offset: 2px;
  }
}

.rc-modal__title {
  flex-shrink: 0;
  margin: 0;
  padding: 24px 24px 16px;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--body-text);
}

.rc-modal__body {
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  width: var(--rc-modal-width);
  max-width: 100%;
  padding: 0 24px;

  &:first-child {
    padding-top: 24px;
  }

  &:last-child {
    padding-bottom: 24px;
  }

  > :deep(:first-child) {
    margin-top: 0;
  }

  > :deep(:last-child) {
    margin-bottom: 0;
  }
}

.rc-modal__actions {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
  padding: 40px 24px 24px;
}
</style>
