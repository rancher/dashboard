import ComponentPo, { GetOptions } from '@/cypress/e2e/po/components/component.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';

export class SharedComponentsPo extends ComponentPo {
  resourceTable(options?: GetOptions) {
    return new ResourceTablePo(this.self(options));
  }

  baseResourceList(options?: GetOptions) {
    return new BaseResourceList(this.self(options));
  }

  resourceDetail(options?: GetOptions) {
    return new ResourceDetailPo(this.self(options));
  }

  list() {
    return new BaseResourceList('[data-testid="sortable-table-list-container"]');
  }

  resourceTableDetails(name: string, index: number) {
    return this.baseResourceList().resourceTable().sortableTable().rowWithName(name)
      .column(index);
  }

  goToDetailsPage(elemName: string) {
    const resourceTable = new ResourceTablePo(this.self());

    return resourceTable.sortableTable().detailsPageLinkWithName(elemName).click();
  }
}
