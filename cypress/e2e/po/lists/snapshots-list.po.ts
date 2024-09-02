import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

export default class SnapshotsListPo extends BaseResourceList {
  name(snapshotName: string) {
    return this.resourceTable().sortableTable().rowWithName(snapshotName).column(2);
  }

  selectAll() {
    return this.self().find('[data-testid="sortable-table_check_select_all"]').find('.checkbox-container').click();
  }

  delete() {
    return this.resourceTable().sortableTable().deleteButton().click();
  }
}
