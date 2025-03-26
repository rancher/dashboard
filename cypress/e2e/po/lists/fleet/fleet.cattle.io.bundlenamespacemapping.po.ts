import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

/**
 * List component for fleet.cattle.io.bundlenamespacemapping resources
 */
export default class FleetBundleNamespaceMappingList extends BaseResourceList {
  details(name: string, index: number) {
    return this.resourceTable().sortableTable().rowWithName(name).column(index);
  }
}
