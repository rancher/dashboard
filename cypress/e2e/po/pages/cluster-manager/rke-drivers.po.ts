import PagePo from '@/cypress/e2e/po/pages/page.po';
import EmberSortableTablePo from '@/cypress/e2e/po/components/ember/ember-sortable-table.po';
import EmberSelectPo from '@/cypress/e2e/po/components/ember/ember-select.po';
import EmberModalClusterDriverPo from '@/cypress/e2e/po/components/ember/ember-modal-add-edit-cluster-driver.po';
import EmberModalNodeDriverPo from '@/cypress/e2e/po/components/ember/ember-modal-add-edit-node-driver.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
export default class RkeDriversPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/pages/rke-drivers`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(RkeDriversPagePo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(RkeDriversPagePo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Cluster Management');
    sideNav.navToSideMenuEntryByLabel('Drivers');
  }

  list(): EmberSortableTablePo {
    return new EmberSortableTablePo('table.grid.sortable-table');
  }

  refreshKubMetadata() {
    return cy.iFrame().contains('.right-buttons .btn', 'Refresh Kubernetes Metadata');
  }

  addClusterDriver() {
    return cy.iFrame().contains('.right-buttons .btn', 'Add Cluster Driver');
  }

  addNodeDriver() {
    return cy.iFrame().contains('.right-buttons .btn', 'Add Node Driver');
  }

  createEditClusterDriver(): EmberModalClusterDriverPo {
    return new EmberModalClusterDriverPo();
  }

  createEditNodeDriver(): EmberModalNodeDriverPo {
    return new EmberModalNodeDriverPo();
  }

  /**
   * Get tab by name
   * @param tabName Cluster Drivers or Node Drivers
   * @returns
   */
  tabs(tabName: string) {
    return cy.iFrame().contains('.tab-nav li', tabName);
  }

  actionMenu(): EmberSelectPo {
    return new EmberSelectPo('.ember-basic-dropdown-content');
  }
}
