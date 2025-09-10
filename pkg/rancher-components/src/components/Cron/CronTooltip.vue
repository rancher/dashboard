<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import type { TooltipSection } from './types';

const props = defineProps<{
  /**
   * Tooltip content sections.
   * Each section has a type (e.g., "rules" or "explanation")
   * and a list of items with optional `value` and i18n `descKey`.
   */
  sections: TooltipSection[]
}>();

const store = useStore();
const { t } = useI18n(store);

const processedSections = computed(() => {
  return props.sections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      text: item.descKey ? t?.(item.descKey) ?? item.descKey : ''
    }))
  }));
});
</script>

<template>
  <div class="cron-tooltip-content-wrapper">
    <ul
      v-for="section in processedSections"
      :key="section.type"
      :class="['cron-tooltip-section', `cron-tooltip-${section.type}`]"
    >
      <li
        v-for="item in section.items"
        :key="item.value || item.descKey || item.text"
      >
        <span class="symbol">{{ item.value || '' }}</span>
        <span class="desc">{{ item.text }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.cron-tooltip-content-wrapper {
  display: flex;
  flex-direction: column;

  .cron-tooltip-section {
    list-style: none;
    padding: 0;
    margin: 0;

     &.cron-tooltip-rules {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 12px;

      li {
        display: contents;
        align-items: center;
      }
    }
    &.cron-tooltip-explanation {
      margin-top: 20px;
      display: grid;
      gap: 8px;
    }

    li {
      white-space: nowrap;

      .symbol {
        color: var(--body-text);
      }

      .desc {
        color: var(--input-label);
      }
    }
  }
}
</style>
