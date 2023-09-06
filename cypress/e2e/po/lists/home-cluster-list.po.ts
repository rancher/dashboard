import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

/**
 * List component for home page cluster resources
 */
export default class HomeClusterListPo extends BaseResourceList {
  state(clusterName: string) {
    return this.resourceTable().sortableTable().rowWithName(clusterName).column(0);
  }

  name(clusterName: string) {
    return this.resourceTable().sortableTable().rowWithName(clusterName).column(1);
  }

  version(clusterName: string) {
    return this.resourceTable().sortableTable().rowWithName(clusterName).column(3);
  }

  provider(clusterName: string) {
    return this.resourceTable().sortableTable().rowWithName(clusterName).column(2);
  }
}
