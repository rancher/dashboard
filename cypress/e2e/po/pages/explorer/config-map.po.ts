import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import InputPo from '@/cypress/e2e/po/components/input.po';
import CodeMirrorPo from '@/cypress/e2e/po/components/code-mirror.po';
export class ConfigMapListPagePo extends BaseListPagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/configmap`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ConfigMapListPagePo.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();
    const sideNav = new ProductNavPo();

    burgerMenu.goToCluster(clusterId);
    sideNav.navToSideMenuGroupByLabel('Storage');
    sideNav.navToSideMenuEntryByLabel('ConfigMaps');
  }

  constructor(clusterId = 'local') {
    super(ConfigMapListPagePo.createPath(clusterId));
  }

  searchForConfigMap(name: string) {
    this.list().resourceTable().sortableTable().filter(name);

    return cy.url().should('include', `q=${ name }`);
  }
}

export class ConfigMapCreateEditPagePo extends BaseDetailPagePo {
  private static createPath(clusterId: string, namespace?: string, id?: string ) {
    const root = `/c/${ clusterId }/explorer/configmap`;

    return id ? `${ root }/${ namespace }/${ id }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = 'local', namespace?: string, id?: string) {
    super(ConfigMapCreateEditPagePo.createPath(clusterId, namespace, id));
  }

  keyInput() {
    return InputPo.bySelector(this.self(), '[data-testid="input-kv-item-key-0"]');
  }

  valueInput() {
    return CodeMirrorPo.bySelector(this.self(), '[data-testid="code-mirror-multiline-field"]');
  }
}
