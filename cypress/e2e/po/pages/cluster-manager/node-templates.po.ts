import PagePo from '@/cypress/e2e/po/pages/page.po';
import EmberSortableTablePo from '@/cypress/e2e/po/components/ember/ember-sortable-table.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import EmberModalAddNodeTemplateAwsPo from '@/cypress/e2e/po/components/ember/ember-modal-add-node-template-aws.po';

export default class NodeTemplatesPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/pages/node-templates`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(NodeTemplatesPagePo.createPath(clusterId));
  }

  constructor(clusterId = '_') {
    super(NodeTemplatesPagePo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Cluster Management');
    sideNav.groups().contains('RKE1 Configuration').click();
    sideNav.navToSideMenuEntryByLabel('Node Templates');
  }

  addNodeTemplateModal(): EmberModalAddNodeTemplateAwsPo {
    return new EmberModalAddNodeTemplateAwsPo();
  }

  list(): EmberSortableTablePo {
    return new EmberSortableTablePo('.sortable-table');
  }

  addTemplate() {
    return cy.iFrame().contains('.right-buttons .btn', 'Add Template');
  }
}
