<script lang="ts">
import SpacedRow from '@shell/components/Resource/Detail/SpacedRow.vue';
import { computed } from 'vue';

export interface Props {
  resource: any;
}
</script>

<script setup lang="ts">
const { resource } = defineProps<Props>();
const cards = computed(() => resource?.cards?.filter((c: any) => c) || []);
</script>

<template>
  <SpacedRow v-if="cards.length > 0">
    <component
      :is="card.component"
      v-for="(card, i) in cards"
      :key="i"
      v-bind="card.props"
    />
  </SpacedRow>
</template>
