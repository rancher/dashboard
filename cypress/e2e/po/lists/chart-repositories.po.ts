import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

/**
 * List component for catalog.cattle.io.clusterrepo resources
 */
export default class ChartRepositoriesListPo extends BaseResourceList {
  actionMenu(repoName: string) {
    return this.resourceTable().sortableTable().rowActionMenuOpen(repoName);
  }

  openBulkActionDropdown() {
    return this.resourceTable().sortableTable().bulkActionDropDownOpen();
  }

  bulkActionButton(name: string) {
    return this.resourceTable().sortableTable().bulkActionDropDownButton(name);
  }

  details(name: string, index: number) {
    return this.resourceTable().sortableTable().rowWithName(name).column(index);
  }

  refreshRepo(repoName: string) {
    return this.resourceTable().sortableTable().rowActionMenuOpen(repoName).getMenuItem('Refresh')
      .click();
  }

  state(repoName: string) {
    return this.resourceTable().sortableTable().rowWithName(repoName).column(1);
  }
}
