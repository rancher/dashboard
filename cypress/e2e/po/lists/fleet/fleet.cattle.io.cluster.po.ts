import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

/**
 * List component for fleet.cattle.io.cluster resources
 */
export default class FleetClusterList extends BaseResourceList {
  details(name: string, index: number) {
    return this.resourceTable().sortableTable().rowWithName(name).column(index);
  }

  subRows() {
    return this.resourceTable().sortableTable().subRows();
  }
}
