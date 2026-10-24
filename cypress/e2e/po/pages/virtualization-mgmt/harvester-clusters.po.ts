import PagePo from '@/cypress/e2e/po/pages/page.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import { GetOptions } from '@/cypress/e2e/po/components/component.po';

export class HarvesterClusterPagePo extends PagePo {
  private static readonly UPDATE_OR_INSTALL_BUTTON = '[data-testid="action-button-async-button"]';

  // Shown in place of the install button when the automatic install has failed.
  private static readonly MANUAL_INSTALL_STEPS = '.extension-info .steps';

  // Shown, with neither the install button nor the manual steps, when the install looked up the chart
  // before the repository index listed it.
  private static readonly MISSING_VERSION_WARNING = 'Could not find a compatible version';

  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/harvesterManager/harvesterhci.io.management.cluster`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(HarvesterClusterPagePo.createPath(clusterId));
  }

  constructor(private clusterId = '_') {
    super(HarvesterClusterPagePo.createPath(clusterId));
  }

  static navTo(productLabel = 'Virtualization Management') {
    BurgerMenuPo.burgerMenuNavToMenubyLabel(productLabel);
  }

  masthead() {
    return new BaseResourceList(this.self()).masthead();
  }

  title() {
    return this.masthead().title();
  }

  importHarvesterClusterButton(options?: GetOptions) {
    return this.masthead().actions(options);
  }

  list(): BaseResourceList {
    return new BaseResourceList('[data-testid="sortable-table-list-container"]');
  }

  extensionWarning(options?: GetOptions) {
    return this.self().get('.extension-warning', options);
  }

  harvesterLogo() {
    return this.self().get('div.logo');
  }

  harvesterTagline() {
    return this.self().get('div.tagline');
  }

  updateOrInstallButton(): AsyncButtonPo {
    return new AsyncButtonPo(HarvesterClusterPagePo.UPDATE_OR_INSTALL_BUTTON, this.self());
  }

  /**
   * Whether the page shows that the automatic install failed: either the manual install steps are shown in
   * place of the install button, or no compatible version was found. Does not retry, so a caller can poll it.
   */
  isInstallAbandoned(): Cypress.Chainable<boolean> {
    return this.self().then(($page) => $page.find(HarvesterClusterPagePo.MANUAL_INSTALL_STEPS).length > 0 ||
      $page.find('.extension-warning').text().includes(HarvesterClusterPagePo.MISSING_VERSION_WARNING));
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
