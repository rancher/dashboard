import PagePo from '@/cypress/e2e/po/pages/page.po';
import APIServicesResourceList from '@/cypress/e2e/po/lists/cluster-explorer-api-services';

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

  resourcesList() {
    return new APIServicesResourceList('[data-testid="sortable-table-container"]');
  }
}
