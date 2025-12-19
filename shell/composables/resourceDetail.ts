import { inject, provide } from 'vue';

const IS_IN_RESOURCE_DETAIL_PAGE_KEY = 'isInResourceDetailKey';

/**
 * Used to determine if the current component was instantiated as an ancestor of a ResourceDetail.
 * @returns true if the component is an ancestor of ResourceDetail, otherwise false
 */
export function useIsInResourceDetailPage() {
  return inject(IS_IN_RESOURCE_DETAIL_PAGE_KEY, false);
}

export function useResourceDetailPageProvider() {
  provide(IS_IN_RESOURCE_DETAIL_PAGE_KEY, true);
}
