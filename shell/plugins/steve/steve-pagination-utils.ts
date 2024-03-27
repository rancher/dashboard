import projectAndNamespaceFilteringUtils from '@shell/plugins/steve/projectAndNamespaceFiltering.utils';
import { FindPageOpt } from '@shell/types/store/dashboard-store.types';

/**
 * Helper functions for steve pagination
 */
class StevePaginationUtils {
  checkAndCreateParam(opt: FindPageOpt): string | undefined {
    if (!opt.pagination) {
      return;
    }

    const params: string[] = [];
    const namespaceParam = this.createNamespacesParam(opt);

    if (namespaceParam) {
      params.push(namespaceParam);
    }

    if (opt.pagination.page) {
      params.push(`page=${ opt.pagination.page }`);
    } else {
      throw new Error(`A pagination request is required but no 'page' property provided: ${ JSON.stringify(opt) }`);
    }

    if (opt.pagination.pageSize) {
      params.push(`pagesize=${ opt.pagination.pageSize }`);
    } else {
      throw new Error(`A pagination request is required but no 'page' property provided: ${ JSON.stringify(opt) }`);
    }

    if (opt.pagination.sort?.length) {
      const joined = opt.pagination.sort
        .map((s) => `${ s.asc ? '' : '-' }${ s.field }`)
        .join(',');

      params.push(`sort=${ joined }`);
    }

    if (opt.pagination.filter?.length) {
      const andFilters = opt.pagination.filter
        .filter((orFilters) => !!orFilters.length)
        .map((orFilters) => {
          if (orFilters.length) {
            const joined = orFilters
              .map(({ field, value, notEqual }) => {
                const equality = notEqual ? '!=' : '=';

                return `${ field }${ equality }${ value }`;
              })
              .join(','); // This means OR

            return `filter=${ joined }`;
          }
        })
        .join('&'); // This means AND

      if (andFilters) {
        params.push(andFilters);
      }
    }

    // Note - There is a `limit` property that is by default 100,000. This can be disabled by using `limit=-1`,
    // but we shouldn't be fetching any pages big enough to exceed the default

    return params.join('&');
  }

  private createNamespacesParam(opt: FindPageOpt): string | undefined {
    if (!opt.pagination?.namespaces) {
      return '';
    }

    return projectAndNamespaceFilteringUtils.createParam(opt.pagination?.namespaces);
  }
}

export default new StevePaginationUtils();
