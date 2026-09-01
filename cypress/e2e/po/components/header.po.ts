import ComponentPo from '@/cypress/e2e/po/components/component.po';
import { WorkspaceSwitcherPo } from '@/cypress/e2e/po/components/workspace-switcher.po';
import { ImportYamlPo } from '@/cypress/e2e/po/components/import-yaml.po';
import Kubectl from '@/cypress/e2e/po/components/kubectl.po';
import { NamespaceFilterPo } from '@/cypress/e2e/po/components/namespace-filter.po';
import { LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

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

  workspaceSwitcher() {
    return new WorkspaceSwitcherPo();
  }

  selectWorkspace(name: string) {
    const wsFilter = this.workspaceSwitcher();

    // The workspace switcher can detach and re-render while a page is still settling (notably the
    // Fleet application list, whose header re-renders as data loads), so the default-timeout toggle
    // click intermittently fails to find it even right after a visibility check. Click with a long
    // timeout so the query retries through the re-render before selecting.
    wsFilter.self(LONG_TIMEOUT_OPT).click();

    return wsFilter.clickOptionWithLabel(name);
  }

  checkCurrentWorkspace(name: string) {
    const wsFilter = this.workspaceSwitcher();

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
}
