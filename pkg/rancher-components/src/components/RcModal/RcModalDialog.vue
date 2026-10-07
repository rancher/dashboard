<script setup lang="ts">
import {
  computed, onBeforeUnmount, onMounted, ref, useSlots
} from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { DEFAULT_FOCUS_TRAP_OPTS, getFirstFocusableElement, useBasicSetupFocusTrap } from '@shell/composables/focusTrap';
import { generateRandomAlphaString } from '@shell/utils/string';
import RcButton from '@components/RcButton/RcButton.vue';
import { RcHeading } from '@components/RcHeading';
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

const overlay = ref<HTMLElement | null>(null);
const dialog = ref<HTMLElement | null>(null);
const body = ref<HTMLElement | null>(null);
const actions = ref<HTMLElement | null>(null);

const bodyScrolls = ref(false);

const measureBody = () => {
  bodyScrolls.value = !!body.value && body.value.scrollHeight > body.value.clientHeight;
};

const bodyIsNamedRegion = computed(() => bodyScrolls.value && hasTitle.value);

function firstControlIn(region: HTMLElement | null): HTMLElement | null {
  const first = region && getFirstFocusableElement(region);

  return first && first !== document.body ? first : null;
}

function autofocusTarget(): HTMLElement | null {
  const marked = dialog.value?.querySelector<HTMLElement>('[autofocus]');

  if (!marked) {
    return null;
  }

  return marked.tabIndex >= 0 || marked.hasAttribute('tabindex') ? marked : firstControlIn(marked);
}

function initialFocus(): HTMLElement {
  return (autofocusTarget() || firstControlIn(body.value) || (bodyScrolls.value ? body.value : null) || firstControlIn(actions.value) || body.value || dialog.value) as HTMLElement;
}

let bodyResize: ResizeObserver | undefined;

onMounted(() => {
  emit('open');

  measureBody();

  if (body.value && typeof ResizeObserver !== 'undefined') {
    bodyResize = new ResizeObserver(measureBody);
    bodyResize.observe(body.value);
  }
});

onBeforeUnmount(() => bodyResize?.disconnect());

useBasicSetupFocusTrap(`#${ dialogId }`, {
  ...DEFAULT_FOCUS_TRAP_OPTS,
  escapeDeactivates: false,
  allowOutsideClick: (event: Event) => props.clickToClose || !overlay.value?.contains(event.target as Node),
  fallbackFocus:     `#${ dialogId }`,
  initialFocus,
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
    ref="overlay"
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
        <RcHeading
          v-if="hasTitle"
          :id="titleId"
          :size="3"
          class="title"
          data-testid="rc-modal-title"
        >
          <slot name="title">
            {{ title }}
          </slot>
        </RcHeading>
        <div
          ref="body"
          class="body"
          :tabindex="bodyScrolls ? 0 : undefined"
          :role="bodyIsNamedRegion ? 'region' : undefined"
          :aria-labelledby="bodyIsNamedRegion ? titleId : undefined"
          data-testid="rc-modal-body"
        >
          <slot />
        </div>
      </div>
      <div
        v-if="hasActions"
        ref="actions"
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
    line-height: 1.4;
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: 24px;
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    line-height: 1.4;

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
