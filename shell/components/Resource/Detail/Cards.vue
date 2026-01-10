<script lang="ts">
import SpacedRow from '@shell/components/Resource/Detail/SpacedRow.vue';
import ExtrasCard from '@shell/components/Resource/Detail/Card/ExtrasCard.vue';
import { computed } from 'vue';

export interface Props {
  resource: any;
}
</script>

<script setup lang="ts">
const { resource } = defineProps<Props>();
const cards = computed(() => resource?.cards?.filter((c: any) => c) || []);
const showExtrasCard = computed(() => cards.value.length >= 1 && cards.value.length < 3);
</script>

<template>
  <SpacedRow v-if="cards.length > 0">
    <component
      :is="card.component"
      v-for="(card, i) in cards"
      :key="i"
      v-bind="card.props"
    />
    <ExtrasCard v-if="showExtrasCard" />
  </SpacedRow>
</template>
