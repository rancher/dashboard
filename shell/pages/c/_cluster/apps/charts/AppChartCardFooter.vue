<script setup lang="ts">
import { RcItemCardAction } from '@components/RcItemCard';
import { RcButton } from '@components/RcButton';

interface FooterItem {
  icon?: string;
  iconTooltip?: Record<{key?: string, text?: string}>;
  labels: string[];
  labelTooltip?: string;
  type?: string;
}

const emit = defineEmits<{(e: 'click:item', type: string, label: string): void; }>();

defineProps<{
  items: FooterItem[];
  clickable?: boolean;
}>();

function onClickItem(type: string, label: string) {
  emit('click:item', type, label);
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
      <template
        v-for="(label, j) in footerItem.labels"
        :key="j"
      >
        <rc-item-card-action
          v-if="clickable && footerItem.type"
          class="app-chart-card-footer-item-text"
        >
          <rc-button
            v-clean-tooltip="footerItem.labelTooltip"
            variant="ghost"
            class="app-chart-card-footer-button secondary-text-link"
            data-testid="app-chart-card-footer-item-text"
            :aria-label="t('catalog.charts.appChartCard.footerItem.ariaLabel', { filter: label })"
            @click="onClickItem(footerItem.type, label)"
          >
            <template
              v-if="footerItem.icon"
              #before
            >
              <i
                v-clean-tooltip="t(footerItem.iconTooltip?.key)"
                :class="['icon', 'app-chart-card-footer-item-icon', footerItem.icon]"
              />
            </template>
            {{ label }}
            <span v-if="footerItem.labels.length > 1 && j !== footerItem.labels.length - 1">, </span>
          </rc-button>
        </rc-item-card-action>
        <span
          v-else
          v-clean-tooltip="footerItem.labelTooltip"
          class="app-chart-card-footer-item-text"
          data-testid="app-chart-card-footer-item-text"
        >
          {{ label }}
          <span v-if="footerItem.labels.length > 1 && j !== footerItem.labels.length - 1">, </span>
        </span>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-chart-card-footer {
  display: flex;
  flex-wrap: wrap;

  &-item {
    display: flex;
    align-items: center;
    color: var(--link-text-secondary);
    margin-top: 8px;
    margin-right: 8px;

    &-text {
      margin-right: 8px;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      word-break: break-all;
    }

    &-icon {
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
