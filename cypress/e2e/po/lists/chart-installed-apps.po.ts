import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

/**
 * List component for Installed Apps page
 */
export default class ChartInstalledAppsListPo extends BaseResourceList {
  state(name: string) {
    return this.resourceTable().sortableTable().rowWithName(name).column(1);
  }

  name(name: string) {
    return this.resourceTable().sortableTable().rowWithName(name).column(2);
  }

  chart(name: string) {
    return this.resourceTable().sortableTable().rowWithName(name).column(4);
  }
}
