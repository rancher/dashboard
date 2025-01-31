import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { WorkspaceSwitcherPo } from '@/cypress/e2e/po/components/workspace-switcher.po';
import { ImportYamlPo } from '@/cypress/e2e/po/components/import-yaml.po';
import Kubectl from '@/cypress/e2e/po/components/kubectl.po';
import { NamespaceFilterPo } from '@/cypress/e2e/po/components/namespace-filter.po';

export class HeaderPo extends ComponentPo {
  constructor() {
    super('[data-testid="header"]');
  }

  projectNamespaceFilter() {
    return new NamespaceFilterPo();
  }

  selectNamespaceFilterOption(singleOption: string) {
    this.projectNamespaceFilter().toggle();
    this.projectNamespaceFilter().clickOptionByLabel(singleOption);
    this.projectNamespaceFilter().isChecked(singleOption);
    this.projectNamespaceFilter().toggle();
  }

  selectWorkspace(name: string) {
    const wsFilter = new WorkspaceSwitcherPo();

    wsFilter.toggle();

    return wsFilter.clickOptionWithLabel(name);
  }

  checkCurrentWorkspace(name: string) {
    const wsFilter = new WorkspaceSwitcherPo();

    return wsFilter.checkOptionSelected(name);
  }

  importYamlHeaderAction() {
    return this.self().find('[data-testid="header-action-import-yaml"]');
  }

  importYaml() {
    return new ImportYamlPo();
  }

  clusterIcon() {
    return this.self().find('.cluster-icon');
  }

  clusterName() {
    return this.self().find('.cluster-name');
  }

  customBadge() {
    return this.self().find('.cluster-badge');
  }

  kubectlShell() {
    return new Kubectl();
  }

  kubectlExplain() {
    return this.self().find('[data-testid="extension-header-action-kubectl-explain.action"]');
  }

  downloadKubeconfig(): Cypress.Chainable {
    return cy.get('[data-testid="btn-download-kubeconfig"]');
  }

  copyKubeconfig(): Cypress.Chainable {
    return cy.get('[data-testid="btn-copy-kubeconfig"]');
  }

  copyKubeConfigCheckmark(): Cypress.Chainable {
    return cy.get('.header-btn-active');
  }

  showKubectlExplainTooltip(): Cypress.Chainable {
    return this.kubectlExplain().trigger('mouseenter');
  }

  getKubectlExplainTooltipContent(): Cypress.Chainable {
    return cy.get('.v-popper--theme-tooltip .v-popper__inner');
  }

  resourceSearchButton(): Cypress.Chainable {
    return cy.get('[data-testid="header-resource-search"]');
  }
}
