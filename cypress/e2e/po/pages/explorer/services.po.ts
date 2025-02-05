import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import ServicesCreateEditPo from '@/cypress/e2e/po/edit/services.po';

export class ServicesPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/service`;
  }

  urlPath(clusterId = 'local') {
    return ServicesPagePo.createPath(clusterId);
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ServicesPagePo.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();
    const sideNav = new ProductNavPo();

    burgerMenu.goToCluster(clusterId);
    sideNav.navToSideMenuGroupByLabel('Service Discovery');
    sideNav.navToSideMenuEntryByLabel('Service');
  }

  constructor(private clusterId = 'local') {
    super(ServicesPagePo.createPath(clusterId));
  }

  list() {
    return new BaseResourceList(this.self());
  }

  clickCreate() {
    return this.list().masthead().create();
  }

  createServicesForm(namespace?: string, id?: string): ServicesCreateEditPo {
    return new ServicesCreateEditPo(this.clusterId, namespace, id);
  }
}
