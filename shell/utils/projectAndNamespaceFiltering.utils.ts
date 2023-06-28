import { NAMESPACE_FILTER_NS_FULL_PREFIX, NAMESPACE_FILTER_P_FULL_PREFIX } from '@shell/utils/namespace-filter';
import { getPerformanceSetting } from '@shell/utils/settings';

type Opt = { [key: string]: any, namespaced?: string[]}

class ProjectAndNamespaceFiltering {
  static param = 'projectsornamespaces'

  /**
   * Does the request `opt` definition require resources are fetched from a specific set namespaces/projects?
   */
  isApplicable(opt: Opt): boolean {
    return Array.isArray(opt.namespaced);
  }

  isEnabled(rootGetters: any): boolean {
    const currentProduct = rootGetters['currentProduct'];

    // Only enable for the cluster store at the moment. In theory this should work in management as well, as they're both 'steve' stores
    if (currentProduct?.inStore !== 'cluster') {
      return false;
    }

    if (currentProduct?.showWorkspaceSwitcher) {
      return false;
    }

    const perfConfig = getPerformanceSetting(rootGetters);

    if (!perfConfig.forceNsFilterV2?.enabled) {
      return false;
    }

    return true;
  }

  /**
   * Check if `opt` requires resources from specific ns/projects, if so return the required query param (x=y)
   */
  checkAndCreateParam(opt: Opt): string {
    if (!this.isApplicable(opt)) {
      return '';
    }

    return this.createParam(opt.namespaced);
  }

  private createParam(namespaceFilter: string[] | undefined): string {
    if (!namespaceFilter || !namespaceFilter.length) {
      return '';
    }

    const projectsOrNamespaces = namespaceFilter
      .map((f) => f.replace(NAMESPACE_FILTER_NS_FULL_PREFIX, '')
        .replace(NAMESPACE_FILTER_P_FULL_PREFIX, ''))
      .join(',');

    return `${ ProjectAndNamespaceFiltering.param }=${ projectsOrNamespaces }`;
  }
}

export default new ProjectAndNamespaceFiltering();
