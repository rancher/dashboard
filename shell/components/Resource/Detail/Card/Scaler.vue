<script setup lang="ts">
import { useI18n } from '@shell/composables/useI18n';
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
</script>

<template>
  <div
    class="scaler"
    data-testid="scaler"
  >
    <button
      class="decrease"
      :aria-label="i18n.t('component.resource.detail.card.scaler.ariaLabel.decrease', {resourceName: props.ariaResourceName})"
      :disabled="!!props.min && (props.value <= props.min)"
      data-testid="scaler-decrease"
      @click="() => emit('decrease', props.value - 1)"
    >
      <i class="icon icon-sm icon-minus" />
    </button>
    <div
      class="value"
      data-testid="scaler-value"
    >
      {{ props.value }}
    </div>
    <button
      class="increase"
      :aria-label="i18n.t('component.resource.detail.card.scaler.ariaLabel.increase', {resourceName: props.ariaResourceName})"
      :disabled="!!props.max && (props.value >= props.max)"
      data-testid="scaler-increase"
      @click="() => emit('increase', props.value + 1)"
    >
      <i class="icon icon-sm icon-plus" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.scaler {
  display: inline-flex;
  align-items: center;
  background-color: hsl(from var(--primary) h s calc(l + 30));
  border-radius: var(--border-radius-md);
  border: 1px solid var(--primary);
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
      background-color: hsl(from var(--primary) h s calc(l + 20));
    }

    &[disabled] {
      cursor: not-allowed;
      background: var(--disabled-bg);
      color: var(--disabled-text);
    }
  }

  .value {
    color: initial;
    cursor: default;
    padding: 4px;
    padding-top: 5px;
  }
}
</style>
