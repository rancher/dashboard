<script setup lang="ts">
import { reactive } from 'vue';
import { RcItemCardAction } from '@components/RcItemCard';
import { RcButton } from '@components/RcButton';
import { isTruncated } from '@shell/utils/style';

interface FooterItem {
  icon?: string;
  iconTooltip?: { key?: string; text?: string };
  labels: string[];
  labelTooltip?: string;
  type?: string;
}

const emit = defineEmits<{(e: 'click:item', type: string, label: string): void }>();

defineProps<{
  items: FooterItem[];
  clickable?: boolean;
}>();

const tooltipOverrides = reactive<Record<string, string | undefined>>({});
const labelElements: Record<string, HTMLElement | null> = {};

function onClickItem(type: string, label: string): void {
  emit('click:item', type, label);
}

/**
 * Creates a unique key for identifying a label element.
 * @param itemIndex - Index of the footer item
 * @param labelIndex - Index of the label within the footer item
 */
function createLabelKey(itemIndex: number, labelIndex: number): string {
  return `${ itemIndex }-${ labelIndex }`;
}

/**
 * Registers a label element reference for truncation detection.
 * @param key - Unique identifier for the label
 * @param el - The HTML element or null
 */
function registerLabelRef(key: string, el: HTMLElement | null): void {
  labelElements[key] = el;
}

/**
 * Updates the tooltip content based on whether the label text is truncated.
 * If truncated, prepends the full label text to the base tooltip.
 * @param key - Unique identifier for the label
 * @param label - The label text content
 * @param baseTooltip - The original tooltip content
 */
function updateTooltipOnHover(key: string, label: string, baseTooltip?: string): void {
  if (!baseTooltip) {
    tooltipOverrides[key] = undefined;

    return;
  }

  const element = labelElements[key];

  tooltipOverrides[key] = isTruncated(element) ? `${ label }. ${ baseTooltip }` : baseTooltip;
}

/**
 * Returns the tooltip to display for a given label.
 * @param key - Unique identifier for the label
 * @param fallback - Fallback tooltip if no override exists
 */
function getTooltip(key: string, fallback?: string): string | undefined {
  return tooltipOverrides[key] ?? fallback;
}
</script>

<template>
  <div class="app-chart-card-footer">
    <div
      v-for="(footerItem, i) in items"
      :key="i"
      class="app-chart-card-footer-item"
      data-testid="app-chart-card-footer-item"
    >
      <i
        v-if="footerItem.icon"
        v-clean-tooltip="footerItem.iconTooltip?.key ? t(footerItem.iconTooltip.key) : undefined"
        :class="['icon', 'app-chart-card-footer-item-icon', footerItem.icon]"
      />
      <template
        v-for="(label, j) in footerItem.labels"
        :key="j"
      >
        <rc-item-card-action
          v-if="clickable && footerItem.type"
          class="app-chart-card-footer-item-action"
        >
          <rc-button
            v-clean-tooltip="getTooltip(createLabelKey(i, j), footerItem.labelTooltip)"
            variant="ghost"
            class="app-chart-card-footer-button secondary-text-link"
            data-testid="app-chart-card-footer-item-text"
            :aria-label="t('catalog.charts.appChartCard.footerItem.ariaLabel', { filter: label })"
            @click="onClickItem(footerItem.type, label)"
            @mouseenter="updateTooltipOnHover(createLabelKey(i, j), label, footerItem.labelTooltip)"
          >
            <span
              :ref="(el) => registerLabelRef(createLabelKey(i, j), el as HTMLElement)"
              class="app-chart-card-footer-button-label"
            >{{ label }}</span>
          </rc-button>
          <span
            v-if="footerItem.labels.length > 1 && j !== footerItem.labels.length - 1"
            class="app-chart-card-footer-item-separator"
          >,&nbsp;</span>
        </rc-item-card-action>
        <span
          v-else
          :ref="(el) => registerLabelRef(createLabelKey(i, j), el as HTMLElement)"
          v-clean-tooltip="getTooltip(createLabelKey(i, j), footerItem.labelTooltip)"
          class="app-chart-card-footer-item-text"
          data-testid="app-chart-card-footer-item-text"
          @mouseenter="updateTooltipOnHover(createLabelKey(i, j), label, footerItem.labelTooltip)"
        >
          {{ label }}<span v-if="footerItem.labels.length > 1 && j !== footerItem.labels.length - 1">,&nbsp;</span>
        </span>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-chart-card-footer {
  display: flex;
  flex-wrap: wrap;
  max-width: 100%;

  &-item {
    display: flex;
    align-items: center;
    color: var(--link-text-secondary);
    margin-top: 8px;
    margin-right: 8px;
    min-width: 0;
    max-width: 100%;

    &-action {
      display: flex;
      align-items: center;
      min-width: 0; // Critical for truncation in flex containers
      max-width: 100%;
    }

    &-text {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }

    &-separator {
      flex-shrink: 0;
    }

    &-icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      display: flex;
      font-size: 19px;
      align-items: center;
      justify-content: center;
      margin-right: 8px;
    }
  }

  &-button {
    text-transform: capitalize;
    min-width: 0;
    max-width: 100%;

    &-label {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

button.variant-ghost.app-chart-card-footer-button {
  padding: 0;
  gap: 0;
  min-height: 20px;

  &:focus-visible {
    border-color: var(--primary);
    @include focus-outline;
    outline-offset: -2px;
  }
}
</style>
