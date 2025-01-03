import PagePo from '@/cypress/e2e/po/pages/page.po';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

export default class UiPluginsPagePo extends PagePo {
  static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/catalog.cattle.io.uiplugin`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(UiPluginsPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(UiPluginsPagePo.createPath(clusterId));
  }

  cacheState(name: string) {
    const resourceTable = new ResourceTablePo(this.self());

    return resourceTable.sortableTable().rowWithName(name).column(5);
  }

  goToDetailsPage(elemName: string) {
    const resourceTable = new ResourceTablePo(this.self());

    return resourceTable.sortableTable().detailsPageLinkWithName(elemName).click();
  }

  clickCreate() {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.masthead().create();
  }
}
