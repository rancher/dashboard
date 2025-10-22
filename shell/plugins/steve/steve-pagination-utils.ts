import { ActionFindPageArgs } from '@shell/types/store/dashboard-store.types';
import { PaginationParam, PaginationFilterField, PaginationParamProjectOrNamespace, PaginationParamFilter } from '@shell/types/store/pagination.types';
import { NAMESPACE_FILTER_ALL_SYSTEM, NAMESPACE_FILTER_ALL_USER, NAMESPACE_FILTER_P_FULL_PREFIX } from '@shell/utils/namespace-filter';
import ModelNamespace from '@shell/models/namespace';
import { uniq } from '@shell/utils/array';
import {
  CAPI,
  CATALOG,
  CONFIG_MAP, MANAGEMENT, EVENT, NAMESPACE, NODE, POD, PVC,
  PV,
  STORAGE_CLASS,
  SERVICE,
  INGRESS,
  WORKLOAD_TYPES,
  HPA,
  SECRET
} from '@shell/config/types';
import { CAPI as CAPI_LAB_AND_ANO, CATTLE_PUBLIC_ENDPOINTS, STORAGE, UI_PROJECT_SECRET_COPY } from '@shell/config/labels-annotations';
import { Schema } from '@shell/plugins/steve/schema';
import { PaginationSettingsStores } from '@shell/types/resources/settings';
import paginationUtils from '@shell/utils/pagination-utils';
import { KubeLabelSelector, KubeLabelSelectorExpression } from '@shell/types/kube/kube-api';
import { parseField } from '@shell/utils/sort';

/**
 * This is a workaround for a ts build issue found in check-plugins-build.
 *
 * The build would error on <ns>.name, it somehow doesn't know about the steve model's properties (they are included in typegen)
 */
interface Namespace extends ModelNamespace {
  id: string;
  name: string;
  metadata: {
    name: string
  }
}

