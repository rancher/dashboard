import BaseResourceList from '~/cypress/e2e/po/lists/base-resource-list.po';

/**
 * List component for catalog.cattle.io.clusterrepo resources
 */
export default class AppRepoListPo extends BaseResourceList {
  actionMenu(repoName: string) {
    return this.resourceTable().sortableTable().rowActionMenuOpen(repoName, 7);
  }
}
