import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

/**
 * List component for provisioning.cattle.io.cluster resources
 */
export default class ProvClusterListPo extends BaseResourceList {
  openBulkActionDropdown() {
    return this.resourceTable().sortableTable().bulkActionDropDownOpen();
  }

  bulkActionButton(name: string) {
    return this.resourceTable().sortableTable().bulkActionDropDownButton(name);
  }

  downloadKubeConfig() {
    return cy.getId('sortable-table-downloadKubeConfig');
  }

  details(name: string, index: number) {
    return this.resourceTable().sortableTable().rowWithName(name).column(index);
  }

  state(clusterName: string) {
    return this.resourceTable().sortableTable().rowWithName(clusterName).column(1);
  }

  name(clusterName: string) {
    return this.resourceTable().sortableTable().rowWithName(clusterName).column(2);
  }

  version(clusterName: string) {
    return this.resourceTable().sortableTable().rowWithName(clusterName).column(3);
  }

  provider(clusterName: string) {
    return this.resourceTable().sortableTable().rowWithName(clusterName).column(4);
  }

  providerSubType(clusterName: string) {
    return this.resourceTable().sortableTable().rowWithName(clusterName).column(4)
      .find(`.text-muted`);
  }

  machines(clusterName: string) {
    return this.resourceTable().sortableTable().rowWithName(clusterName).column(5);
  }

  explore(clusterName: string) {
    return this.resourceTable().sortableTable().rowWithName(clusterName).column(7)
      .find('.btn');
  }

  actionMenu(clusterName: string) {
    return this.resourceTable().sortableTable().rowActionMenuOpen(clusterName);
  }
}
