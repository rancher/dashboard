import type { AxiosInstance } from 'axios';
import type { PaginationFilter } from '@shell/types/resources/fetch-resource';
import type { VuexStore } from '@shell/types/store/vuex';
import { get } from '@shell/utils/object';
import { BasePaginationStrategy, type PaginatedResponse } from '@shell/resources/pagination-strategy';

/**
 * Local pagination strategy.
 *
 * Fetches all resources in a single request, then handles
 * filtering, sorting, label selection and pagination in memory.
 */
export class LocalPaginationStrategy<T = any> extends BasePaginationStrategy<T> {
  private allData: Array<T> = [];

  constructor($axios: AxiosInstance, $store: VuexStore, storeName: string, resourceType: string, pageSize: number, filter: PaginationFilter, watch?: boolean) {
    super($axios, $store, storeName, resourceType, pageSize, filter, watch);

    if (process.env.dev) {
      console.info(`[LocalPaginationStrategy] SSP not supported for "${ resourceType }", falling back to local pagination`); // eslint-disable-line no-console
    }
  }

  protected async doLoad(): Promise<void> {
    const url = this.getCollectionUrl();
    const response = await this.$axios.get<PaginatedResponse<T>>(`${ url }?pagesize=100000`);

    this.allData = response.data.data ?? [];
    this.applyLocalPage();
  }

  protected async doPageChange(): Promise<void> {
    this.applyLocalPage();
  }

  protected async doFilterChange(): Promise<void> {
    this.applyLocalPage();
  }

  protected doDispose(): void {
    this.allData = [];
  }

  // ---------------------------------------------------------------------------
  // Local filtering / sorting / paging
  // ---------------------------------------------------------------------------

  private applyLocalPage(): void {
    let data = [...this.allData];

    data = this.applyLabelSelector(data);
    data = this.applyFilters(data);
    data = this.applySort(data);

    this.totalLength = data.length;
    const start = (this.currentPage - 1) * this.pageSize;

    this.page = data.slice(start, start + this.pageSize);
  }

  private applyLabelSelector(data: Array<T>): Array<T> {
    const ls = this.filter.labelSelector;

    if (!ls?.matchLabels) {
      return data;
    }

    const entries = Object.entries(ls.matchLabels);

    return data.filter((item: any) => {
      const labels = get(item, 'metadata.labels') || {};

      return entries.every(([k, v]) => labels[k] === v);
    });
  }

  private applyFilters(data: Array<T>): Array<T> {
    const filters = this.filter.filters;

    if (!filters?.length) {
      return data;
    }

    let result = data;

    for (const f of filters) {
      for (const fieldDef of f.fields) {
        if (fieldDef.field && fieldDef.value !== null && fieldDef.value !== undefined) {
          const searchValue = String(fieldDef.value).toLowerCase();

          result = result.filter((item: any) => {
            const val = get(item, fieldDef.field as string);

            return val !== null && val !== undefined && String(val).toLowerCase().includes(searchValue);
          });
        }
      }
    }

    return result;
  }

  private applySort(data: Array<T>): Array<T> {
    const sorts = this.filter.sort;

    if (!sorts?.length) {
      return data;
    }

    const sorted = [...data];

    sorted.sort((a: any, b: any) => {
      for (const s of sorts) {
        const field = s.field.replace(/^-/, '');
        const asc = s.asc !== false;
        const aVal = get(a, field) ?? '';
        const bVal = get(b, field) ?? '';

        let cmp = 0;

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          cmp = aVal - bVal;
        } else {
          cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' });
        }

        if (cmp !== 0) {
          return asc ? cmp : -cmp;
        }
      }

      return 0;
    });

    return sorted;
  }
}
