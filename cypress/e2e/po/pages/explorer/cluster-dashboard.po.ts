import PagePo from '@/cypress/e2e/po/pages/page.po';

export default class ClusterDashboardPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterDashboardPagePo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(ClusterDashboardPagePo.createPath(clusterId));
  }
}
