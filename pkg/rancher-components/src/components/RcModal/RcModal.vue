<script setup lang="ts">
/**
 * The standard dashboard modal.
 *
 * Owns both the behaviour (teleport, focus trap, `Esc` and click-outside close)
 * and the layout every modal used to re-implement: heading, body and
 * right-aligned actions, with the padding and spacing from the design system.
 *
 * Visibility is the `show` prop, so the modal can animate in and out. It emits
 * `cancel` when the user backs out (the cancel button, `Esc`, a background
 * click) and `close` whenever it should be taken down, including after
 * `cancel`.
 *
 * Three content slots, plus a shortcut for the common footer:
 *
 * - `title` renders the heading, and overrides the `title` prop when the
 *   heading needs markup.
 * - the default slot is the body. Each direct child is a content section.
 * - `primary-action` supplies just the confirming button; the cancel button
 *   comes with it.
 * - `actions` replaces the whole footer when the defaults do not fit. Give
 *   neither and no footer row is rendered.
 *
 * Both footer slots receive `cancel` and `close` so a button can end the modal
 * without the consumer wiring it up.
 *
 * Focus is trapped inside the modal for as long as it is open and returned to
 * whatever opened it. With `clickToClose` false neither `Esc` nor a click
 * outside dismisses it, and the trap holds.
 *
 * Attributes that are not props land on the dialog element, so `class` and
 * `data-testid` work as usual.
 *
 * `size` sets the width of the body, and the modal grows to fit it. A modal
 * that genuinely needs a width outside the three can override the custom
 * property from its own class, without a prop for it:
 *
 * .my-modal { --rc-modal-width: 800px; }
 *
 * Example:
 *
 * <RcModal
 *   :show="showModal"
 *   :title="t('promptRemove.title')"
 *   size="small"
 *   @close="showModal = false"
 * >
 *   <p>{{ t('promptRemove.attemptingToRemove', { type }) }}</p>
 *   <template #primary-action="{ close }">
 *     <RcButton variant="primary" @click="remove(close)">
 *       {{ t('generic.remove') }}
 *     </RcButton>
 *   </template>
 * </RcModal>
 */
import RcModalDialog from './RcModalDialog.vue';
import type { RcModalProps } from './types';

defineOptions({ inheritAttrs: false });

withDefaults(defineProps<RcModalProps>(), {
  show:         false,
  title:        '',
  size:         'medium',
  clickToClose: true,
});

defineEmits<{ cancel: []; close: [] }>();
</script>

<template>
  <Teleport to="#modals">
    <Transition
      name="rc-modal-fade"
      appear
    >
      <RcModalDialog
        v-if="show"
        v-bind="$attrs"
        :title="title"
        :size="size"
        :click-to-close="clickToClose"
        @cancel="$emit('cancel')"
        @close="$emit('close')"
      >
        <template
          v-if="$slots.title"
          #title
        >
          <slot name="title" />
        </template>

        <slot />

        <template
          v-if="$slots.actions"
          #actions="context"
        >
          <slot
            name="actions"
            v-bind="context"
          />
        </template>

        <template
          v-if="$slots['primary-action']"
          #primary-action="context"
        >
          <slot
            name="primary-action"
            v-bind="context"
          />
        </template>
      </RcModalDialog>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.rc-modal-fade-enter-active,
.rc-modal-fade-leave-active {
  transition: opacity 200ms;
}

.rc-modal-fade-enter-from,
.rc-modal-fade-leave-to {
  opacity: 0;
}
</style>
