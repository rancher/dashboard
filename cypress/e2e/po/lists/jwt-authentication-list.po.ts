import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

export default class JWTAuthenticationListPo extends BaseResourceList {
  details(name: string, index: number) {
    return this.resourceTable().sortableTable().rowWithName(name).column(index);
  }

  state(clusterName: string) {
    return this.resourceTable().sortableTable().rowWithName(clusterName).column(1);
  }

  activate() {
    return cy.getId('sortable-table-activate').click();
  }

  deactivate() {
    return cy.getId('sortable-table-deactivate').click();
  }

  clickRowActionMenuItem(name: string, itemLabel:string) {
    return this.resourceTable().sortableTable().rowActionMenuOpen(name).getMenuItem(itemLabel)
      .click();
  }

  getRowActionMenuItem(name: string, itemLabel:string) {
    return this.resourceTable().sortableTable().rowActionMenuOpen(name).getMenuItem(itemLabel);
  }
}
