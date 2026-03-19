import type { AxiosInstance } from 'axios';
import type { PaginationFilter } from '@shell/types/resources/fetch-resource';
import type { VuexStore } from '@shell/types/store/vuex';
import { ResourceWatcher } from '@shell/resources/ResourceWatcher';

export interface PaginatedResponse<T = any> {
  data: T[];
  count: number;
  pages: number;
  revision: string;
}

/**
 * Abstract base for pagination strategies.
 *
 * Owns all shared state (page data, pagination cursor, loading flags,
 * watcher, loading callbacks, disposal) and shared helpers (nextPage,
 * prevPage, updateFilter, getCollectionUrl, etc.).
 *
 * Subclasses only need to implement:
 *  - `doLoad()` — perform the actual data fetch / local re-page
 *  - `doPageChange()` — handle a page change (re-fetch for SSP, re-slice for local)
 *  - `doFilterChange()` — handle a filter change
 *  - `doDispose()` — clean up subclass-specific resources
 */
export abstract class BasePaginationStrategy<T = any> {
  page: Array<T> = [];
  totalLength = 0;
  pageSize: number;
  currentPage = 1;
  loading = false;
  disposed = false;

  protected $axios: AxiosInstance;
  protected $store: VuexStore;
  protected storeName: string;
  protected resourceType: string;
  protected filter: PaginationFilter;

  private loadingStartCallbacks: Array<() => void> = [];
  private loadingFinishedCallbacks: Array<() => void> = [];
  private watcher: ResourceWatcher | null = null;

  constructor($axios: AxiosInstance, $store: VuexStore, storeName: string, resourceType: string, pageSize: number, filter: PaginationFilter, watch?: boolean) {
    this.$axios = $axios;
    this.$store = $store;
    this.storeName = storeName;
    this.resourceType = resourceType;
    this.pageSize = pageSize;
    this.filter = filter;

    if (watch) {
      this.watcher = new ResourceWatcher($store, storeName, resourceType, () => this.load());
    }
  }

  async load(): Promise<void> {
    if (this.disposed) {
      return;
    }

    this.loading = true;
    this.loadingStartCallbacks.forEach((cb) => cb());

    try {
      await this.doLoad();
      this.ensureWatching();
    } catch (e) {
      console.error(`PaginationStrategy: failed to load ${ this.resourceType }`, e); // eslint-disable-line no-console
    } finally {
      this.loading = false;
      this.loadingFinishedCallbacks.forEach((cb) => cb());
    }
  }

  async nextPage(): Promise<void> {
    const totalPages = Math.ceil(this.totalLength / (this.pageSize || 1));

    if (this.currentPage < totalPages) {
      this.currentPage++;
    }

    await this.doPageChange();
  }

  async prevPage(): Promise<void> {
    if (this.currentPage > 1) {
      this.currentPage--;
    }

    await this.doPageChange();
  }

  async updateFilter(filter: PaginationFilter): Promise<void> {
    this.filter = filter;
    this.currentPage = 1;
    await this.doFilterChange();
  }

  onLoadingStart(callback: () => void): void {
    this.loadingStartCallbacks.push(callback);
  }

  onLoadingFinished(callback: () => void): void {
    this.loadingFinishedCallbacks.push(callback);
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.watcher?.dispose();
    this.doDispose();
    this.page = [];
    this.loadingStartCallbacks = [];
    this.loadingFinishedCallbacks = [];
  }

  // ---------------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------------

  protected getCollectionUrl(): string {
    const schema = this.$store.getters[`${ this.storeName }/schemaFor`](this.resourceType);

    if (!schema) {
      throw new Error(`Unknown schema for type: ${ this.resourceType }`);
    }

    const url = schema.links?.collection;

    if (!url) {
      throw new Error(`No collection URL for type: ${ this.resourceType }`);
    }

    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }

  // ---------------------------------------------------------------------------
  // Abstract — subclass hooks
  // ---------------------------------------------------------------------------

  /** Perform the actual data fetch and update this.page / this.totalLength */
  protected abstract doLoad(): Promise<void>;

  /** Handle a page change after currentPage has been updated */
  protected abstract doPageChange(): Promise<void>;

  /** Handle a filter change after filter and currentPage have been updated */
  protected abstract doFilterChange(): Promise<void>;

  /** Clean up subclass-specific resources (called during dispose) */
  protected abstract doDispose(): void;

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private ensureWatching(): void {
    if (this.watcher && !this.watcher.isWatching) {
      this.watcher.start();
    }
  }
}
