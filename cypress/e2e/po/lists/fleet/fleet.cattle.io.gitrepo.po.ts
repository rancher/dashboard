import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

/**
 * List component for fleet.cattle.io.gitrepo resources
 */
export default class FleetGitRepoList extends BaseResourceList {
  create() {
    return this.masthead().actions().eq(0).click();
  }

  details(name: string, index: number) {
    return this.resourceTable().sortableTable().rowWithName(name).column(index);
  }
}
