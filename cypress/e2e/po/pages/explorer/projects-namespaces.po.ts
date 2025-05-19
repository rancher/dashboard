import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import GenericPrompt from '@/cypress/e2e/po/prompts/genericPrompt.po';
import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';
import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';

export class ProjectsNamespacesListPagePo extends BaseListPagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/projectsnamespaces`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ProjectsNamespacesListPagePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(ProjectsNamespacesListPagePo.createPath(clusterId));
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    sideNav.navToSideMenuEntryByLabel('Projects/Namespaces');
  }

  createNamespaceButton() {
    return this.self().get('[data-testid="create_project_namespaces"]');
  }
}

export class ProjectCreateEditPagePo extends BaseDetailPagePo {
  private static createPath(clusterId: string, projName?: string ) {
    const root = `/c/${ clusterId }/explorer/management.cattle.io.project`;

    return projName ? `${ root }/${ projName }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = 'local', projName?: string) {
    super(ProjectCreateEditPagePo.createPath(clusterId, projName));
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
    return this.self().get('[data-testid="add-item"]');
  }

  addProjectMemberModal(): GenericPrompt {
    return new GenericPrompt(this.self());
  }
}

export class NamespaceCreateEditPagePo extends BaseDetailPagePo {
  private static createPath(clusterId: string, nsName?: string ) {
    const root = `/c/${ clusterId }/explorer/namespace`;

    return nsName ? `${ root }/${ nsName }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = 'local', nsName?: string) {
    super(NamespaceCreateEditPagePo.createPath(clusterId, nsName));
  }
}
