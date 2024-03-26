import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

/**
 * List component for feature flag list resources
 */

export default class MgmtFeatureFlagListPo extends BaseResourceList {
  elements() {
    return this.resourceTable().sortableTable().rowElements();
  }

  elementWithName(name: string) {
    return this.resourceTable().sortableTable().rowElementWithName(name);
  }

  details(name: string, index: number) {
    return this.resourceTable().sortableTable().rowWithName(name).column(index);
  }

  clickRowActionMenuItem(name: string, itemLabel:string) {
    return this.resourceTable().sortableTable().rowActionMenuOpen(name).getMenuItem(itemLabel)
      .click();
  }

  getRowActionMenuItem(name: string, itemLabel:string) {
    return this.resourceTable().sortableTable().rowActionMenuOpen(name).getMenuItem(itemLabel);
  }
}
