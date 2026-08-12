<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

export interface SummaryItem {
  label: string;
  value?: string | number | null;
  /** Render the value as an internal link. */
  to?: RouteLocationRaw | null;
  /** Render the value as an external link. */
  href?: string | null;
  /** Drop the item entirely rather than showing a dash. */
  hideIfEmpty?: boolean;
}

const props = withDefaults(defineProps<{ items: SummaryItem[]; span?: number }>(), { span: 3 });

const visible = computed(() => props.items.filter((item) => !item.hideIfEmpty || item.value));
</script>

<template>
  <div class="row cert-manager-summary">
    <div
      v-for="item in visible"
      :key="item.label"
      class="col"
      :class="`span-${ span }`"
    >
      <h3>{{ item.label }}</h3>
      <router-link
        v-if="item.to && item.value"
        :to="item.to"
      >
        {{ item.value }}
      </router-link>
      <a
        v-else-if="item.href && item.value"
        :href="item.href"
        target="_blank"
        rel="noopener noreferrer nofollow"
      >{{ item.value }}</a>
      <span v-else-if="item.value || item.value === 0">{{ item.value }}</span>
      <span
        v-else
        class="text-muted"
      >&mdash;</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cert-manager-summary {
  margin-bottom: 20px;

  h3 {
    font-size: 14px;
    margin-bottom: 0;
    opacity: 0.7;
  }
}
</style>
