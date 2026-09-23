<script setup lang="ts">
/**
 * The standard dashboard modal: teleport, focus trap, `Esc` and click-outside
 * close, and the heading, body and right-aligned actions the design system
 * specs.
 *
 * Stateless. `show` says whether it is open and the consumer owns it, so
 * nothing dismisses the modal until the consumer sets it false.
 *
 * Emits `open` when it appears, `close` whenever the user asks to leave by any
 * route, `cancel` when they backed out specifically (the cancel button, `Esc`
 * or a background click, always followed by `close`), and `primary-action`
 * when the confirming button is invoked. `primary-action` reports only: taking
 * the modal down stays the consumer's call.
 *
 * Focus is trapped while the modal is open, opens on the first control it
 * offers and returns to whatever opened it. `Esc` always emits `close`,
 * whatever `clickToClose` says; with `clickToClose` false a background click
 * does not.
 *
 * Attributes that are not props land on the dialog element, so `class` and
 * `data-testid` work as usual.
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
