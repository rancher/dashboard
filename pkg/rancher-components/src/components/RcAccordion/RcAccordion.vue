<script setup lang="ts">
import { computed, useId } from 'vue';
import { RcAccordionProps } from './types';
import RcButton from '@components/RcButton/RcButton.vue';
import RcIcon from '@components/RcIcon/RcIcon.vue';

const props = withDefaults(defineProps<RcAccordionProps>(), { variant: 'primary' });

const expanded = defineModel<boolean>({ default: false });

const id = useId();
const panelId = `rc-accordion-panel-${ id }`;
const headerId = `rc-accordion-header-${ id }`;

const toggle = () => {
  expanded.value = !expanded.value;
};

const chevronIcon = computed(() => expanded.value ? 'chevron-down' : 'chevron-right');
</script>

<template>
  <div
    class="rc-accordion"
    :class="[props.variant, { 'rc-accordion-expanded': expanded }]"
  >
    <div
      class="rc-accordion-header"
      @click="toggle"
    >
      <div class="rc-accordion-header-left">
        <RcButton
          class="rc-accordion-toggle-button"
          variant="ghost"
          :aria-expanded="expanded"
          :aria-controls="panelId"
          @click.stop="toggle"
        >
          <RcIcon
            class="rc-accordion-toggle-icon"
            :type="chevronIcon"
            size="small"
          />
        </RcButton>
        <div
          v-if="props.title"
          :id="headerId"
          class="rc-accordion-title"
        >
          {{ props.title }}
        </div>
        <div class="rc-accordion-header-left" @click.stop>
          <slot name="header-left" />
        </div>
      </div>
      <div class="rc-accordion-header-right" @click.stop>
        <slot name="header-right" />
      </div>
    </div>
    <div
      :id="panelId"
      v-show="expanded"
      role="region"
      :aria-labelledby="props.title ? headerId : undefined"
      class="rc-accordion-body"
    >
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.rc-accordion {
  border-radius: var(--border-radius-lg);

  // Primary variant - white background
  &.primary {
    background-color: var(--body-bg);
  }

  // Secondary variant - light gray background (for nested accordions)
  &.secondary {
    background-color: var(--box-bg);
  }

  &-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    cursor: pointer;
    user-select: none;
    padding: 16px;

    button.rc-accordion-toggle-button.btn-medium {
      width: 16px;
      height: 16px;
      min-height: 16px;
      padding: 0;
    }

    .rc-accordion-title {
      font-size: 18px;
      font-style: normal;
      font-weight: 600;
      line-height: 24px;
    }
  }

  &-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  &-header-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  &-toggle-icon {
    flex-shrink: 0;
    color: var(--body-text);
    transition: transform 0.2s ease;
  }

  &-title {
    font-family: 'Lato', sans-serif;
    font-weight: 600;
    font-size: 18px;
    line-height: 24px;
    color: var(--body-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &-body {
    padding: 8px 40px 16px 40px;
  }
}
</style>
