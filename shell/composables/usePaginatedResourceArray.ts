import { computed, ref, type ComputedRef, type Ref } from 'vue';
import type { PaginatedResourceArray } from '@shell/resources/PaginatedResourceArray';
import type { SortState } from '@shell/components/BasicArrayTable.vue';
import {
  PaginationParamFilter,
  PaginationFilterField,
  PaginationFilterEquality,
  type PaginationSort,
} from '@shell/types/store/pagination.types';

export interface BasicArrayTableBindings {
  rows: any[];
  loading: boolean;
  totalRows: number;
  rowsPerPage: number;
  currentPage: number;
  searchQuery: string;
  sortBy: SortState | null;
  onNextPage: () => Promise<void>;
  onPreviousPage: () => Promise<void>;
  onSearch: (query: string) => void;
  onSort: (sort: SortState) => void;
}

interface UsePaginatedResourceArrayOptions {
  searchFields?: string[];
}

export function usePaginatedResourceArray(
  paginatedResourceArray: PaginatedResourceArray,
  options?: UsePaginatedResourceArrayOptions,
): ComputedRef<BasicArrayTableBindings> {
  const searchQuery: Ref<string> = ref('');
  const sortBy: Ref<SortState | null> = ref(null);
  const searchFields = options?.searchFields ?? ['metadata.name'];

  function applyFilter(): void {
    const filters: PaginationParamFilter[] = [];

    if (searchQuery.value) {
      const searchFilter = new PaginationParamFilter({
        fields: searchFields.map((field) => new PaginationFilterField({
          field,
          value:    searchQuery.value,
          equality: PaginationFilterEquality.CONTAINS,
        })),
      });

      filters.push(searchFilter);
    }

    const sort: PaginationSort[] = [];

    if (sortBy.value) {
      sort.push({ field: sortBy.value.field, asc: sortBy.value.asc });
    }

    paginatedResourceArray.updateFilter({ filters, sort });
  }

  async function onNextPage(): Promise<void> {
    await paginatedResourceArray.nextPage();
  }

  async function onPreviousPage(): Promise<void> {
    await paginatedResourceArray.prevPage();
  }

  function onSearch(query: string): void {
    searchQuery.value = query;
    applyFilter();
  }

  function onSort(sort: SortState): void {
    sortBy.value = sort;
    applyFilter();
  }

  return computed((): BasicArrayTableBindings => ({
    rows:        paginatedResourceArray.page,
    loading:     paginatedResourceArray.loading,
    totalRows:   paginatedResourceArray.totalLength,
    rowsPerPage: paginatedResourceArray.pageSize,
    currentPage: paginatedResourceArray.currentPage,
    searchQuery: searchQuery.value,
    sortBy:      sortBy.value,
    onNextPage,
    onPreviousPage,
    onSearch,
    onSort,
  }));
}
