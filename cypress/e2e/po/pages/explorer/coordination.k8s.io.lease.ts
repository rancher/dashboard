import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

export class LeasesPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/coordination.k8s.io.lease`;
  }

  urlPath(clusterId = 'local') {
    return LeasesPagePo.createPath(clusterId);
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(LeasesPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(LeasesPagePo.createPath(clusterId));
  }

  list() {
    return new BaseResourceList(this.self());
  }

  clickCreateYaml() {
    return this.list().masthead().createYaml();
  }

  listElementWithName(name: string) {
    return this.list().resourceTable().sortableTable().rowElementWithName(name);
  }
}
