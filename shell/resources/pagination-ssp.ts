import { PaginationArgs } from '@shell/types/store/pagination.types';
import stevePaginationUtils from '@shell/plugins/steve/steve-pagination-utils';
import { BasePaginationStrategy, type PaginatedResponse } from '@shell/resources/pagination-strategy';

/**
 * Server-side pagination strategy.
 *
 * Delegates pagination, sorting and filtering to the Steve API.
 */
export class SspPaginationStrategy<T = any> extends BasePaginationStrategy<T> {
  protected async doLoad(): Promise<void> {
    const url = this.buildUrl();
    const response = await this.$axios.get<PaginatedResponse<T>>(url);
    const result = response.data;

    this.page = result.data ?? [];
    this.totalLength = result.count ?? 0;
  }

  protected async doPageChange(): Promise<void> {
    return this.load();
  }

  protected async doFilterChange(): Promise<void> {
    return this.load();
  }

  protected doDispose(): void {
    // No SSP-specific resources to clean up
  }

  // ---------------------------------------------------------------------------
  // URL building
  // ---------------------------------------------------------------------------

  private buildUrl(): string {
    let url = this.getCollectionUrl();
    const params = this.buildPaginationParams();

    if (params) {
      url += `${ url.includes('?') ? '&' : '?' }${ params }`;
    }

    return url;
  }

  private buildPaginationParams(): string {
    const pagination = new PaginationArgs({
      page:                 this.currentPage,
      pageSize:             this.pageSize,
      sort:                 this.filter.sort ?? [],
      filters:              this.filter.filters ?? [],
      projectsOrNamespaces: this.filter.projectsOrNamespaces ?? [],
      labelSelector:        this.filter.labelSelector,
    });

    const schema = this.$store.getters[`${ this.storeName }/schemaFor`](this.resourceType);

    return stevePaginationUtils.createParamsForPagination({ schema, opt: { pagination } }) ?? '';
  }
}
