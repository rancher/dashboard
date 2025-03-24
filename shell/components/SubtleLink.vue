<script setup lang="ts">
import { RouterLink, RouteLocationRaw } from 'vue-router';

export interface Props {
  to: RouteLocationRaw;
}

const { to } = defineProps<Props>();
</script>

<template>
  <RouterLink
    class="subtle-link"
    :to="to"
  >
    <slot name="default" />
  </RouterLink>
</template>

<style lang="scss" scoped>
.subtle-link {
    text-decoration: underline;
    color: var(--body-text);
}
</style>
