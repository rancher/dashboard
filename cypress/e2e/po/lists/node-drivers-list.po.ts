import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

export default class NodeDriversListPo extends BaseResourceList {
  details(name: string, index: number) {
    return this.resourceTable().sortableTable().rowWithName(name).column(index);
  }

  activate() {
    return cy.getId('sortable-table-activate');
  }

  deactivate() {
    return cy.getId('sortable-table-deactivate');
  }
}
