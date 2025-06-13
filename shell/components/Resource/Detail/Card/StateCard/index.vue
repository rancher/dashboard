<script lang="ts">
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import ResourceRow, { Props as ResourceRowProps } from '@shell/components/Resource/Detail/ResourceRow.vue';

export interface Props {
  title: string;
  rows: ResourceRowProps[];
}
</script>

<script setup lang="ts">
const { title, rows } = defineProps<Props>();
</script>

<template>
  <Card :title="title">
    <div class="resource-rows">
      <ResourceRow
        v-for="(row, i) in rows"
        :key="i"
        :label="row.label"
        :color="row.color"
        :to="row.to"
        :counts="row.counts"
      />
    </div>
  </Card>
</template>

<style lang="scss" scoped>
.resource-rows {
    display: flex;
    flex-direction: column;

    & > *:not(:first-of-type) {
        margin-top: 4px;
    }
}
</style>
