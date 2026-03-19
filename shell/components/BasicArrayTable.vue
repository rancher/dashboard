<script setup lang="ts">
import { computed, ref } from 'vue';
import type { TableColumn } from '@shell/types/store/type-map';

export interface SortState {
  field: string;
  asc: boolean;
}

const props = withDefaults(defineProps<{
  headers: TableColumn[];
  rows: any[];
  keyField?: string;
  loading?: boolean;
  totalRows?: number;
  rowsPerPage?: number;
  currentPage?: number;
  searchQuery?: string;
  sortBy?: SortState | null;
}>(), {
  headers:     () => [],
  rows:        () => [],
  keyField:    'id',
  loading:     false,
  totalRows:   0,
  rowsPerPage: 10,
  currentPage: 1,
  searchQuery: '',
  sortBy:      null,
});

const emit = defineEmits(['next-page', 'previous-page', 'search', 'sort']);

const localSearch = ref(props.searchQuery);

const totalPages = computed((): number => {
  const size = props.rowsPerPage || 1;

  return Math.ceil(props.totalRows / size);
});

const hasPreviousPage = computed((): boolean => props.currentPage > 1);
const hasNextPage = computed((): boolean => props.currentPage < totalPages.value);

function getNestedValue(object: Record<string, any>, path: string): any {
  return path.split('.').reduce((accumulator, key) => accumulator?.[key], object);
}

function cellValue(row: Record<string, any>, header: TableColumn): any {
  if (typeof header.value === 'function') {
    return header.value(row);
  }

  if (typeof header.value === 'string') {
    return getNestedValue(row, header.value);
  }

  return '';
}

function onSearchInput(): void {
  emit('search', localSearch.value);
}

function isSortable(header: TableColumn): boolean {
  return !!header.sort;
}

function sortDirection(header: TableColumn): string {
  if (!props.sortBy || !header.sort) {
    return '';
  }

  const sortField = Array.isArray(header.sort) ? header.sort[0] : header.sort;

  if (props.sortBy.field !== sortField) {
    return '';
  }

  return props.sortBy.asc ? 'asc' : 'desc';
}

function onHeaderClick(header: TableColumn): void {
  if (!isSortable(header)) {
    return;
  }

  const sortField = Array.isArray(header.sort) ? header.sort[0] : header.sort;
  const currentDirection = sortDirection(header);
  const asc = currentDirection !== 'asc';

  emit('sort', { field: sortField, asc });
}
</script>

<template>
  <div class="basic-array-table">
    <div class="toolbar">
      <input
        v-model="localSearch"
        type="text"
        class="search-input"
        placeholder="Search..."
        @keyup.enter="onSearchInput"
        @change="onSearchInput"
      >
    </div>

    <div
      v-if="loading"
      class="loading"
    >
      Loading...
    </div>

    <table>
      <thead>
        <tr>
          <th
            v-for="header in headers"
            :key="header.name"
            :style="header.width ? { width: header.width + 'px' } : {}"
            :class="{ sortable: isSortable(header), sorted: !!sortDirection(header) }"
            @click="onHeaderClick(header)"
          >
            {{ header.label || header.name }}
            <span
              v-if="sortDirection(header)"
              class="sort-indicator"
            >
              {{ sortDirection(header) === 'asc' ? '&#9650;' : '&#9660;' }}
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row[keyField] || row.id || row.metadata?.uid"
        >
          <td
            v-for="header in headers"
            :key="header.name"
          >
            {{ cellValue(row, header) }}
          </td>
        </tr>
        <tr v-if="!loading && rows.length === 0">
          <td
            :colspan="headers.length"
            class="text-center text-muted"
          >
            No rows
          </td>
        </tr>
      </tbody>
    </table>

    <div class="paging">
      <button
        :disabled="loading || !hasPreviousPage"
        class="btn btn-sm role-secondary"
        @click="emit('previous-page')"
      >
        &laquo; Prev
      </button>
      <span class="page-info">
        Page {{ currentPage }} of {{ totalPages }} &middot; {{ totalRows }} total
      </span>
      <button
        :disabled="loading || !hasNextPage"
        class="btn btn-sm role-secondary"
        @click="emit('next-page')"
      >
        Next &raquo;
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.basic-array-table {
  position: relative;

  .toolbar {
    display: flex;
    justify-content: flex-end;
    padding: 0 0 10px;

    .search-input {
      padding: 6px 10px;
      border: 1px solid var(--border);
      border-radius: var(--border-radius);
      background: var(--input-bg);
      color: var(--input-text);
      min-width: 250px;

      &::placeholder {
        color: var(--muted);
      }
    }
  }

  .loading {
    padding: 10px 0;
    font-style: italic;
    color: var(--muted);
  }

  table {
    width: 100%;
    border-collapse: collapse;

    th, td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }

    th {
      font-weight: 600;
      background: var(--sortable-table-header-bg);
      user-select: none;

      &.sortable {
        cursor: pointer;

        &:hover {
          background: var(--sortable-table-row-bg);
        }
      }

      .sort-indicator {
        font-size: 10px;
        margin-left: 4px;
      }
    }
  }

  .paging {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    padding: 10px 0;

    .page-info {
      color: var(--muted);
      font-size: 13px;
    }
  }
}
</style>
