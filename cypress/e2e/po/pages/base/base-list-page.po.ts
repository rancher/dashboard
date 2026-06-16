import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

/**
 * Shared list-page behavior
 */
export abstract class BaseListPagePo extends PagePo {
  /**
   * Returns base resource list page object
   * @returns
   */
  baseResourceList() {
    return new BaseResourceList(this.self());
  }

  /**
   * Standard sortable list page object
   * @returns
   */
  list() {
    return new BaseResourceList('[data-testid="sortable-table-list-container"]');
  }

  /**
   * Returns a specific table column value for a row with the given name
   * @param name
   * @param index
   * @returns
   */
  resourceTableDetails(name: string, index: number) {
    return this.baseResourceList().resourceTable().resourceTableDetails(name, index);
  }

  /**
   * Navigates to the detail page for a given resource name
   * @param name
   * @param selector
   * @returns
   */
  goToDetailsPage(name: string, selector?: string) {
    return this.baseResourceList().resourceTable().goToDetailsPage(name, selector);
  }
}
