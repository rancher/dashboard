import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

/**
 * List component for api key resources
 */
export default class MgmtUsersListPo extends BaseResourceList {
  create() {
    return cy.get('[data-testid="masthead-create"]').click();
  }

  refreshGroupMembership(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="action-button-async-button"]', this.self());
  }

  deactivate() {
    return cy.getId('sortable-table-deactivate');
  }

  activate() {
    return cy.getId('sortable-table-activate');
  }

  openBulkActionDropdown() {
    return this.resourceTable().sortableTable().bulkActionDropDownOpen();
  }

  bulkActionButton(name: string) {
    return this.resourceTable().sortableTable().bulkActionDropDownButton(name);
  }

  selectAll() {
    return this.resourceTable().sortableTable().selectAllCheckbox();
  }

  elements() {
    return this.resourceTable().sortableTable().rowElements();
  }

  elementWithName(name: string) {
    return this.resourceTable().sortableTable().rowElementWithName(name);
  }

  details(name: string, index: number) {
    return this.resourceTable().sortableTable().rowWithName(name).column(index);
  }

  clickRowActionMenuItem(name: string, itemLabel:string) {
    return this.resourceTable().sortableTable().rowActionMenuOpen(name).getMenuItem(itemLabel)
      .click();
  }
}
