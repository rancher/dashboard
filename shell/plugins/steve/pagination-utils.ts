import projectAndNamespaceFilteringUtils from '@shell/plugins/steve/projectAndNamespaceFiltering.utils';
import { FindAllOpt } from '@shell/plugins/dashboard-store/dashboard-store.types';
// import { getPerformanceSetting } from 'utils/settings';

/**
 * Help functions for steve pagination
 */
class StevePaginationUtils {
  /**
   * Is pagination enabled at a global level
   */
  isEnabled({ rootGetters }: any) {
    const currentProduct = rootGetters['currentProduct'];

    // Only enable for the cluster store at the moment. In theory this should work in management as well, as they're both 'steve' stores
    if (currentProduct?.inStore !== 'cluster') {
      return false;
    }

    // ... no perf setting yet
    // const perfConfig = getPerformanceSetting(rootGetters);

    return true;
  }

  checkAndCreateParam(opt: FindAllOpt): string | undefined {
    if (!opt.pagination) {
      return;
    }

    console.warn('steve page utils', 'checkAndCreateParam', opt.pagination); // eslint-disable-line no-console

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
      const joined = opt.pagination.filter
        .map(({ field, value }) => `${ field }=${ value }`)
        .join(',');

      params.push(`filter=${ joined }`);
    }

    // Note - There is a `limit` property that is by default 100,000. This can be disabled by using `limit=-1`,
    // but we shouldn't be fetching any pages big enough to exceed the default

    console.warn('steve page utils', 'checkAndCreateParam', 'res', params); // eslint-disable-line no-console

    return params.join('&');
  }

  private createNamespacesParam(opt: FindAllOpt): string | undefined {
    if (!opt.pagination?.namespaces) {
      return '';
    }

    return projectAndNamespaceFilteringUtils.createParam(opt.pagination?.namespaces);
  }
}

export default new StevePaginationUtils();
