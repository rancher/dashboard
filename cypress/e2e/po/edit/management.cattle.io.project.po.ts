import PagePo from '@/cypress/e2e/po/pages/page.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { SharedComponentsPo } from '@/cypress/e2e/po/components/shared-components/shared-components.po';
import GenericPrompt from '@/cypress/e2e/po/prompts/genericPrompt.po';

export default class ProjectCreateEditPagePo extends PagePo {
  private static createPath(clusterId: string, projName?: string ) {
    const root = `/c/${ clusterId }/explorer/management.cattle.io.project`;

    return projName ? `${ root }/${ projName }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = '_', projName?: string) {
    super(ProjectCreateEditPagePo.createPath(clusterId, projName));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuEntryByLabel('Projects/Namespaces');
  }

  sharedComponents() {
    return new SharedComponentsPo(this.self());
  }

  tabResourceQuotas() {
    return this.self().getId('btn-resource-quotas');
  }

  btnAddResource() {
    return this.self().getId('array-list-button');
  }

  inputProjectLimit() {
    return new LabeledInputPo(cy.get('[data-testid="projectrow-project-quota-input"]'));
  }

  inputNamespaceDefaultLimit() {
    return new LabeledInputPo(cy.get('[data-testid="projectrow-namespace-quota-input"]'));
  }

  tabContainerDefaultResourceLimit() {
    return this.self().getId('btn-container-default-resource-limit');
  }

  inputCpuReservation() {
    return new LabeledInputPo(cy.get('[data-testid="cpu-reservation"]'));
  }

  inputMemoryReservation() {
    return new LabeledInputPo(cy.get('[data-testid="memory-reservation"]'));
  }

  inputCpuLimit() {
    return new LabeledInputPo(cy.get('[data-testid="cpu-limit"]'));
  }

  inputMemoryLimit() {
    return new LabeledInputPo(cy.get('[data-testid="memory-limit"]'));
  }

  bannerError(n: number) {
    return this.self().getId(`error-banner${ n }`);
  }

  addProjectMemberButton() {
    return cy.get('[data-testid="add-item"]');
  }

  addProjectMemberModal(): GenericPrompt {
    return new GenericPrompt(this.self());
  }
}
