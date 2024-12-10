import PagePo from '@/cypress/e2e/po/pages/page.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';

export class HorizontalPodAutoscalersPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/autoscaling.horizontalpodautoscaler`;
  }

  urlPath(clusterId = 'local') {
    return HorizontalPodAutoscalersPagePo.createPath(clusterId);
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(HorizontalPodAutoscalersPagePo.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();
    const sideNav = new ProductNavPo();

    burgerMenu.goToCluster(clusterId);
    sideNav.navToSideMenuGroupByLabel('Service Discovery');
    sideNav.navToSideMenuEntryByLabel('HorizontalPodAutoscalers');
  }

  constructor(clusterId = 'local') {
    super(HorizontalPodAutoscalersPagePo.createPath(clusterId));
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
}
