import PagePo from '@/cypress/e2e/po/pages/page.po';
import CloudCredentialsCreateEditPo from '@/cypress/e2e/po/edit/cloud-credentials-amazon.po';
import CloudCredentialsListPo from '@/cypress/e2e/po/lists/cloud-credentials-list.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

export default class CloudCredentialsPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/cloudCredential`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(CloudCredentialsPagePo.createPath(clusterId));
  }

  constructor(private clusterId = '_') {
    super(CloudCredentialsPagePo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Cluster Management');
    sideNav.navToSideMenuEntryByLabel('Cloud Credentials');
  }

  create() {
    return this.list().masthead().actions().contains('Create')
      .click();
  }

  createEditCloudCreds(id?: string): CloudCredentialsCreateEditPo {
    return new CloudCredentialsCreateEditPo(this.clusterId, id);
  }

  list(): CloudCredentialsListPo {
    return new CloudCredentialsListPo('[data-testid="sortable-table-list-container"]');
  }
}
