import { NAMESPACE_FILTER_NS_FULL_PREFIX, NAMESPACE_FILTER_P_FULL_PREFIX } from 'utils/namespace-filter';
import richardsLogger from '@shell/utils/richards-logger';

class ProjectAndNamespaceFiltering {

  static urlResourcePrefix = 'resources.project.cattle.io.'

  /**
   * Is the resource requested in multiple namespaces (only)
   */
  isApplicable(opt: any): boolean {
    return Array.isArray(opt.namespaced);
  }

  /**
   * Takes the standard url for a resource e.g. `v1/pod` and converts it to one that supports filtering by the provided projects and namespaces
   * e.g. `v1/resources.project.cattle.io.pod?fieldSelector=projectsornamespaces=kube-system,kube-public`
   *
   */
  convertUrl(url: string, namespaceFilter: string[]): string  {
    const obj =
    new URL(url);

    // Change resource in path
    const parts = obj.pathname.split('/');
    parts[parts.length - 1] = ProjectAndNamespaceFiltering.urlResourcePrefix + parts[parts.length - 1];
    obj.pathname = parts.join('/');

    // add ns / project filter param
    const projectsOrNamespaces = namespaceFilter
      .map(f => f.replace(NAMESPACE_FILTER_NS_FULL_PREFIX, '').replace(NAMESPACE_FILTER_P_FULL_PREFIX, ''))
      .join(',');

    // NOTE - This replaces the whole `fieldSelector`
    obj.searchParams.set('fieldSelector', `projectsornamespaces=${projectsOrNamespaces}`);

    return obj.toString();
  }

  /**
   * Results from `resources.project.cattle.io.<type>` endpoint contains content referring to it's own endpoint.
   * We always want these resources to represent their original type
   */
  convertResourceResponse(res: any, opt: any, type: string) {
    richardsLogger.warn('pAndNUtils', 'updateNamespaceProjectResult', 1, opt, res, type);

    // Originally this was more, but at the moment it's just the type
    res.resourceType = type;
    res.data.forEach((d: any) => {
      d.type = type;
    });

    richardsLogger.warn('pAndNUtils', 'updateNamespaceProjectResult', 2, res);
    return res;
  }

}

export default new ProjectAndNamespaceFiltering();