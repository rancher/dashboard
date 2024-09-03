import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';

export class IngressPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/networking.k8s.io.ingress`;
  }

  urlPath(clusterId = 'local') {
    return IngressPagePo.createPath(clusterId);
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(IngressPagePo.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();
    const sideNav = new ProductNavPo();

    BurgerMenuPo.toggle();
    burgerMenu.clusters().contains(clusterId).click();
    sideNav.navToSideMenuGroupByLabel('Service Discovery');
    sideNav.navToSideMenuEntryByLabel('Ingresses');
  }

  constructor(clusterId = 'local') {
    super(IngressPagePo.createPath(clusterId));
  }

  list() {
    return new BaseResourceList(this.self());
  }

  clickCreate() {
    return this.list().masthead().create();
  }

  listElementWithName(name:string) {
    return this.list().resourceTable().sortableTable().rowElementWithName(name);
  }

  waitForIngressCreation(interceptName: string, nameToCheck: string, namespaceToCheck?: string) {
    cy.wait(`@${ interceptName }`, { requestTimeout: 20000 }).then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body.metadata).to.have.property('name', nameToCheck);

      if (namespaceToCheck) {
        expect(response?.body.metadata).to.have.property('namespace', namespaceToCheck);
      }

      cy.wait(5000); // eslint-disable-line cypress/no-unnecessary-waiting
    });
  }
}
