<script setup lang="ts">
import type { PropType } from 'vue';
import LazyImage from '@shell/components/LazyImage';
import AppChartCardSubHeader from '@shell/pages/c/_cluster/apps/charts/AppChartCardSubHeader';

interface SubHeaderItem {
  icon: string;
  iconTooltip?: Record<string, string>;
  label: string;
  labelTooltip?: string;
}

defineProps({
  icon: {
    type:    String,
    default: '',
  },
  chartName: {
    type:    String,
    default: '',
  },
  subHeaderItems: {
    type:    Array as PropType<SubHeaderItem[]>,
    default: () => [],
  },
  description: {
    type:    String,
    default: '',
  },
});
</script>

<template>
  <div class="chart-header">
    <div class="logo-container">
      <div class="logo-box">
        <LazyImage
          :src="icon"
          class="logo"
          :alt="chartName"
        />
      </div>
    </div>
    <div class="header-body">
      <div class="header-top">
        <h1 class="title">
          <slot name="back-link" />
          {{ chartName }}
        </h1>
      </div>
      <AppChartCardSubHeader :items="subHeaderItems" />
      <p
        v-if="description"
        class="description"
      >
        {{ description }}
      </p>
    </div>
    <div class="header-action">
      <slot name="action" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
$logo-box-width: 60px;

.chart-header {
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: var(--gap-lg);

  .logo-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;

    .logo-box {
      width: $logo-box-width;
      height: $logo-box-width;
      display: flex;
      justify-content: center;
      align-items: center;
      background: var(--rc-image-bg);
      border-radius: var(--border-radius);

      .logo {
        width: 48px;
        height: 48px;
        object-fit: contain;
      }
    }
  }

  .header-body {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--gap);

    .header-top {
      display: flex;

      .title {
        margin: 0 12px 0 0;
      }
    }

    .description {
      line-height: 21px;
    }
  }

  .header-action {
    margin-left: auto;
    flex-shrink: 0;
  }
}
</style>
