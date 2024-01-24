import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

export class ConfigMapPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/configmap`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ConfigMapPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(ConfigMapPagePo.createPath(clusterId));
  }

  clickCreate() {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.masthead().actions().eq(0).click();
  }

  listElementWithName(name:string) {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.resourceTable().sortableTable().rowElementWithName(name);
  }
}
