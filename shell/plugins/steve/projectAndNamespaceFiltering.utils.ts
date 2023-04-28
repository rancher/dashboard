import { NAMESPACE_FILTER_NS_FULL_PREFIX, NAMESPACE_FILTER_P_FULL_PREFIX } from 'utils/namespace-filter';
import richardsLogger from '@shell/utils/richards-logger';

class ProjectAndNamespaceFiltering {

  static resourcePrefix = 'apis/resources.project.cattle.io/v1alpha1'; // --> api/v1 // collection links
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
   */  convertUrl(url: string, namespaceFilter: string[]): string  {
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
   * Results from `resources.project.cattle.io.<type>` endpoint contain links that point to it's own endpoint.
   * We always want these links to represent their original type. This method finds all links and converts them
   * back to the original type
   */
  convertResourceResponse(res: any, opt: any, type: string) {
    richardsLogger.warn('pAndNUtils', 'updateNamespaceProjectResult', 1, opt, res, type);

    res.resourceType = type;
    for (let link in res.links || {}) {
      res.links[link] = ProjectAndNamespaceFiltering.fixLink(res.links[link], type)
    }

    res.data.forEach((d: any) => {
      d.type = type;
      for (let link in d.links || {}) {
        d.links[link] = ProjectAndNamespaceFiltering.fixLink(d.links[link], type)
      }
    })
    richardsLogger.warn('pAndNUtils', 'updateNamespaceProjectResult', 2, res);
    return res;
  }

  private static fixLink(link: string, type: string) : string {
    return link
    .replace(ProjectAndNamespaceFiltering.urlResourcePrefix, '')
    .replace(ProjectAndNamespaceFiltering.resourcePrefix, 'api/v1')
       // TODO: RC test
  }
}

export default new ProjectAndNamespaceFiltering();