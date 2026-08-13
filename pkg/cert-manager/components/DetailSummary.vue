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

const props = defineProps<{ items: SummaryItem[] }>();

const visible = computed(() => props.items.filter((item) => !item.hideIfEmpty || item.value));
</script>

<template>
  <div class="cert-manager-summary">
    <div
      v-for="item in visible"
      :key="item.label"
      class="item"
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
  // An auto-fitting grid rather than fixed span-N columns, which overflow the page horizontally
  // once there are more items than fit a 12 column row.
  display: grid;
  gap: 20px;
  // Bounded tracks packed from the left. `1fr` would stretch a handful of items across the whole
  // page, and fixed span-N columns overflow it horizontally once there are more than four.
  grid-template-columns: repeat(auto-fill, minmax(220px, 300px));
  justify-content: start;
  margin-bottom: 20px;

  h3 {
    font-size: 14px;
    margin-bottom: 0;
    opacity: 0.7;
  }
}
</style>
