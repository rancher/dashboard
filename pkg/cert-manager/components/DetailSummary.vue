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
      <p class="text-muted">
        {{ item.label }}
      </p>
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
  display: flex;
  gap: var(--gap-md);
  margin-bottom: 16px;

  .item p {
    margin-bottom: 8px;
  }
}
</style>
