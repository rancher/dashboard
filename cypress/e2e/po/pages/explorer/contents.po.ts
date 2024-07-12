import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

export class ContentsPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/fleet.cattle.io.content`;
  }

  urlPath(clusterId = 'local') {
    return ContentsPagePo.createPath(clusterId);
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ContentsPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(ContentsPagePo.createPath(clusterId));
  }

  list() {
    return new BaseResourceList(this.self());
  }

  clickCreate() {
    return this.list().masthead().createYaml();
  }
}
