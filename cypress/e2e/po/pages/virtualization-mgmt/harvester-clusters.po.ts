import PagePo from '@/cypress/e2e/po/pages/page.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';

export class HarvesterClusterPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/harvesterManager/harvesterhci.io.management.cluster`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(HarvesterClusterPagePo.createPath(clusterId));
  }

  constructor(private clusterId = '_') {
    super(HarvesterClusterPagePo.createPath(clusterId));
  }

  static navTo() {
    BurgerMenuPo.burgerMenuNavToMenubyLabel('Virtualization Management');
  }

  masthead() {
    return new BaseResourceList(this.self()).masthead();
  }

  title() {
    return this.masthead().title();
  }

  importHarvesterClusterButton() {
    return this.masthead().actions();
  }

  list(): BaseResourceList {
    return new BaseResourceList('[data-testid="sortable-table-list-container"]');
  }

  extensionWarning() {
    return this.self().get('.extension-warning');
  }

  harvesterLogo() {
    return this.self().get('div.logo');
  }

  harvesterTagline() {
    return this.self().get('div.tagline');
  }

  updateOrInstallButton(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="action-button-async-button"]', this.self());
  }

  createHarvesterClusterForm(namespace?: string, id?: string): HarvesterClusterCreateEditPo {
    return new HarvesterClusterCreateEditPo(this.clusterId, namespace, id);
  }
}
export class HarvesterClusterCreateEditPo extends PagePo {
  private static createPath(clusterId: string, namespace?: string, id?: string ) {
    const root = `/c/${ clusterId }/harvesterManager/harvesterhci.io.management.cluster`;

    return id ? `${ root }/${ namespace }/${ id }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = '_', namespace?: string, id?: string) {
    super(HarvesterClusterCreateEditPo.createPath(clusterId, namespace, id));
  }

  resourceDetail() {
    return new ResourceDetailPo(this.self());
  }

  masthead() {
    return new BaseResourceList(this.self()).masthead();
  }

  title() {
    return this.masthead().title();
  }

  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  tabs() {
    return new TabbedPo('[data-testid="tabbed"]');
  }

  memberRolesTab() {
    return this.tabs().clickTabWithSelector('[data-testid="memberRoles"]');
  }
}

export class HarvesterClusterDetailsPo extends PagePo {
  private static createPath(clusterId: string, namespace: string, id: string ) {
    return `/c/${ clusterId }/harvesterManager/harvesterhci.io.management.cluster/${ namespace }/${ id }`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = '_', namespace = 'fleet-default', id: string) {
    super(HarvesterClusterDetailsPo.createPath(clusterId, namespace, id));
  }

  masthead() {
    return new BaseResourceList(this.self()).masthead();
  }

  title() {
    return this.masthead().title();
  }
}
