<script setup lang="ts">
/**
 * The standard chrome for a drawer: a header carrying the title and a close
 * control, a body, and a footer carrying a close button and any actions.
 *
 * RcDrawer is only the chrome. The sliding container, the glass, the width and
 * height presets, the focus trap and the escape/route handling all belong to
 * the slide-in panel, so open a drawer through the shell API and render
 * RcDrawer as the panel's root:
 *
 * ```ts
 * import { useShell } from '@shell/apis';
 *
 * useShell().slideIn.open(MyDrawer, { width: 'wide', height: 'full' });
 * ```
 *
 * ```html
 * <RcDrawer
 *   :title="title"
 *   :loading="loading"
 *   :actions="[{ label: 'Edit Config', action: goToEdit }]"
 * >
 *   <template #body>
 *     <RcDrawerCard>...</RcDrawerCard>
 *   </template>
 * </RcDrawer>
 * ```
 *
 * A panel inside a slide-in needs no close wiring at all: the slide-in provides
 * the way to close, RcDrawer calls it, and a panel that closes itself calls
 * `useDrawerClose()`. A drawer rendered inline instead, with nothing above it
 * to close it, binds the `close` event.
 *
 * `title` is always required: it names the drawer for assistive technology even
 * when the `header` slot replaces the rendered header. Replacing the `header`
 * slot also removes the built-in close control, so a drawer that does that and
 * sets `hideFooter` must provide a close affordance of its own.
 *
 * The `title` slot is rendered inside a heading, so it takes phrasing content
 * only. Put anything larger in the body.
 */
import { computed, useTemplateRef } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import RcButton from '@components/RcButton/RcButton.vue';
import { useDrawerClose } from './composables';
import type { RcDrawerProps } from './types';

const props = withDefaults(defineProps<RcDrawerProps>(), { modal: true, actions: () => [] });
const emit = defineEmits(['close']);

const store = useStore();
const i18n = useI18n(store);

const closeLabel = computed(() => i18n.t('component.drawer.ariaLabel.close', { target: props.title }));

// Whatever is showing this drawer knows how to close it. The event is emitted
// either way, for a consumer that wants to react to the close as well.
const closeDrawer = useDrawerClose();

const close = () => {
  emit('close');
  closeDrawer();
};

// The body is the drawer's scroll container, so consumers whose content
// navigates in place (breadcrumbs, paging) need a way back to the top.
const body = useTemplateRef<HTMLElement>('body');

defineExpose({ scrollToTop: () => body.value?.scrollTo({ top: 0 }) });
</script>

<template>
  <div
    class="rc-drawer"
    role="dialog"
    :aria-modal="modal ? 'true' : 'false'"
    :aria-label="title"
  >
    <div class="rc-drawer__header">
      <slot name="header">
        <h2 class="rc-drawer__title">
          <slot name="title">
            {{ title }}
          </slot>
        </h2>
        <div class="rc-drawer__header-actions">
          <RcButton
            variant="ghost"
            size="small"
            :aria-label="closeLabel"
            data-testid="rc-drawer-close"
            @click="close"
          >
            <i class="rc-drawer__close-icon icon icon-close" />
          </RcButton>
        </div>
      </slot>
    </div>
    <div
      ref="body"
      class="rc-drawer__body"
    >
      <div
        v-if="loading"
        class="rc-drawer__loading"
        role="status"
        data-testid="rc-drawer-loading"
      >
        <i
          class="icon icon-spinner icon-spin"
          aria-hidden="true"
        />
        <span class="rc-drawer__loading-label">{{ i18n.t('component.drawer.loading') }}</span>
      </div>
      <slot
        v-else
        name="body"
      />
    </div>
    <div
      v-if="!hideFooter"
      class="rc-drawer__footer"
    >
      <slot name="footer">
        <div class="rc-drawer__footer-actions">
          <RcButton
            variant="secondary"
            size="large"
            data-testid="rc-drawer-close-button"
            @click="close"
          >
            {{ i18n.t('component.drawer.close') }}
          </RcButton>
          <RcButton
            v-for="(action, i) in actions"
            :key="i"
            :variant="action.variant || 'primary'"
            size="large"
            :aria-label="action.ariaLabel"
            :data-testid="action.testid"
            @click="action.action"
          >
            <i
              v-if="action.icon"
              class="icon"
              :class="action.icon"
              aria-hidden="true"
            />{{ action.label }}
          </RcButton>
        </div>
      </slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.rc-drawer {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;

  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-shrink: 0;
    gap: 8px;
    padding: 16px;

    background-color: var(--body-bg);
    border-bottom: 1px solid var(--border);
    // min-height rather than height so a long title grows the header instead
    // of spilling through the border and over the body.
    min-height: var(--header-height);
  }

  &__title {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: 16px;
    font-weight: normal;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  &__header-actions {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  &__close-icon {
    opacity: 0.5;
    cursor: pointer;

    &:hover {
      opacity: 1;
    }
  }

  &__body {
    background-color: var(--drawer-body-bg);
    flex: 1;
    padding: 16px;
    // Owns the rhythm between stacked cards, so no consumer has to remember a
    // spacing utility - and the shell's utilities are not in the published package.
    display: flex;
    flex-direction: column;
    gap: 16px;
    // `scroll` rather than `auto` so the gutter is always reserved and content
    // does not shift sideways as it crosses the fold.
    overflow-y: scroll;
    overflow-x: auto;
  }

  &__footer {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    flex-shrink: 0;
    padding: 16px;

    background-color: var(--body-bg);
    border-top: 1px solid var(--border);
    height: 72px;
  }

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;

    .icon-spinner {
      font-size: 24px;
    }
  }

  // The shell's .sr-only is not in the published package's build, so the
  // drawer carries its own.
  &__loading-label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  &__footer-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }
}
</style>
