<script setup lang="ts">
import { WORKLOAD_TYPES } from '@shell/config/types';
import { useFetchResource } from '@shell/composables/useFetchResource';
import { usePaginatedResourceArray } from '@shell/composables/usePaginatedResourceArray';
import BasicArrayTable from '@shell/components/BasicArrayTable.vue';
import { STEVE_NAME_COL, STEVE_NAMESPACE_COL, STEVE_AGE_COL } from '@shell/config/pagination-table-headers';
import type { TableColumn } from '@shell/types/store/type-map';

const RESOURCE_TYPE = WORKLOAD_TYPES.DEPLOYMENT;

const LABELS_COL: TableColumn = {
  name:  'labels',
  label: 'Labels',
  value: (row: any) => {
    const labels = row.metadata?.labels;

    if (!labels || !Object.keys(labels).length) {
      return '';
    }

    return Object.entries(labels).map(([k, v]) => `${ k }=${ v }`).join(', ');
  },
};

// Matches explorer.js line 389:
// [STEVE_STATE_COL, STEVE_NAME_COL, STEVE_NAMESPACE_COL, createSteveWorkloadImageCol(6),
//  STEVE_WORKLOAD_ENDPOINTS, 'Ready', 'Up-to-date', 'Available', STEVE_AGE_COL]
// plus Labels
const headers: TableColumn[] = [
  STEVE_NAME_COL,
  STEVE_NAMESPACE_COL,
  // 'Ready', 'Up-to-date', 'Available' resolve from schema metadata.fields at positions 1-3
  {
    name: 'ready', label: 'Ready', value: 'metadata.fields.1', sort: 'metadata.fields.1'
  },
  {
    name: 'up-to-date', label: 'Up-to-date', value: 'metadata.fields.2', sort: 'metadata.fields.2'
  },
  {
    name: 'available', label: 'Available', value: 'metadata.fields.3', sort: 'metadata.fields.3'
  },
  LABELS_COL,
  STEVE_AGE_COL,
];

const { fetchResource } = useFetchResource();
const deployments = fetchResource(RESOURCE_TYPE, { pageSize: 25, watch: true });
const tableBindings = usePaginatedResourceArray(deployments, { searchFields: ['metadata.name', 'metadata.namespace'] });
</script>

<template>
  <div>
    <BasicArrayTable
      :headers="headers"
      v-bind="tableBindings"
      key-field="metadata.uid"
    />
  </div>
</template>
