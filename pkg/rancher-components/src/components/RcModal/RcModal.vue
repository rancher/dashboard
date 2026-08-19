<script setup lang="ts">
/**
 * The standard dashboard modal.
 *
 * Owns both the behaviour (teleport, focus trap, `Esc` and click-outside close)
 * and the layout every modal used to re-implement: heading, body and
 * right-aligned actions, with the padding and spacing from the design system.
 *
 * The modal holds no state of its own. `show` says whether it is open, and
 * owning it is the consumer's job, so nothing dismisses the modal until the
 * consumer sets it false.
 *
 * Four events report what happened:
 *
 * - `open` when it appears.
 * - `close` whenever the user asks to leave, by any route.
 * - `cancel` when they backed out specifically: the cancel button, `Esc`, or a
 *   click on the background. Always followed by `close`, so a consumer that
 *   only cares that the modal is going can listen to `close` alone.
 * - `primary-action` when the confirming button is invoked. It reports only;
 *   taking the modal down stays the consumer's call.
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
 * Both footer slots receive `close`, `cancel` and `primaryAction`, so a button
 * in either raises the matching event without the consumer wiring it up:
 *
 * <template #actions="{ cancel, primaryAction }">
 *   <RcButton variant="tertiary" @click="cancel">Not now</RcButton>
 *   <RcButton variant="primary" @click="primaryAction">Restore</RcButton>
 * </template>
 *
 * Focus is trapped inside the modal for as long as it is open and returned to
 * whatever opened it. With `clickToClose` false neither `Esc` nor a click
 * outside emits `close`, and the trap holds.
 *
 * Attributes that are not props land on the dialog element, so `class` and
 * `data-testid` work as usual.
 *
 * `size` is the width of the modal. A modal that genuinely needs a width
 * outside the three can override the custom property from its own class,
 * without a prop for it:
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
 *   @primary-action="remove"
 * >
 *   <p>{{ t('promptRemove.attemptingToRemove', { type }) }}</p>
 *   <template #primary-action="{ primaryAction }">
 *     <RcButton variant="primary" @click="primaryAction">
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

defineEmits<{
  open: [];
  close: [];
  cancel: [];
  'primary-action': [];
}>();
</script>

<template>
  <Teleport to="#modals">
    <RcModalDialog
      v-if="show"
      v-bind="$attrs"
      :title="title"
      :size="size"
      :click-to-close="clickToClose"
      @open="$emit('open')"
      @close="$emit('close')"
      @cancel="$emit('cancel')"
      @primary-action="$emit('primary-action')"
    >
      <template
        v-for="(_, name) in $slots"
        #[name]="scope"
      >
        <slot
          :name="name"
          v-bind="scope || {}"
        />
      </template>
    </RcModalDialog>
  </Teleport>
</template>
