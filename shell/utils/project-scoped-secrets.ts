import { UI_PROJECT_SECRET, UI_PROJECT_SECRET_COPY } from '@shell/config/labels-annotations';
import { SAVED_COUNTS } from '@shell/config/types';
import { NAMESPACE_FILTER_P_FULL_PREFIX } from '@shell/utils/namespace-filter';
import { ActionFindPageArgs } from '@shell/types/store/dashboard-store.types';
import { PaginationArgs, PaginationFilterEquality, PaginationParamFilter } from '@shell/types/store/pagination.types';

/**
 * Pagination filters that select the project-scoped secrets, and exclude their downstream copies,
 * that belong to the given cluster.
 *
 * Project-scoped secrets are `management` store secrets carrying the project-scoped label. These
 * filters are shared by the project-scoped secrets list (`shell/list/projectsecret.vue`) and the
 * side nav count fetch so both describe the same set.
 */
export function projectScopedSecretsFilters(clusterId: string): {
  labelFilter: PaginationParamFilter;
  annotationFilter: PaginationParamFilter;
  clusterFilter: PaginationParamFilter;
} {
  // Filter in project-scoped secrets
  const labelFilter = PaginationParamFilter.createSingleField({
    field:  `metadata.labels[${ UI_PROJECT_SECRET }]`,
    exists: true,
  }) as PaginationParamFilter;

  // Filter out their copies
  const annotationFilter = PaginationParamFilter.createSingleField({
    field:  `metadata.annotations[${ UI_PROJECT_SECRET_COPY }]`,
    value:  `true`,
    equals: false,
    exact:  true,
  }) as PaginationParamFilter;

  // Filter in the current cluster's project-scoped secrets
  const clusterFilter = PaginationParamFilter.createSingleField({
    field:  'spec.clusterName',
    value:  clusterId,
    equals: true,
    exact:  true,
  }) as PaginationParamFilter;

  return {
    labelFilter, annotationFilter, clusterFilter
  };
}

/**
 * Pull the selected project names (a project's `metadata.name`, e.g. `p-abc12`) out of the
 * namespace/project header selection (`namespaceFilters` getter).
 *
 * A project-scoped secret carries its project's `metadata.name` in the project-scoped label, so a
 * project selection maps directly onto that label's value.
 */
export function selectedProjectNames(namespaceSelection: string[] = []): string[] {
  return (namespaceSelection || [])
    .filter((selection) => selection.startsWith(NAMESPACE_FILTER_P_FULL_PREFIX))
    .map((selection) => selection.replace(NAMESPACE_FILTER_P_FULL_PREFIX, ''));
}

/**
 * Pagination filter that restricts project-scoped secrets to the given projects (by their
 * `metadata.name`), via the project-scoped label. Returns `undefined` when no project is selected,
 * in which case the caller should fall back to the label `exists` filter (all projects).
 */
export function projectScopedSecretsProjectFilter(projectNames: string[] = []): PaginationParamFilter | undefined {
  if (!projectNames.length) {
    return undefined;
  }

  return PaginationParamFilter.createSingleField({
    field:    `metadata.labels[${ UI_PROJECT_SECRET }]`,
    value:    projectNames.join(','),
    equality: PaginationFilterEquality.IN,
  }) as PaginationParamFilter;
}

/**
 * `findPage` args that fetch just the count of project-scoped secrets in the given cluster,
 * optionally scoped to a set of selected projects so the count matches the filtered list.
 *
 * A single row transient page is requested so only the total count is retained (saved under
 * `SAVED_COUNTS.PROJECT_SCOPED_SECRETS` for the side nav), without loading the secrets themselves.
 */
export function projectScopedSecretsCountRequest(clusterId: string, projectNames: string[] = []): ActionFindPageArgs {
  const { labelFilter, annotationFilter, clusterFilter } = projectScopedSecretsFilters(clusterId);
  const projectFilter = projectScopedSecretsProjectFilter(projectNames);

  return {
    pagination: new PaginationArgs({
      filters:  [projectFilter || labelFilter, annotationFilter, clusterFilter],
      page:     1,
      pageSize: 1,
    }),
    transient:   true,
    saveCountAs: SAVED_COUNTS.PROJECT_SCOPED_SECRETS,
  };
}
