import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

export default class MachineSetsListPo extends BaseResourceList {
  bulkActionButton(name: string) {
    return this.resourceTable().sortableTable().bulkActionButton(name);
  }

  details(name: string, index: number) {
    return this.resourceTable().sortableTable().rowWithName(name).column(index);
  }
}
