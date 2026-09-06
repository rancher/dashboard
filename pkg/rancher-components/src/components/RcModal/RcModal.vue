<script setup lang="ts">
/**
 * The standard chrome for a modal's contents: a titled header, a body that
 * scrolls when it has to, and a footer whose actions sit in one place at one
 * size. It owns padding, dividers and button placement so that individual
 * modals stop deciding those for themselves. The background is deliberately
 * not painted here - it stays with `AppModal`, so nothing inside a modal ever
 * puts a second surface on top of it.
 *
 * It is layout only. Overlay, teleport, focus trap, `Esc` and click-outside
 * close, and width all stay with `AppModal`, which is either supplied by the
 * host or written around this component:
 *
 * <AppModal :width="600" :trigger-focus-trap="true" @close="close">
 *   <RcModal :title="t('some.title')">
 *     <p>Body content</p>
 *     <template #actions>
 *       <button class="btn role-secondary" @click="close">{{ t('generic.cancel') }}</button>
 *       <AsyncButton mode="apply" @click="apply" />
 *     </template>
 *   </RcModal>
 * </AppModal>
 *
 * A component registered in `shell/dialog/` writes the `RcModal` alone -
 * `PromptModal` already supplies the `AppModal` around it. Do not reach for
 * `Card` inside a modal; this replaces it.
 *
 * Host requirement: pinning the header and the actions while the body scrolls
 * needs the dialog box to be a flex column, which `AppModal` does for any modal
 * containing an `RcModal` (see the `.modal-container:has(.rc-modal)` rule in
 * `AppModal.vue`). In any other host the chrome still renders correctly, but
 * the whole modal scrolls rather than just the body.
 *
 * A body that does scroll becomes a tab stop of its own, so its overflow can be
 * reached with a keyboard and not only with a pointer. A body that fits does
 * not, so no modal gains a stop that does nothing.
 */
import {
  computed, onBeforeUnmount, ref, useId, useTemplateRef, watch
} from 'vue';
import RcSeparator from '@components/RcSeparator/RcSeparator.vue';
import type { RcModalProps } from './types';

const props = withDefaults(defineProps<RcModalProps>(), { title: '' });

const generatedTitleId = useId();

const resolvedTitleId = computed(() => props.titleId || generatedTitleId);

const titleEl = useTemplateRef<HTMLElement>('titleEl');

// A modal needs an accessible name, and the name lives here while `role="dialog"`
// is on the host's element. A dialog reached through `PromptModal` cannot be
// given one by the component inside it, so the title claims the nearest dialog
// itself. A host that labelled its dialog already keeps its own wiring.
//
// Watched rather than done once on mount, because a title is often only known
// after the modal has fetched something, and a header that appears later has to
// name the dialog too.
let labelledDialog: Element | null = null;
let writtenId = '';

// Only ever take back the exact name this modal wrote, so a host that labels
// its own dialog later is not quietly stripped of it.
function releaseName() {
  if (labelledDialog?.getAttribute('aria-labelledby') === writtenId) {
    labelledDialog.removeAttribute('aria-labelledby');
  }

  labelledDialog = null;
  writtenId = '';
}

watch([titleEl, resolvedTitleId], ([el, id]) => {
  releaseName();

  // alertdialog too, because a destructive confirm carries that role instead
  // and it sits closer than the container AppModal renders.
  const dialog = el?.closest('[role="dialog"], [role="alertdialog"]');

  if (dialog && !dialog.getAttribute('aria-labelledby')) {
    dialog.setAttribute('aria-labelledby', id);
    labelledDialog = dialog;
    writtenId = id;
  }
}, { immediate: true, flush: 'post' });

// A body that scrolls has to be reachable by keyboard, or its overflow is
// readable with a mouse only. Chromium focuses such a scroller by itself, but
// only when it holds nothing else focusable, and the focus trap around a modal
// tabs to elements with a tabindex rather than to whatever the browser would
// focus, so neither route reaches it here. An explicit tabindex, and only while
// there is something to scroll to, is what both of them do agree on.
const bodyEl = useTemplateRef<HTMLElement>('bodyEl');
const contentEl = useTemplateRef<HTMLElement>('contentEl');

const scrollable = ref(false);

// The body's own box changes with the viewport and the content's with the
// slot, and either can start or stop the overflow, so both are watched.
// Sub-pixel differences are not overflow anyone can scroll to.
function measure() {
  const el = bodyEl.value;

  scrollable.value = !!el && el.scrollHeight - el.clientHeight > 1;
}

let observer: ResizeObserver | null = null;

watch([bodyEl, contentEl], ([body, content]) => {
  observer?.disconnect();
  observer = null;

  if (!body || !content) {
    scrollable.value = false;

    return;
  }

  observer = new ResizeObserver(measure);
  observer.observe(body);
  observer.observe(content);
  measure();
}, { immediate: true, flush: 'post' });

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
  releaseName();
});
</script>

<template>
  <div
    class="rc-modal"
    data-testid="rc-modal"
  >
    <template v-if="props.title || $slots.title">
      <div
        class="rc-modal-header"
        data-testid="rc-modal-header"
      >
        <h3
          :id="resolvedTitleId"
          ref="titleEl"
          class="rc-modal-title"
          data-testid="rc-modal-title"
        >
          <slot name="title">
            {{ props.title }}
          </slot>
        </h3>
      </div>
      <RcSeparator />
    </template>

    <div
      ref="bodyEl"
      class="rc-modal-body"
      data-testid="rc-modal-body"
      :tabindex="scrollable ? 0 : undefined"
    >
      <div ref="contentEl">
        <slot />
      </div>
    </div>

    <template v-if="$slots.actions">
      <RcSeparator />
      <div
        class="rc-modal-actions"
        data-testid="rc-modal-actions"
      >
        <slot name="actions" />
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.rc-modal {
  display: flex;
  flex-direction: column;
  // As a flex item of the modal container, this has to be allowed to shrink
  // below its content height or the body can never become the scroller.
  min-height: 0;
  max-height: 100%;
  color: var(--body-text);

  hr {
    margin: 0;
    flex: 0 0 auto;
  }
}

.rc-modal-header,
.rc-modal-actions {
  flex: 0 0 auto;
  padding: var(--gap-md) var(--gap-lg);
}

.rc-modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
}

.rc-modal-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: var(--gap-lg);

  // Inset, because an outline on the scroller would otherwise sit under the
  // rules above and below it.
  &:focus-visible {
    @include focus-outline;
    outline-offset: -2px;
  }
}

.rc-modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}
</style>
