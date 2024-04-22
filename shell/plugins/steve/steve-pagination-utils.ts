import { FindPageOpt, OptPaginationFilter, OptPaginationFilterField, OptPaginationProjectOrNamespace } from '@shell/types/store/dashboard-store.types';
import { NAMESPACE_FILTER_ALL_SYSTEM, NAMESPACE_FILTER_ALL_USER, NAMESPACE_FILTER_P_FULL_PREFIX } from '@shell/utils/namespace-filter';
import Namespace from '@shell/models/namespace';

class NamespaceProjectFilters {
  /**
   * User needs all resources.... except if there's some settings which should remove resources in specific circumstances
   */
  protected handlePrefAndSettingFilter(allNamespaces: Namespace[], showDynamicRancherNamespaces: boolean, productHidesSystemNamespaces: boolean): OptPaginationFilter[] {
    // These are AND'd together
    // Not ns 1 AND ns 2
    return allNamespaces.reduce((res, ns) => {
      // Links to ns.isObscure and covers things like `c-`, `user-`, etc (see OBSCURE_NAMESPACE_PREFIX)
      const hideObscure = showDynamicRancherNamespaces ? false : ns.isObscure;
      // Links to ns.isSystem and covers things like ns with system annotation, hardcoded list, etc
      const hideSystem = productHidesSystemNamespaces ? ns.isSystem : false;

      if (hideObscure || hideSystem) {
        res.push(new OptPaginationFilter({
          fields: [new OptPaginationFilterField({
            field: 'metadata.namespace', value: ns.name, equals: false
          })]
        }));
      }

      return res;
    }, [] as OptPaginationFilter[]);
  }

  /**
   * User needs either all user resources... or all system
   *
   * System resources revolve around the namespace's isSystem property
   *
   * Users resources are those not in system namespaces
   */
  protected handleSystemOrUserFilter(allNamespaces: Namespace[], isAllSystem: boolean, isAllUser: boolean) {
    const allSystem = allNamespaces.filter((ns) => ns.isSystem);

    // > Neither of these use projectsOrNamespaces to avoid scenarios where the local cluster provides a namespace which has
    // > a matching project... which could lead to results in the user project resource being included in the system filter
    if (isAllSystem) {
      // return resources in system ns 1 OR in system ns 2 ...
      // &filter=metadata.namespace=system ns 1,metadata.namespace=system ns 2
      return [
        new OptPaginationFilter({
          fields: allSystem.map(
            (ns) => new OptPaginationFilterField({ field: 'metadata.namespace', value: ns.name })
          )
        })
      ];
    } else { // if isAllUser
      // return resources not in system ns 1 AND not in system ns 2 ...
      // &filter=metadata.namespace!=system ns 1&filter=metadata.namespace!=system ns 2
      return allSystem.map((ns) => new OptPaginationFilter({
        fields: [{
          field: 'metadata.namespace', value: ns.name, equals: false
        }]
      }));
    }
  }

  /**
   * User needs resources in a set of projects or namespaces
   */
  protected handleSelectionFilter(neu: string[], isLocalCluster: boolean) {
    // User has one or more projects or namespaces. We can pass this straight through to projectsornamespaces

    // return resources in project 1 OR namespace 2
    // &projectsornamespaces=project 1,namespace 2
    const projectsOrNamespaces = [new OptPaginationProjectOrNamespace({ fields: neu.map((selection) => new OptPaginationFilterField({ value: selection })) })];

    if (isLocalCluster) {
      // > As per `handleSystemOrUserFilter` above, we need to be careful of the local cluster where there's namespaces related to projects with the same id
      // > In this case
      // - We're including resources in the project and it's related namespace (via projectsornamespaces)
      // - We're also then excluding resources in the related namespace (via below `filter`)

      // Exclude resources NOT in projects namespace 1 AND not in projects namespace 2
      // &filter=metadata.namespace!=pn1&filter=metadata.namespace!=pn2
      return {
        projectsOrNamespaces,
        filters: neu
          .filter((selection) => selection.startsWith(NAMESPACE_FILTER_P_FULL_PREFIX))
          .map((projects) => new OptPaginationFilter({
            fields: [{
              field: 'metadata.namespace', value: projects.replace(NAMESPACE_FILTER_P_FULL_PREFIX, ''), equals: false
            }]
          }))
      };
    }

    return { projectsOrNamespaces, filters: [] };
  }
}

/**
 * Helper functions for steve pagination
 */
