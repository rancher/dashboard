import ComponentPo from '@/cypress/e2e/po/components/component.po';
import SortableTablePo from '@/cypress/e2e/po/components/sortable-table.po';

export default class ResourceTablePo extends ComponentPo {
  sortableTable() {
    return new SortableTablePo(this.self());
  }

  downloadYamlButton() {
    return cy.getId('sortable-table-download');
  }

  snapshotNowButton() {
    return cy.get('[data-testid="action-button-async-button"').last();
  }

  /**
   * Returns a specific table column value for a row with the given name
   * @param name
   * @param index
   * @returns
   */
  resourceTableDetails(name: string, index: number) {
    return this.sortableTable().rowWithName(name)
      .column(index);
  }

  /**
   * Navigates to the detail page for a given resource name
   * @param name
   * @param selector
   * @returns
   */
  goToDetailsPage(name: string, selector?: string) {
    return this.sortableTable().detailsPageLinkWithName(name, selector)
      .click();
  }
}
