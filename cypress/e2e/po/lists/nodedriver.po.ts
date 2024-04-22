import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

export default class NodeDriversListPo extends BaseResourceList {
  create() {
    return this.masthead().actions().eq(0).click();
  }

  deactivate() {
    return cy.getId('sortable-table-deactivate');
  }

  activate() {
    return cy.getId('sortable-table-activate');
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
