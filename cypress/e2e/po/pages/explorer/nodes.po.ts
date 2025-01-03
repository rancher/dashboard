import PagePo from '@/cypress/e2e/po/pages/page.po';
import NodesListPo from '@/cypress/e2e/po/lists/nodes-list.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';

export class NodesPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/node`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(NodesPagePo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(NodesPagePo.createPath(clusterId));
  }

  nodesList(): NodesListPo {
    return new NodesListPo('[data-testid="sortable-table-list-container"]');
  }

  goToDetailsPage(elemName: string) {
    const resourceTable = new ResourceTablePo(this.self());

    return resourceTable.sortableTable().detailsPageLinkWithName(elemName).click();
  }
}
