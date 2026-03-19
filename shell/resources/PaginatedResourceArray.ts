import { reactive } from 'vue';
import type { AxiosInstance } from 'axios';
import type { FetchResourceOptions, PaginationFilter } from '@shell/types/resources/fetch-resource';
import type { VuexStore } from '@shell/types/store/vuex';
import { BasePaginationStrategy } from '@shell/resources/pagination-strategy';
import { SspPaginationStrategy } from '@shell/resources/pagination-ssp';
import { LocalPaginationStrategy } from '@shell/resources/pagination-local';

/**
 * Thin wrapper that picks the right pagination strategy (SSP vs local).
 *
 * All pagination state, watch lifecycle and disposal lives in the strategy,
 * which is wrapped in reactive() so Vue can track property changes.
 */
export class PaginatedResourceArray<T = any> {
  readonly strategy: BasePaginationStrategy<T>;

  constructor(
    $axios: AxiosInstance,
    $store: VuexStore,
    storeName: string,
    resourceType: string,
    paginationFilter?: PaginationFilter,
    options?: FetchResourceOptions,
  ) {
    const pageSize = options?.pageSize ?? 10;
    const filter = paginationFilter ?? {};
    const watch = options?.watch;
    const ssp = PaginatedResourceArray.checkSspEnabled($store, storeName, resourceType);

    const raw = ssp ? new SspPaginationStrategy<T>($axios, $store, storeName, resourceType, pageSize, filter, watch) : new LocalPaginationStrategy<T>($axios, $store, storeName, resourceType, pageSize, filter, watch);

    this.strategy = reactive(raw) as BasePaginationStrategy<T>;
  }

  get page(): Array<T> {
    return this.strategy.page;
  }

  get totalLength(): number {
    return this.strategy.totalLength;
  }

  get pageSize(): number {
    return this.strategy.pageSize;
  }

  get currentPage(): number {
    return this.strategy.currentPage;
  }

  get loading(): boolean {
    return this.strategy.loading;
  }

  load(): Promise<void> {
    return this.strategy.load();
  }

  nextPage(): Promise<void> {
    return this.strategy.nextPage();
  }

  prevPage(): Promise<void> {
    return this.strategy.prevPage();
  }

  updateFilter(filter: PaginationFilter): Promise<void> {
    return this.strategy.updateFilter(filter);
  }

  onLoadingStart(callback: () => void): void {
    this.strategy.onLoadingStart(callback);
  }

  onLoadingFinished(callback: () => void): void {
    this.strategy.onLoadingFinished(callback);
  }

  dispose(): void {
    this.strategy.dispose();
  }

  private static checkSspEnabled($store: VuexStore, storeName: string, resourceType: string): boolean {
    try {
      const getter = $store.getters[`${ storeName }/paginationEnabled`];

      return getter ? !!getter({ id: resourceType }) : false;
    } catch {
      return false;
    }
  }
}
