import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

/**
 * List component for fleet.cattle.io.clustergroup resources
 */
export default class FleetClusterGroupsList extends BaseResourceList {
  details(name: string, index: number) {
    return this.resourceTable().sortableTable().rowWithName(name).column(index);
  }
}
