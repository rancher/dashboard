import { ActionFindPageArgs } from '@shell/types/store/dashboard-store.types';
import { PaginationParam, PaginationFilterField, PaginationParamProjectOrNamespace, PaginationParamFilter } from '@shell/types/store/pagination.types';
import { NAMESPACE_FILTER_ALL_SYSTEM, NAMESPACE_FILTER_ALL_USER, NAMESPACE_FILTER_P_FULL_PREFIX } from '@shell/utils/namespace-filter';
import Namespace from '@shell/models/namespace';
import { uniq } from '@shell/utils/array';
import {
  CONFIG_MAP, MANAGEMENT, NAMESPACE, NODE, POD
} from '@shell/config/types';
import { Schema } from 'plugins/steve/schema';

class NamespaceProjectFilters {
  /**
   * User needs all resources.... except if there's some settings which should remove resources in specific circumstances
   */
  protected handlePrefAndSettingFilter(allNamespaces: Namespace[], showDynamicRancherNamespaces: boolean, productHidesSystemNamespaces: boolean): PaginationParamFilter[] {
    // These are AND'd together
    // Not ns 1 AND ns 2
    return allNamespaces.reduce((res, ns) => {
      // Links to ns.isObscure and covers things like `c-`, `user-`, etc (see OBSCURE_NAMESPACE_PREFIX)
      const hideObscure = showDynamicRancherNamespaces ? false : ns.isObscure;
      // Links to ns.isSystem and covers things like ns with system annotation, hardcoded list, etc
      const hideSystem = productHidesSystemNamespaces ? ns.isSystem : false;

      if (hideObscure || hideSystem) {
        res.push(PaginationParamFilter.createSingleField({
          field: 'metadata.namespace', value: ns.name, equals: false
        }));
      }

      return res;
    }, [] as PaginationParamFilter[]);
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
      return [PaginationParamFilter.createMultipleFields(
        allSystem.map(
          (ns) => new PaginationFilterField({ field: 'metadata.namespace', value: ns.name })
        )
      )];
    } else { // if isAllUser
      // return resources not in system ns 1 AND not in system ns 2 ...
      // &filter=metadata.namespace!=system ns 1&filter=metadata.namespace!=system ns 2
      return allSystem.map((ns) => PaginationParamFilter.createSingleField({
        field: 'metadata.namespace', value: ns.name, equals: false
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
    const projectsOrNamespaces = [
      new PaginationParamProjectOrNamespace({ projectOrNamespace: neu })
    ];

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
          .map((projects) => PaginationParamFilter.createSingleField({
            field: 'metadata.namespace', value: projects.replace(NAMESPACE_FILTER_P_FULL_PREFIX, ''), equals: false
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
   * Filtering with the vai cache supports specific fields
   * 1) Those listed here
   * 2) Those references in the schema's attributes.fields list (which is used by generic lists)
   */
  static VALID_FIELDS: { [type: string]: { field: string, startsWith?: boolean }[]} = {
    '': [// all types
      { field: 'metadata.name' },
      { field: 'metadata.namespace' },
      // { field: 'id' }, // Pending API support
      // { field: 'metadata.state.name' }, // Pending API support
      { field: 'metadata.creationTimestamp' },
    ],
    [NODE]: [
      { field: 'status.nodeInfo.kubeletVersion' },
      { field: 'status.nodeInfo.operatingSystem' },
    ],
    [POD]: [
      { field: 'spec.containers.image' },
      { field: 'spec.nodeName' },
    ],
    [MANAGEMENT.NODE]: [
      { field: 'status.nodeName' },
    ],
    [CONFIG_MAP]: [
      { field: 'metadata.labels[harvesterhci.io/cloud-init-template]' }
    ],
    [NAMESPACE]: [
      { field: 'metadata.labels[field.cattle.io/projectId]' }
    ]
  }

  private convertArrayPath(path: string): string {
    if (path.startsWith('metadata.fields.')) {
      return `metadata.fields[${ path.substring(16) }]`;
    }

    return path;
  }

  public createSortForPagination(sortByPath: string): string {
    return this.convertArrayPath(sortByPath);
  }

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
     * Weird things be happening if the target cluster is local / upstream. Uses this to check what cluster we're in
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
    projectsOrNamespaces: PaginationParamProjectOrNamespace[],
    filters: PaginationParamFilter[]
  } {
    // Hold up, why are we doing yet another way to convert the user's project / namespace filter to a set of something?
    // - When doing this for local pagination `getActiveNamespaces` provides a full list of applicable namespaces.
    //   Lists then filter resource locally using those namespaces
    // - Pagination cannot take this approach of 'gimme all resources in these namespaces' primarily for the 'Only User Namespaces' case
    //   - User could have 2k namespaces. This would result in 2k+ namespaces added to the url (namespace=1,namespace=2,namespace=3, etc)
    // - Instead we do
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
    let projectsOrNamespaces: PaginationParamProjectOrNamespace[] = [];
    // used to return resources in / not in namespaces
    // &filter=metadata.namespace=abc
    let filters: PaginationParamFilter[] = [];

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

  public createParamsForPagination(schema: Schema, opt: ActionFindPageArgs): string | undefined {
    if (!opt.pagination) {
      return;
    }

    const params: string[] = [];
    const namespaceParam = this.convertPaginationParams(schema, opt.pagination.projectsOrNamespaces);

    if (namespaceParam) {
      params.push(namespaceParam);
    }

    if (opt.pagination.page) {
      params.push(`page=${ opt.pagination.page }`);
    }

    if (opt.pagination.pageSize) {
      params.push(`pagesize=${ opt.pagination.pageSize }`);
    }

    if (opt.pagination.sort?.length) {
      const validateFields = {
        checked: new Array<string>(),
        invalid: new Array<string>(),
      };

      const joined = opt.pagination.sort
        .map((s) => {
          this.validateField(validateFields, schema, s.field);

          return `${ s.asc ? '' : '-' }${ this.convertArrayPath(s.field) }`;
        })
        .join(',');

      params.push(`sort=${ joined }`);

      if (validateFields.invalid.length) {
        console.warn(`Pagination API does not support sorting '${ schema.id }' by the requested fields: ${ uniq(validateFields.invalid).join(', ') }`); // eslint-disable-line no-console
      }
    }

    if (opt.pagination.filters?.length) {
      const filters = this.convertPaginationParams(schema, opt.pagination.filters);

      if (filters) {
        params.push(filters);
      }
    }

    // Note - There is a `limit` property that is by default 100,000. This can be disabled by using `limit=-1`,
    // but we shouldn't be fetching any pages big enough to exceed the default

    return params.join('&');
  }

  /**
   * Check if the API supports filtering by this field
   */
  private validateField(state: { checked: string[], invalid: string[]}, schema: Schema, field?: string) {
    if (!field) {
      return; // no field, so not invalid
    }

    if (state.checked.includes(field)) {
      return; // already checked, exit early
    }

    state.checked.push(field);

    // First check in our hardcoded list of supported filters
    if ([
      StevePaginationUtils.VALID_FIELDS[''], // Global
      StevePaginationUtils.VALID_FIELDS[schema.id], // Type specific
    ].find((fields) => fields?.find((f) => {
      if (f.startsWith) {
        if (field.startsWith(f.field)) {
          return true;
        }
      } else {
        return field === f.field;
      }
    }))) {
      return;
    }

    // Then check in schema (the api automatically supports these)
    if (!!schema?.attributes.columns.find(
      // This isn't the most performant, but the string is tiny
      (at) => at.field.replace('$.', '').replace('[', '.').replace(']', '') === field
    )) {
      return;
    }

    state.invalid.push(field);
  }

  /**
   * Convert our {@link PaginationParam} definition of params to a set of url params
   */
  private convertPaginationParams(schema: Schema, filters: PaginationParam[] = []): string {
    const validateFields = {
      checked: new Array<string>(),
      invalid: new Array<string>(),
    };
    const res = filters
      .filter((filter) => !!filter.fields.length)
      .map((filter) => {
        const joined = filter.fields
          .map((field) => {
            if (field.field) {
              // Check if the API supports filtering by this field
              this.validateField(validateFields, schema, field.field);

              const exactPartial = field.exact ? `'${ field.value }'` : field.value;

              return `${ this.convertArrayPath(field.field) }${ field.equals ? '=' : '!=' }${ exactPartial }`;
            }

            return field.value;
          })
          .join(','); // This means OR

        return `${ filter.param }${ filter.equals ? '=' : '!=' }${ joined }`;
      }).join('&'); // This means AND

    if (validateFields.invalid.length) {
      console.warn(`Pagination API does not support filtering '${ schema.id }' by the requested fields: ${ uniq(validateFields.invalid).join(', ') }`); // eslint-disable-line no-console
    }

    return res;
  }
}

export default new StevePaginationUtils();
