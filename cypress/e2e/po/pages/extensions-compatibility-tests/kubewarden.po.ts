import ExtensionsCompatibiliyPo from '@/cypress/e2e/po/pages/extensions-compatibility-tests/extensions-compatibility.po';
import Kubectl from '~/cypress/e2e/po/components/kubectl.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import SortableTablePo from '@/cypress/e2e/po/components/sortable-table.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
export default class KubewardenPo extends ExtensionsCompatibiliyPo {
  static url = '/c/local/kubewarden';
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(KubewardenPo.url);
  }

  constructor() {
    super(KubewardenPo.url);
  }

  startBackendInstallClick(): Cypress.Chainable {
    return this.self().getId('kw-initial-install-button').click();
  }

  openTerminalClick() {
    return this.self().getId('kw-cm-open-shell').click();
  }

  kubectlShell() {
    return new Kubectl();
  }

  waitForCertManagerToInstall() {
    return cy.get('[data-testid="kw-repo-add-button"]', { timeout: 30000 }).invoke('text').should('contain', 'Add Kubewarden Repository');
  }

  waitForKwRepoToBeAdded() {
    return cy.get('[data-testid="kw-app-install-button"]', { timeout: 30000 }).invoke('text').should('contain', 'Install Kubewarden');
  }

  addKwRepoClick() {
    return this.self().getId('kw-repo-add-button').click();
  }

  installOperatorBtnClick(): Cypress.Chainable {
    return this.self().getId('kw-app-install-button').click();
  }

  defaultPolicyServerInstallClick() {
    return this.self().getId('kw-defaults-banner-button').click();
  }

  rancherMonitoringInstallIntoProjectSelect(optionIndex: number): Cypress.Chainable {
    const selectProject = new LabeledSelectPo('.labeled-select.edit');

    selectProject.toggle();

    return selectProject.clickOption(optionIndex);
  }

  metricsAddServiceMonitorClick() {
    this.self().getId('kw-monitoring-checklist-step-service-monitor-button').click();
  }

  metricsAddGrafanaDasboardClick() {
    this.self().getId('kw-monitoring-checklist-step-config-map-button').click();
  }

  waitForNamespaceCreation(interceptName: string, namespaceToCheck: string) {
    cy.wait(`@${ interceptName }`, { requestTimeout: 15000 }).then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body.metadata).to.have.property('name', namespaceToCheck);
      cy.wait(3000); // eslint-disable-line cypress/no-unnecessary-waiting
    });
  }

  addToArtifactHubClick() {
    this.self().getId('action-button-async-button').click();
  }

  apOfficialPoliciesTable() {
    return new SortableTablePo(this.self().get('.sortable-table'));
  }

  apOfficialPoliciesTableRowClick(policyName: string) {
    this.apOfficialPoliciesTable().rowElementWithName(policyName).scrollIntoView().click();
  }

  apCreateBtn(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="kw-policy-create-finish-button"]', this.self());
  }

  waitForApCreation(interceptName: string, name: string) {
    cy.wait(`@${ interceptName }`, { requestTimeout: 15000 }).then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body).to.have.property('id', `default/${ name }`);
      expect(response?.body.spec).to.have.property('mode', 'protect');
      expect(response?.body.spec.settings).to.have.property('requireTLS', true);
      cy.wait(3000); // eslint-disable-line cypress/no-unnecessary-waiting
    });
  }
}
