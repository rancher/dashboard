<script setup lang="ts">
import { useI18n } from '@shell/composables/useI18n';
import { computed } from 'vue';
import { useStore } from 'vuex';

export interface Props {
  ariaResourceName: string;
  value?: number;
  min?: number;
  max?: number;
}

const props = withDefaults(defineProps<Props>(), {
  value: 0, min: undefined, max: undefined
});
const emit = defineEmits(['decrease', 'increase']);

const store = useStore();
const i18n = useI18n(store);

// The only reason to refuse a click is a bound. Nothing here waits on a request: the value is
// owned by the caller, which moves it as soon as the event is emitted.
const decreaseDisabled = computed(() => props.min !== undefined && props.min !== null && props.value <= props.min);
const increaseDisabled = computed(() => props.max !== undefined && props.max !== null && props.value >= props.max);

// `aria-disabled` rather than the `disabled` attribute: a disabled button leaves the tab order, so
// a keyboard or screen reader user who holds `-` down to zero has focus dropped to the body at the
// moment they reach the bound. These stay focusable and refuse the click instead.
const onDecrease = () => {
  if (decreaseDisabled.value) {
    return;
  }

  emit('decrease', props.value - 1);
};

const onIncrease = () => {
  if (increaseDisabled.value) {
    return;
  }

  emit('increase', props.value + 1);
};
</script>

<template>
  <div
    class="scaler"
    data-testid="scaler"
  >
    <button
      class="decrease"
      :aria-label="i18n.t('component.resource.detail.card.scaler.ariaLabel.decrease', {resourceName: props.ariaResourceName})"
      :aria-disabled="decreaseDisabled"
      data-testid="scaler-decrease"
      @click="onDecrease"
    >
      <i class="icon icon-sm icon-minus" />
    </button>
    <div
      class="value"
      role="status"
      aria-live="polite"
      data-testid="scaler-value"
    >
      {{ props.value }}
    </div>
    <button
      class="increase"
      :aria-label="i18n.t('component.resource.detail.card.scaler.ariaLabel.increase', {resourceName: props.ariaResourceName})"
      :aria-disabled="increaseDisabled"
      data-testid="scaler-increase"
      @click="onIncrease"
    >
      <i class="icon icon-sm icon-plus" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.scaler {
  display: inline-flex;
  align-items: center;
  background-color: var(--accent-btn);
  border-radius: var(--border-radius-md);
  border: solid thin var(--primary);
  overflow: hidden;

  button {
    all: initial;
    cursor: pointer;
    background: none;
    height: 100%;
    width: 32px;
    height: 32px;

    text-align: center;
    font-size: 20px;
    font-weight: bold;
    color: var(--primary);

    i.icon {
      font-size: 0.6em;
    }

    &:hover {
      background-color: var(--accent-btn);
    }

    // `all: initial` above resets `outline-style` to none, and these buttons are always in the tab
    // order (they take `aria-disabled`, never the native attribute), so the ring has to be put
    // back. The negative offset keeps it inside the rocker, which clips with `overflow: hidden`.
    &:focus-visible {
      @include focus-outline;
      outline-offset: -2px;
    }

    &[aria-disabled='true'] {
      cursor: not-allowed;
      background: var(--disabled-bg);
      color: var(--disabled-text);
    }
  }

  .value {
    color: var(--body-text);
    cursor: default;
    padding: 4px;
    padding-top: 5px;
  }
}
</style>
