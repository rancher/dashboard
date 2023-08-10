import { STATE, NAME as NAME_COL, NAMESPACE as NAMESPACE_COL, AGE } from '@shell/config/table-headers';

export const STEVE_NAME_COL = {
  ...NAME_COL,
  value:  'metadata.name',
  sort:   ['metadata.name'],
  search: 'metadata.name',
};

export const STEVE_STATE_COL = {
  ...STATE,
  value:     'metadata.state.name',
  sort:      ['metadata.state.name'],
  search:    'metadata.state.name',
  formatter: null
};

export const STEVE_AGE_COL = {
  ...AGE,
  value:  'metadata.creationTimestamp',
  sort:   'metadata.creationTimestamp:desc',
  search: false,
};

export const STEVE_NAMESPACE_COL = {
  ...NAMESPACE_COL,
  value:  'metadata.namespace',
  sort:   'metadata.namespace',
  search: 'metadata.namespace',
};

export const STEVE_LIST_GROUPS = [{
  tooltipKey: 'resourceTable.groupBy.none',
  icon:       'icon-list-flat',
  value:      'none',
}, {
  icon:       'icon-folder',
  value:      'metadata.namespace',
  field:      'metadata.namespace',
  hideColumn: NAMESPACE_COL.name,
  tooltipKey: 'resourceTable.groupBy.namespace'
}];

// TODO: RC TODO (can be later than alpha)
// - loading indicator when pages are being requests (take care not to blip)
// - performance setting (global enable / disable)
// - improve - the list group by feature adds a namespace option if resource is namespaced. we replace this with config for paths via `listGroupsWillOverride`. this isn't so neat
// - improve - there's a lot of computed properties in sortable table that fire when things happen in store. need to avoid these

// TODO: RC TODO (should be part of alpha)
// - we re-fetch the list when we return to the page. this means the list is updated, but user has to wait for http request again. alt is
// - update comments... everywhere
// - remove debug consoles
// - there are two subscribe messages sent for the list's type

// TODO: RC Comment
// - only applies to
//   - cluster store. management store should in theory be simple to support (TODO: RC add to gh issue)
//   - resources that don't have their own custom list. this should be easy to resolve though
//   - specifically configmaps and secrets. other resources can be incrementally added
// - sorting / filtering
//   - we cannot sort or filter by anything that is computed locally (model getters).
//     - state - we convert some `metadata.state.name` values to something more readable
//     - secret - subTypeDisplay - translates things like `kubernetes.io/service-account-token` to `Svc Acct Token`
//     - configmaps - data - we convert data from two properties into something more readable
// - Design / Patterns
//   - We can only sort and filter by values known to the backend. Therefore a lot of the existing table headers, which reference model properties
//     are invalid. To get around this we define new headers which refer directly to properties on the raw resource. see pagination-table-headers
//     this means we avoid things like `name` & `namespace` property helpers, searchFields that are functions to values, etc
//   - the revision of the list is ignored. when user goes to page two it will be page 2 at that new time (rather than from the time page 1 was requested)
//   - Question. the only way for a user to update their page is to change pagination in some way. we should consider a refresh button

// TODO: RC Backend / API Issues
// - configmaps
//   - different `count` provided when adding/removing `sort=-metadata.namespace`
//     - configmaps?page=1&pagesize=10&sort=-metadata.namespace,-metadata.name,-id&filter=metadata.name=kube. count:14
//     - configmaps?page=2&pagesize=10&sort=-metadata.namespace,-metadata.name,-id&filter=metadata.name=kube. count:14
//     - configmaps?page=1&pagesize=10&sort=-metadata.name,-id&filter=metadata.name=kube,metadata.namespace=kube. count:18
//     - configmaps?page=2&pagesize=10&sort=-metadata.name,-id&filter=metadata.name=kube,metadata.namespace=kube. count:18
// - secrets
//   - the resource has a `_type` field, yet `sort=_type` does not work
//   - the resource has a `_type` field, yet `filter_type` does not work

// TODO: RC Test cases
// - group by namespace / no namespace
// - group by namespace sticks on refresh
// - the hideSystemResources product config (determines namespaces used in filters)
// - the pref ALL_NAMESPACES (determines namespaces used in filters)
// - TODO: RC flesh out
// - no regressions in separate namespace/project filtering
// - with advanced filtering on
