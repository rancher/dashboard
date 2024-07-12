import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

export class ServiceAccountsPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/serviceaccount`;
  }

  urlPath(clusterId = 'local') {
    return ServiceAccountsPagePo.createPath(clusterId);
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ServiceAccountsPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(ServiceAccountsPagePo.createPath(clusterId));
  }

  list() {
    return new BaseResourceList(this.self());
  }

  clickCreate() {
    return this.list().masthead().create();
  }
}
