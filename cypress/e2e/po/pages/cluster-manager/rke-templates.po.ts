import PagePo from '@/cypress/e2e/po/pages/page.po';
import EmberSortableTablePo from '@/cypress/e2e/po/components/ember/ember-sortable-table.po';
import EmberSelectPo from '@/cypress/e2e/po/components/ember/ember-select.po';
import EmberFormRkeTemplatesPo from '@/cypress/e2e/po/components/ember/ember-form-rke-templates.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

export default class RkeTemplatesPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/pages/rke-templates`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(RkeTemplatesPagePo.createPath(clusterId));
  }

  constructor(clusterId = '_') {
    super(RkeTemplatesPagePo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Cluster Management');
    sideNav.groups().contains('RKE1 Configuration').click();
    sideNav.navToSideMenuEntryByLabel('RKE Templates');
  }

  addTemplate() {
    return cy.iFrame().contains('.right-buttons .btn', 'Add Template');
  }

  groupRow(): EmberSortableTablePo {
    return new EmberSortableTablePo('table.sortable-table .group-row');
  }

  mainRow(): EmberSortableTablePo {
    return new EmberSortableTablePo('table.sortable-table .main-row');
  }

  actionMenu(): EmberSelectPo {
    return new EmberSelectPo('.ember-basic-dropdown-content');
  }

  form(): EmberFormRkeTemplatesPo {
    return new EmberFormRkeTemplatesPo('form.horizontal-form');
  }
}
