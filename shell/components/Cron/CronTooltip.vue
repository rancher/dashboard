<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

export interface TooltipItem { value?: string; descKey?: string }
export interface TooltipSection { type: 'rules' | 'explanation'; items: TooltipItem[] }

const props = defineProps<{ sections: TooltipSection[] }>();

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
        <span v-if="item.value">{{ item.value }}</span>
        {{ item.text }}
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
$value-width: 23px;

.cron-tooltip-content-wrapper {
  display: flex;
  flex-direction: column;

  .cron-tooltip-section {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;

    &.cron-tooltip-rules {
      gap: 12px;
    }

    &.cron-tooltip-explanation {
      margin-top: 20px;
    }

    li {
      color: var(--input-label);

      span {
        display: inline-block;
        width: $value-width;
        color: var(--body-text);
        margin-right: 9px;
      }
    }
  }
}
</style>
