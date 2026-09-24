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

  badge(clusterName: string) {
    return this.resourceTable().sortableTable().rowWithName(clusterName).column(2);
  }

  name(clusterName: string) {
    return this.resourceTable().sortableTable().rowWithName(clusterName).column(3);
  }

  version(clusterName: string) {
    return this.resourceTable().sortableTable().rowWithName(clusterName).column(5);
  }

  provider(clusterName: string) {
    return this.resourceTable().sortableTable().rowWithName(clusterName)
      .self()
      .find('.col-cluster-provider');
  }

  providerSubType(clusterName: string) {
    return this.resourceTable().sortableTable().rowWithName(clusterName)
      .self()
      .find('.col-cluster-provider .text-muted');
  }

  machines(clusterName: string) {
    return this.resourceTable().sortableTable().rowWithName(clusterName)
      .get('.col-machine-summary-graph');
  }

  explore(clusterName: string) {
    return this.resourceTable().sortableTable().rowWithName(clusterName)
      .get('[data-testid="cluster-manager-list-explore-management"]');
  }

  pin(clusterName: string) {
    return this.resourceTable().sortableTable().rowWithName(clusterName)
      .self()
      .find('[data-testid="cluster-row-pin"]');
  }

  actionMenu(clusterName: string) {
    return this.resourceTable().sortableTable().rowActionMenuOpen(clusterName);
  }
}
