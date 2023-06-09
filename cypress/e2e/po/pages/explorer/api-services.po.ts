import PagePo from '@/cypress/e2e/po/pages/page.po';

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
}
