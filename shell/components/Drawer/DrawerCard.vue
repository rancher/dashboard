<script setup lang="ts">
/**
 * @deprecated Use `RcDrawerCard` from `@components/RcDrawer`, which this is now
 * built on. Kept for extensions that still import it.
 */
import { RcDrawerCard } from '@components/RcDrawer';
</script>

<template>
  <RcDrawerCard>
    <slot />
  </RcDrawerCard>
</template>
