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
 * whatever opened it. `Esc` always emits `close`, whatever `clickToClose` says,
 * so no modal is a keyboard trap; with `clickToClose` false a click on the
 * background does not.
 *
 * Attributes that are not props land on the dialog element, so `class` and
 * `data-testid` work as usual.
 *
 * `size` is the width of the modal, and the three sizes are the whole of it.
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
import { computed } from 'vue';
import RcModalDialog from './RcModalDialog.vue';
import type { RcModalProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<RcModalProps>(), {
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

const MODALS_CONTAINER = '#modals';

/**
 * Where the dialog is teleported. The shell renders `#modals` once, at the end
 * of the body, and that is where a modal belongs, but it is markup like any
 * other and an extension can replace the page around it. Falling back to the
 * body keeps the modal on screen rather than rendering nothing at all.
 *
 * Resolved each time the modal opens, since the container only has to be there
 * by then, not when the consumer that renders this was mounted.
 */
const teleportTarget = computed(() => (props.show && document.querySelector(MODALS_CONTAINER) ? MODALS_CONTAINER : 'body'));
</script>

<template>
  <Teleport :to="teleportTarget">
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
        v-if="$slots.title"
        #title
      >
        <!-- @slot The heading, for when it needs more than the string the `title` prop takes. -->
        <slot name="title" />
      </template>

      <!-- @slot The modal body. Each direct child is a content section. -->
      <slot />

      <template
        v-if="$slots.actions"
        #actions="scope"
      >
        <!-- @slot The whole footer row, cancel button included. Receives `close`, `cancel` and `primaryAction`. -->
        <slot
          name="actions"
          v-bind="scope"
        />
      </template>

      <template
        v-if="$slots['primary-action']"
        #primary-action="scope"
      >
        <!-- @slot Just the confirming button; the cancel button comes with it. Receives `close`, `cancel` and `primaryAction`. -->
        <slot
          name="primary-action"
          v-bind="scope"
        />
      </template>
    </RcModalDialog>
  </Teleport>
</template>
