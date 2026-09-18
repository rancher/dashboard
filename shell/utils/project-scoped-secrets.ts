import { UI_PROJECT_SECRET, UI_PROJECT_SECRET_COPY } from '@shell/config/labels-annotations';
import { SAVED_COUNTS } from '@shell/config/types';
import { ActionFindPageArgs } from '@shell/types/store/dashboard-store.types';
import { PaginationArgs, PaginationParamFilter } from '@shell/types/store/pagination.types';

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
 * `findPage` args that fetch just the count of project-scoped secrets in the given cluster.
 *
 * A single row transient page is requested so only the total count is retained (saved under
 * `SAVED_COUNTS.PROJECT_SCOPED_SECRETS` for the side nav), without loading the secrets themselves.
 */
export function projectScopedSecretsCountRequest(clusterId: string): ActionFindPageArgs {
  const { labelFilter, annotationFilter, clusterFilter } = projectScopedSecretsFilters(clusterId);

  return {
    pagination: new PaginationArgs({
      filters:  [labelFilter, annotationFilter, clusterFilter],
      page:     1,
      pageSize: 1,
    }),
    transient:   true,
    saveCountAs: SAVED_COUNTS.PROJECT_SCOPED_SECRETS,
  };
}
