import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import LabeledSelectPo from '~/cypress/e2e/po/components/labeled-select.po';

export class SecretsListPagePo extends BaseListPagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/secret`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(SecretsListPagePo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(SecretsListPagePo.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();
    const sideNav = new ProductNavPo();

    burgerMenu.goToCluster(clusterId);
    sideNav.navToSideMenuGroupByLabel('Storage');
    sideNav.navToSideMenuEntryByLabel('Secrets');
  }

  clickTab(name: string) {
    new TabbedPo().clickTabWithName(name);
  }

  title() {
    return this.self().get('.title h1').invoke('text');
  }

  createButton() {
    return this.self().get('[data-testid="secrets-list-create');
  }

  createButtonTitle() {
    return this.createButton().invoke('text');
  }

  list() {
    return new BaseResourceList('[data-testid="sortable-table-list-container"]');
  }

  sortableTable() {
    return this.list().resourceTable().sortableTable();
  }
}

export class SecretsCreateEditPo extends BaseDetailPagePo {
  private static createPath(clusterId: string, namespace?: string, id?: string ) {
    const root = `/c/${ clusterId }/explorer/secret`;

    return id ? `${ root }/${ namespace }/${ id }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId: string, namespace?: string, id?: string) {
    super(SecretsCreateEditPo.createPath(clusterId, namespace, id));
  }

  selectSecretSubtype(subtype: string) {
    return this.self().get(`[data-testid="subtype-banner-item-${ subtype }"]`);
  }

  projectSelect() {
    return new LabeledSelectPo('[data-testid="secret-project-select"]');
  }

  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  basicAuthUsernameInput() {
    return new LabeledInputPo('[data-testid="secret-basic-username"]');
  }

  saveOrCreate(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }
}