class NamespaceProjectFilters {
  /**
   * User needs all resources.... except if there's some settings which should remove resources in specific circumstances
   */
  protected handlePrefAndSettingFilter(args: {
    allNamespaces: Namespace[],
    showReservedRancherNamespaces: boolean,
    productHidesSystemNamespaces: boolean,
  }): PaginationParamFilter[] {
    const { allNamespaces, showReservedRancherNamespaces, productHidesSystemNamespaces } = args;

    // These are AND'd together
    // Not ns 1 AND ns 2
    return allNamespaces.reduce((res, ns) => {
      // Links to ns.isObscure and covers things like `c-`, `user-`, etc (see OBSCURE_NAMESPACE_PREFIX)
      const hideObscure = showReservedRancherNamespaces ? false : ns.isObscure;

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
  protected handleSystemOrUserFilter(args: {
    allNamespaces: Namespace[],
    isAllSystem: boolean,
    isAllUser: boolean,
  }) {
    const { allNamespaces, isAllSystem } = args;
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
   * Match
   * - a-z (case insensitive)
   * - 0-9
   * - `-`, `_`, `.`
   */
  static VALID_FIELD_VALUE_REGEX = /^[\w\-.]+$/;

  /**
   * Filtering with the vai cache supports specific fields
   * 1) Those listed here
   * 2) Those references in the schema's attributes.fields list (which is used by generic lists)
   */
  static VALID_FIELDS: { [type: string]: { field: string, startsWith?: boolean }[]} = {
    '': [// all types
      { field: 'metadata.name' },
      { field: 'metadata.namespace' },
      { field: 'id' },
      { field: 'metadata.state.name' },
      { field: 'metadata.creationTimestamp' },
      { field: 'metadata.labels', startsWith: true },
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
    [MANAGEMENT.NODE_POOL]: [
      { field: 'spec.clusterName' },
    ],
    [MANAGEMENT.NODE_TEMPLATE]: [
      { field: 'spec.clusterName' },
    ],
    [MANAGEMENT.CLUSTER]: [
      { field: 'spec.internal' },
      { field: 'spec.displayName' },
      { field: `status.provider` },
      { field: `status.connected` },
    ],
    [SECRET]: [
      { field: `metadata.annotations[${ UI_PROJECT_SECRET_COPY }]` },
    ],
    [NAMESPACE]: [
    ],
    [CAPI.MACHINE]: [
      { field: 'spec.clusterName' }
    ],
    [EVENT]: [
      { field: '_type' },
      { field: 'reason' },
      { field: 'involvedObject.kind' },
      { field: 'involvedObject.uid' },
      { field: 'message' },
    ],
    [CATALOG.CLUSTER_REPO]: [
      { field: 'spec.gitRepo' },
      { field: 'spec.gitBranch' },
      { field: `metadata.annotations[clusterrepo.cattle.io/hidden]` }
    ],
    [CATALOG.OPERATION]: [
      { field: 'status.action' },
      { field: 'status.namespace' },
      { field: 'status.releaseName' },
    ],
    [CAPI.RANCHER_CLUSTER]: [
      { field: `status.provider` },
      { field: 'status.clusterName' },
      { field: `metadata.annotations[${ CAPI_LAB_AND_ANO.HUMAN_NAME }]` }
    ],
    [SERVICE]: [
      { field: 'spec.type' },
      { field: 'spec.clusterIP' },
    ],
    [INGRESS]: [
      { field: 'spec.rules.host' },
      { field: 'spec.ingressClassName' },
    ],
    [HPA]: [
      { field: 'spec.scaleTargetRef.name' },
      { field: 'spec.minReplicas' },
      { field: 'spec.maxReplicas' },
      { field: 'spec.currentReplicas' },
    ],
    [PVC]: [
      { field: 'spec.volumeName' },
    ],
    [PV]: [
      { field: 'status.reason' },
      { field: 'spec.persistentVolumeReclaimPolicy' },
    ],
    [STORAGE_CLASS]: [
      { field: 'provisioner' },
      { field: `metadata.annotations[${ STORAGE.DEFAULT_STORAGE_CLASS }]` },
    ],
    [CATALOG.APP]: [
      { field: 'spec.chart.metadata.name' }
    ],
    [WORKLOAD_TYPES.CRON_JOB]: [
      { field: `metadata.annotations[${ CATTLE_PUBLIC_ENDPOINTS }]` },
      { field: 'spec.template.spec.containers.image' },
    ],
    [WORKLOAD_TYPES.DAEMON_SET]: [
      { field: `metadata.annotations[${ CATTLE_PUBLIC_ENDPOINTS }]` },
      { field: 'spec.template.spec.containers.image' },
    ],
    [WORKLOAD_TYPES.DEPLOYMENT]: [
      { field: `metadata.annotations[${ CATTLE_PUBLIC_ENDPOINTS }]` },
      { field: 'spec.template.spec.containers.image' },
    ],
    [WORKLOAD_TYPES.JOB]: [
      { field: `metadata.annotations[${ CATTLE_PUBLIC_ENDPOINTS }]` },
      { field: 'spec.template.spec.containers.image' },
    ],
    [WORKLOAD_TYPES.STATEFUL_SET]: [
      { field: `metadata.annotations[${ CATTLE_PUBLIC_ENDPOINTS }]` },
      { field: 'spec.template.spec.containers.image' },
    ],
    [WORKLOAD_TYPES.REPLICA_SET]: [
      { field: 'spec.template.spec.containers.image' },
    ],
    [WORKLOAD_TYPES.REPLICATION_CONTROLLER]: [
      { field: 'spec.template.spec.containers.image' },
    ],
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
    showReservedRancherNamespaces,
    productHidesSystemNamespaces,
  }: {
    allNamespaces: Namespace[],
    selection: string[],
    /**
     * There is no user provided filter
     */
    isAllNamespaces: boolean,
    /**
     * Weird things be happening if the target cluster is local / upstream. Use this to check what cluster we're in
     */
    isLocalCluster: boolean,
    /**
     * User preference states we should show reserved rancher namespaces. Preference description "Show dynamic Namespaces managed by Rancher (not intended for editing or deletion)"
     *
     * Links to ns.isObscure and covers things like `c-`, `user-`, etc (see OBSCURE_NAMESPACE_PREFIX)
     */
    showReservedRancherNamespaces: boolean,
    /**
     * Product config states that system namespaces should be hidden
     *
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
    if (isAllNamespaces && (showReservedRancherNamespaces && !productHidesSystemNamespaces)) {
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

    if (!showReservedRancherNamespaces || productHidesSystemNamespaces) {
      // We need to hide reserved namespaces ('c-', 'user-', etc) OR system namespaces
      filters = this.handlePrefAndSettingFilter({
        allNamespaces, showReservedRancherNamespaces, productHidesSystemNamespaces
      });
    }

    const isAllSystem = selection[0] === NAMESPACE_FILTER_ALL_SYSTEM;
    const isAllUser = selection[0] === NAMESPACE_FILTER_ALL_USER;

    if (selection.length === 1 && (isAllSystem || isAllUser)) {
      // Filter by resources either in or not in system namespaces
      filters.push(...this.handleSystemOrUserFilter({
        allNamespaces, isAllSystem, isAllUser
      }));
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

  public createParamsForPagination({ schema, opt }: {schema?: Schema, opt: ActionFindPageArgs}): string | undefined {
    if (!opt.pagination) {
      return;
    }

    const params: string[] = [];
    const namespaceParam = this.convertPaginationParams({ schema, filters: opt.pagination.projectsOrNamespaces });

    if (namespaceParam) {
      params.push(namespaceParam);
    }

    if (opt.pagination.page) {
      params.push(`page=${ opt.pagination.page }`);
    }

    if (!!opt.pagination.pageSize || opt.pagination.pageSize === 0) {
      params.push(`pagesize=${ opt.pagination.pageSize }`);
    } else {
      // Prevent unlimited resources in response
      params.push(`pagesize=${ paginationUtils.defaultPageSize }`);
    }

    if (opt.pagination.sort?.length) {
      const validateFields = {
        checked: new Array<string>(),
        invalid: new Array<string>(),
      };

      const joined = opt.pagination.sort
        .map((s) => {
          // Use the same mechanism as local sorting to flip logic for asc/des
          const { field, reverse } = parseField(s.field);
          const asc = reverse ? !s.asc : s.asc;

          this.validateField(validateFields, schema, field);

          return `${ asc ? '' : '-' }${ this.convertArrayPath(field) }`;
        })
        .join(',');

      params.push(`sort=${ joined }`);

      if (validateFields.invalid.length) {
        console.warn(`Pagination API does not support sorting '${ schema?.id || opt.url }' by the requested fields: ${ uniq(validateFields.invalid).join(', ') }`); // eslint-disable-line no-console
      }
    }

    if (opt.pagination.filters?.length) {
      const filters = this.convertPaginationParams({ schema, filters: opt.pagination.filters });

      if (filters) {
        params.push(filters);
      }
    }

    if (opt.pagination.labelSelector) {
      const filters = this.convertLabelSelectorPaginationParams({ labelSelector: opt.pagination.labelSelector });

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
  private validateField(state: { checked: string[], invalid: string[]}, schema?: Schema, field?: string) {
    if (!field) {
      return; // no field, so not invalid
    }

    if (state.checked.includes(field)) {
      return; // already checked, exit early
    }

    state.checked.push(field);

    // First check in our hardcoded list of supported filters
    if (
      !!schema &&
      [
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
      }))
    ) {
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
  private convertPaginationParams({ schema, filters = [] }: {schema?: Schema, filters: PaginationParam[]}): string {
    const validateFields = {
      checked: new Array<string>(),
      invalid: new Array<string>(),
    };
    const filterStrings = filters
      .filter((filter) => !!filter.fields.length)
      .map((filter) => {
        const joined = filter.fields
          .map((field) => {
            if (field.field) {
              // Check if the API supports filtering by this field
              this.validateField(validateFields, schema, field.field);

              // we're just checking that the field exists, so there's no value
              if (field.exists) {
                return field.field;
              }
              const encodedValue = encodeURIComponent(field.value || '');

              // = exact match (equals + exact)
              // ~ partial match (equals + !exact)
              // != not exact match (!equals + exact)
              // !~ not partial match (!equals + !exact)
              const operator = `${ field.equals ? '' : '!' }${ field.exact ? '=' : '~' }`;
              let safeValue;

              if (StevePaginationUtils.VALID_FIELD_VALUE_REGEX.test(field.value || '')) {
                // Does not contain any protected characters, send as is
                safeValue = encodedValue;
              } else {
                // Contains protected characters, wrap in quotes to ensure backend doesn't fail
                // - replace reserver `"`/`%22` with empty string - see https://github.com/rancher/dashboard/issues/14549 for improvement
                safeValue = `"${ encodedValue.replaceAll('%22', '') }"`;
              }

              return `${ this.convertArrayPath(field.field) }${ operator }${ safeValue }`;
            }

            return field.value;
          })
          .join(','); // This means OR

        return `${ filter.param }${ filter.equals ? '=' : '!=' }${ joined }`;
      });
    const unique = filterStrings.reduce((res, s) => {
      res[s] = true;

      return res;
    }, { } as {[filterString: string] : boolean });

    const res = Object.keys(unique).join('&'); // This means AND

    if (validateFields.invalid.length) {
      console.warn(`Pagination API does not support filtering '${ schema?.id || 'unknown' }' by the requested fields: ${ uniq(validateFields.invalid).join(', ') }`); // eslint-disable-line no-console
    }

    return res;
  }

  /**
   * Convert kube labelSelector object into steve filter params
   *
   * A lot of the requirements and details are taken directly from
   * https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/
   */
  private convertLabelSelectorPaginationParams({ labelSelector }: { labelSelector: KubeLabelSelector}): string {
    // Get a list of matchExpressions
    const expressions: KubeLabelSelectorExpression[] = labelSelector.matchExpressions ? [...labelSelector.matchExpressions] : [];

    // matchLabels are just simpler versions of matchExpressions, for ease convert them
    if (labelSelector.matchLabels) {
      Object.entries(labelSelector.matchLabels).forEach(([key, value]) => {
        const expression: KubeLabelSelectorExpression = {
          key,
          values:   [value],
          operator: 'In'
        };

        expressions.push(expression);
      });
    }

    // concert all matchExpressions into string params
    const filters: string[] = expressions.reduce((res, exp) => {
      const labelKey = `metadata.labels[${ exp.key }]`;

      switch (exp.operator) {
      case 'In':
        if (!exp.values?.length) {
          console.error(`Skipping labelSelector to API filter param conversion for ${ exp.key }(IN) as no value was supplied`); // eslint-disable-line no-console

          return res;
        }

        // foo IN [bar] => ?filter=foo+IN+(bar)
        // foo IN [bar, baz2] => ?filter=foo+IN+(bar,baz2)
        res.push(`filter=${ labelKey } IN (${ exp.values.join(',') })`);
        break;
      case 'NotIn':

        if (!exp.values?.length) {
          console.error(`Skipping labelSelector to API filter param conversion for ${ exp.key }(NOTIN) as no value was supplied`); // eslint-disable-line no-console

          return res;
        }

        // aaa NotIn [bar, baz2]=> ?filter=foo+NOTIN+(bar,baz2)
        res.push(`filter=${ labelKey } NOTIN (${ exp.values.join(',') })`);
        break;
      case 'Exists':

        if (exp.values?.length) {
          console.error(`Skipping labelSelector to API filter param conversion for ${ exp.key }(Exists) as no value was supplied`); // eslint-disable-line no-console

          return res;
        }

        // bbb Exists=> ?filter=bbb
        res.push(`filter=${ labelKey }`);
        break;
      case 'DoesNotExist':
        if (exp.values?.length) {
          console.error(`Skipping labelSelector to API filter param conversion for ${ exp.key }(DoesNotExist) as no value was supplied`); // eslint-disable-line no-console

          return res;
        }

        // ccc DoesNotExist ?filter=!bbb. # or %21bbb
        res.push(`filter=!${ labelKey }`);
        break;
      case 'Gt':
        // Only applicable to node affinity (atm) - https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#operators

        if (typeof exp.values !== 'string') {
          console.error(`Skipping labelSelector to API filter param conversion for ${ exp.key }(Gt) as no value was supplied`); // eslint-disable-line no-console

          return res;
        }

        // ddd Gt 1=> ?filter=ddd+>+1
        res.push(`filter=${ labelKey } > (${ exp.values })`);
        break;
      case 'Lt':
        // Only applicable to node affinity (atm) - https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#operators
        if (typeof exp.values !== 'string') {
          console.error(`Skipping labelSelector to API filter param conversion for ${ exp.key }(Lt) as no value was supplied`); // eslint-disable-line no-console

          return res;
        }

        // eee Lt 2=> ?filter=eee+<+2
        res.push(`filter=${ labelKey } < (${ exp.values })`);
        break;
      }

      return res;
    }, [] as string[]);

    // "All of the requirements, from both matchLabels and matchExpressions are ANDed together -- they must all be satisfied in order to match"
    return filters.join('&');
  }
}

export const PAGINATION_SETTINGS_STORE_DEFAULTS: PaginationSettingsStores = {
  cluster: {
    resources: {
      enableAll:  false,
      enableSome: {
        // if a resource list is shown by a custom resource list component or has specific list headers then it's not generically shown
        // and must be included here.
        enabled: [
          NODE, EVENT,
          WORKLOAD_TYPES.CRON_JOB, WORKLOAD_TYPES.DAEMON_SET, WORKLOAD_TYPES.DEPLOYMENT, WORKLOAD_TYPES.JOB, WORKLOAD_TYPES.STATEFUL_SET, POD,
          CATALOG.APP, CATALOG.OPERATION,
          HPA, INGRESS, SERVICE,
          PV, CONFIG_MAP, STORAGE_CLASS, PVC, SECRET,
          WORKLOAD_TYPES.REPLICA_SET, WORKLOAD_TYPES.REPLICATION_CONTROLLER,
        ],
        generic: true,
      }
    }
  },
  management: {
    resources: {
      enableAll:  false,
      enableSome: {
        enabled: [
          { resource: CAPI.RANCHER_CLUSTER, context: ['side-bar'] },
          { resource: MANAGEMENT.CLUSTER, context: ['side-bar'] },
          { resource: CATALOG.APP, context: ['branding'] },
          SECRET
        ],
        generic: false,
      }
    }
  }
};

export default new StevePaginationUtils();
