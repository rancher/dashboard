<script lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import PercentageBar from '@shell/components/PercentageBar.vue';
import { useI18n } from '@shell/composables/useI18n';
import { formatPercent } from '@shell/utils/string';

export interface Props {
  resource: any;
}

/**
 * An item a model can return from its optional `glanceUsage` getter, shown as a bar below the rows of the card
 */
export interface GlanceUsageItem {
  name: string;
  label: string;
  /**
   * Leave out when the usage isn't known, e.g. there are no metrics
   */
  percentage?: number;
}
</script>

<script setup lang="ts">
const props = defineProps<Props>();
const store = useStore();
const i18n = useI18n(store);

const usage = computed<GlanceUsageItem[]>(() => props.resource.glanceUsage || []);

const hasPercentage = (item: GlanceUsageItem): boolean => typeof item.percentage === 'number' && Number.isFinite(item.percentage);

// The bar is empty when the usage isn't known, and full when usage goes over 100%
const barPercentage = (item: GlanceUsageItem): number => (hasPercentage(item) ? Math.min(Math.max(item.percentage as number, 0), 100) : 0);

const usageDisplay = (item: GlanceUsageItem): string => (hasPercentage(item) ? formatPercent(item.percentage) : i18n.t('generic.na'));

const getGlanceItemValueId = (glanceItem: any): string => `value-${ glanceItem.label }:${ glanceItem.content }`.toLowerCase().replaceAll(' ', '');
</script>

<template>
  <div
    class="resource-popover-card"
    :title="resource.nameDisplay"
  >
    <div>
      <div
        v-for="(glanceItem, i) in props.resource.glance"
        :key="glanceItem.label"
        class="row"
      >
        <label
          class="label text-deemphasized"
          :for="getGlanceItemValueId(glanceItem)"
        >
          {{ glanceItem.label }}
        </label>
        <div
          :id="getGlanceItemValueId(glanceItem)"
          class="value"
        >
          <component
            :is="glanceItem.formatter"
            v-if="glanceItem.formatter"
            v-bind="glanceItem.formatterOpts"
            :id="i === 0 ? 'first-glance-item' : undefined"
            :value="glanceItem.content"
          />
          <span
            v-else
            :id="i === 0 ? 'first-glance-item' : undefined"
          >
            {{ glanceItem.content }}
          </span>
        </div>
      </div>
    </div>
    <div
      v-if="usage.length"
      class="usage"
      data-testid="resource-popover-usage"
    >
      <div
        v-for="item in usage"
        :key="item.name"
        class="usage-item"
        :data-testid="`resource-popover-usage-${ item.name }`"
      >
        <span class="text-deemphasized">{{ item.label }}</span>
        <PercentageBar
          :model-value="barPercentage(item)"
          aria-hidden="true"
        />
        <span class="usage-value">{{ usageDisplay(item) }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.resource-popover-card {
  width: 288px;

  .dropdown-item {
    display: inline-block;
    padding: 0;
    margin: 0;
    border: none;

    &:hover {
      background: none;
    }
  }

  &:deep() {
    .badge-state {
      height: 20px;
      font-size: 12px;
      // Fits the text in the 20px pill. Inside a table cell the pill is clipped, so the row line-height would cut it off
      line-height: 14px;
    }

    .heading {
      height: 24px;

      .title {
        font-size: 16px;
        font-weight: 600;
        line-height: 24px;
      }
    }

    .v-popper, .btn.variant-link.rc-button {
      height: 24px;
      min-height: initial;
      padding: 0;
    }

    .v-popper {
      padding: 0;
    }

    .btn.variant-link.rc-button.variant-ghost {
      color: #141419;
      padding: 0 12px;
      i {
        display: inline-flex;
        justify-content: center;
        font-size: 12px;
        width: 2.5px;
      }

      &:hover {
        background-color: transparent
      }
    }
  }

  .row {
    display: flex;
    flex-direction: row;
    line-height: 21px;

    &:not(:first-of-type) {
      margin-top: 4px;
    }

    // Keep the values lined up when a long value, e.g. a node's OS, wraps
    .label {
      width: 50%;
      flex-shrink: 0;
    }

    .value {
      min-width: 0;
      overflow-wrap: anywhere;
    }
  }

  .usage {
    display: grid;
    grid-auto-columns: 1fr;
    grid-auto-flow: column;
    gap: 16px;
    margin-top: 16px;
    line-height: 21px;

    .usage-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
    }

    // A thin bar, rather than the thick one used in tables
    :deep(.bar) {
      height: 4px;
      border-radius: 2px;
    }
  }
}
</style>
