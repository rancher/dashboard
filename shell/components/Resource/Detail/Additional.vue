<script lang="ts">
import { computed } from 'vue';

export interface Props {
  items: string[];
}
</script>

<script setup lang="ts">

const { items } = defineProps<Props>();

const first = computed(() => items[0]);
const tooltipValue = computed(() => {
  let rows = '';

  items.forEach((item) => {
    rows += `&#8226; ${ item }<br>`;
  });

  return rows;
});
</script>

<template>
  <div class="additional">
    <div class="initial">
      {{ first }}
    </div>
    <div
      v-if="items.length > 1"
      v-clean-tooltip.bottom="tooltipValue"
      class="more text-muted"
    >
      {{ t('generic.plusMore', {n: items.length-1}) }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.more {
  margin-top: 4px;
  cursor: help;
  font-size: 0.8em;
}
</style>