class StevePaginationUtils extends NamespaceProjectFilters {
  /**
   * Given the selection of projects or namespaces come up with `filter` and `projectsornamespace` query params
   */
  public createParamsFromNsFilter({
    allNamespaces,
    selection,
    isAllNamespaces,
    isLocalCluster,
    showDynamicRancherNamespaces,
    productHidesSystemNamespaces,
  }: {
    allNamespaces: Namespace[],
    selection: string[],
    /**
     * There is no user provided filter
     */
    isAllNamespaces: boolean,
    /**
     * Weird things be happening if the target cluster is local / upstream
     */
    isLocalCluster: boolean,
    /**
     * Links to ns.isObscure and covers things like `c-`, `user-`, etc (see OBSCURE_NAMESPACE_PREFIX)
     */
    showDynamicRancherNamespaces: boolean,
    /**
     * Links to ns.isSystem and covers things like ns with system annotation, hardcoded list, etc
     */
    productHidesSystemNamespaces: boolean,
  }): {
    projectsOrNamespaces: OptPaginationFilter[],
    filters: OptPaginationFilter[]
  } {
    // Hold up, why are we doing yet another way to convert the user's project / namespace filter to a set of something?
    // - When doing this for local pagination `getActiveNamespaces` provides a full list of applicable namespaces. Lists then filter resource locally
    // - Pagination cannot take this approach of 'gimme all resources in these namespaces' primarily for the 'Only User Namespaces' case
    //   - User could have 2k namespaces. This would result in 2k+ namespaces added to the url (namespace=1,namespace=2,namespace=3, etc)
    // - Instead we do // TODO: RC
    //   - All but not given settings - Gimme resources NOT in system or obscure namespaces
    //   - Only System Namespaces - Gimme resources in the system namespaces (which shouldn't be many namespaces)
    //   - Only User Namespaces - Gimme resources NOT in system namespaces
    //   - User selection - Gimme resources in specific Projects or Namespaces

    if (isAllNamespaces && (showDynamicRancherNamespaces && !productHidesSystemNamespaces)) {
      // No-op. Everything is returned
      return {
        projectsOrNamespaces: [],
        filters:              []
      };
    }

    // used to return resources in / not in projects/namespaces (entries are checked in both types)
    // &projectsornamespaces=project 1,namespace 2
    let projectsOrNamespaces: OptPaginationFilter[] = [];
    // used to return resources in / not in namespaces
    // &filter=metadata.namespace=abc
    let filters: OptPaginationFilter[] = [];

    if (!showDynamicRancherNamespaces || productHidesSystemNamespaces) {
      // We need to hide dynamic namespaces ('c-', 'p-', etc) OR system namespaces
      filters = this.handlePrefAndSettingFilter(allNamespaces, showDynamicRancherNamespaces, productHidesSystemNamespaces);
    }

    const isAllSystem = selection[0] === NAMESPACE_FILTER_ALL_SYSTEM;
    const isAllUser = selection[0] === NAMESPACE_FILTER_ALL_USER;

    if (selection.length === 1 && (isAllSystem || isAllUser)) {
      // Filter by resources either in or not in system namespaces
      filters.push(...this.handleSystemOrUserFilter(allNamespaces, isAllSystem, isAllUser ));
    } else {
      // User has one or more projects or namespaces
      const res = this.handleSelectionFilter(selection, isLocalCluster);

      projectsOrNamespaces = res.projectsOrNamespaces;
      filters.push(...res.filters);
    }

    return {
      projectsOrNamespaces,
      filters
    };
  }

  checkAndCreateParam(opt: FindPageOpt): string | undefined {
    if (!opt.pagination) {
      return;
    }

    const params: string[] = [];
    const namespaceParam = this.convertPaginationFilter(opt.pagination.projectsOrNamespaces);

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
      const andFilters = this.convertPaginationFilter(opt.pagination.filter);

      if (andFilters) {
        params.push(andFilters);
      }
    }

    // Note - There is a `limit` property that is by default 100,000. This can be disabled by using `limit=-1`,
    // but we shouldn't be fetching any pages big enough to exceed the default

    return params.join('&');
  }

  private convertPaginationFilter(filters: OptPaginationFilter[] = []): string {
    return filters
      .filter((filter) => !!filter.fields.length)
      .map((filter) => {
        const joined = filter.fields
          .map((field) => {
            if (field.field) {
              return `${ field.field }${ field.equals ? '=' : '!=' }${ field.value }`;
            }

            return field.value;
          })
          .join(','); // This means OR

        return `${ filter.param }${ filter.equals ? '=' : '!=' }${ joined }`;
      }).join('&'); // This means AND
  }
}

export default new StevePaginationUtils();
