import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

export default class ClusterSnapshotsListPo extends BaseResourceList {
  details(name: string, index: number) {
    return this.resourceTable().sortableTable().rowWithPartialName(name).column(index);
  }

  checkTableIsEmpty() {
    return this.resourceTable().sortableTable().checkRowCount(true, 1);
  }

  clickOnSnapshotNow() {
    return this.resourceTable().snapshotNowButton().click();
  }

  checkSnapshotExist(name: string) {
    return this.resourceTable().sortableTable().rowWithPartialName(name);
  }
}
