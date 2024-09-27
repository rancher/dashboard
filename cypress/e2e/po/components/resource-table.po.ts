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
}
