import PagePo from '@/cypress/e2e/po/pages/page.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';

export default class NamespaceCreateEditPagePo extends PagePo {
  private static createPath(clusterId: string, nsName?: string ) {
    const root = `/c/${ clusterId }/explorer/namespace`;

    return nsName ? `${ root }/${ nsName }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = '_', nsName?: string) {
    super(NamespaceCreateEditPagePo.createPath(clusterId, nsName));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuEntryByLabel('Projects/Namespaces');
  }
}
