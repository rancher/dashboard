import PagePo from '@/cypress/e2e/po/pages/page.po';
import EmberSortableTablePo from '@/cypress/e2e/po/components/ember/ember-sortable-table.po';
import EmberSelectPo from '@/cypress/e2e/po/components/ember/ember-select.po';
import EmberAddPodSecurityTemplatePo from '@/cypress/e2e/po/components/ember/ember-form-pod-security-template.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

export default class PodSecurityPoliciesTemplatesPagePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/manager/pages/pod-security-policies`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(PodSecurityPoliciesTemplatesPagePo.createPath(clusterId));
  }

  constructor(clusterId = '_') {
    super(PodSecurityPoliciesTemplatesPagePo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Cluster Management');
    sideNav.groups().contains('Advanced').click();
    sideNav.navToSideMenuEntryByLabel('Pod Security Policy Templates');
  }

  addPodSecurityTemplateForm(): EmberAddPodSecurityTemplatePo {
    return new EmberAddPodSecurityTemplatePo('.container');
  }

  list(): EmberSortableTablePo {
    return new EmberSortableTablePo('.sortable-table');
  }

  addPolicyTemplate() {
    return cy.iFrame().contains('.right-buttons .btn', 'Add Policy Template');
  }

  bulkActions(label: string) {
    return cy.iFrame().contains('.bulk-actions', label);
  }

  actionMenu(): EmberSelectPo {
    return new EmberSelectPo('.ember-basic-dropdown-content');
  }

  // details view

  templateDescription(label: string) {
    return cy.iFrame().contains('.banner-message p', label);
  }
}
