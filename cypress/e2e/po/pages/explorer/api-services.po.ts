import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

export class APIServicesPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/apiregistration.k8s.io.apiservice`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(APIServicesPagePo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(APIServicesPagePo.createPath(clusterId));
  }

  waitForRequests() {
    cy.pathWithDefaultSteveParams(
      '/v1/apiregistration.k8s.io.apiservices',
      {
        queryParams: ['page=1', 'pagesize=100', 'sort=metadata.name'],
        blockList:   ['pagesize'],
        sspEnabled:  true,
        isList:      true,
      }).then((url) => {
      APIServicesPagePo.goToAndWaitForGet(this.goTo.bind(this), [
        url
      ]);
    });
  }

  resourcesList() {
    return new BaseResourceList(this.self());
  }

  sortableTable() {
    return this.resourcesList().resourceTable().sortableTable();
  }

  title() {
    return this.resourcesList().masthead().title();
  }
}
