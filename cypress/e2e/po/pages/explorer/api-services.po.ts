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
    APIServicesPagePo.goToAndWaitForGet(this.goTo.bind(this), ['/v1/apiregistration.k8s.io.apiservices?exclude=metadata.managedFields']);
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
