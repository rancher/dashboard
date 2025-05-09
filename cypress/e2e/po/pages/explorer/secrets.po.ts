import PagePo from '@/cypress/e2e/po/pages/page.po';
import SecretsListPo from '@/cypress/e2e/po/lists/secrets-list.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import { SharedComponentsPo } from '@/cypress/e2e/po/components/shared-components/shared-components.po';

export class SecretsPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/secret`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(SecretsPagePo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(SecretsPagePo.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();
    const sideNav = new ProductNavPo();

    burgerMenu.goToCluster(clusterId);
    sideNav.navToSideMenuGroupByLabel('Storage');
    sideNav.navToSideMenuEntryByLabel('Secrets');
  }

  sharedComponents() {
    return new SharedComponentsPo(this.self());
  }

  secretsList(): SecretsListPo {
    return new SecretsListPo('[data-testid="sortable-table-list-container"]');
  }
}
