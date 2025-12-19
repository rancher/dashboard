import { inject, provide } from 'vue';
const IS_IN_RESOURCE_EDIT_PAGE_KEY = 'isInResourceEditKey';
const IS_IN_RESOURCE_CREATE_PAGE_KEY = 'isInResourceCreateKey';

/**
 * Used to determine if the current component was instantiated as an ancestor of a CruResource EDIT page.
 * @returns true if the component is an ancestor of CruResource EDIT page, otherwise false
 */
export function useIsInResourceEditPage() {
  return inject(IS_IN_RESOURCE_EDIT_PAGE_KEY, false);
}

/**
 * Used to determine if the current component was instantiated as an ancestor of a CruResource CREATE page.
 * @returns true if the component is an ancestor of CruResource CREATE page, otherwise false
 */
export function useIsInResourceCreatePage() {
  return inject(IS_IN_RESOURCE_CREATE_PAGE_KEY, false);
}

export function useResourceEditPageProvider() {
  provide(IS_IN_RESOURCE_EDIT_PAGE_KEY, true);
}

export function useResourceCreatePageProvider() {
  provide(IS_IN_RESOURCE_CREATE_PAGE_KEY, true);
}
