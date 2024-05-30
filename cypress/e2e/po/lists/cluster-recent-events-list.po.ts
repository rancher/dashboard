import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

export default class ClusterRecentEventsListPo extends BaseResourceList {
  details(name: string, index: number) {
    return this.resourceTable().sortableTable().rowWithPartialName(name).column(index);
  }

  checkTableIsEmpty() {
    return this.resourceTable().sortableTable().rowWithPartialName('There are no rows to show.');
  }
}
