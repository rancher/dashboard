<script lang="ts">
import ResourceTable from '@shell/components/ResourceTable.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';

export interface TableHeadersWithHeaders {
  headers: any[];
  schema?: never;
}

export interface TableHeadersWithSchema {
  headers?: never;
  schema: any;
}

export interface Props {
  name: string;
  tableHeaders: TableHeadersWithHeaders | TableHeadersWithSchema;
  rows?: any[];
  tabWeight?: number;
  tableProps?: object;
}
</script>

<script lang="ts" setup>
const props = defineProps<Props>();
</script>

<template>
  <Tab
    :name="`${props.name} (${props.rows?.length})`"
    :weight="props.tabWeight"
  >
    <ResourceTable
      v-if="props.rows"
      v-bind="props.tableProps"
      :headers="props.tableHeaders.headers"
      :schema="props.tableHeaders.schema"
      :rows="props.rows"
    />
  </Tab>
</template>
