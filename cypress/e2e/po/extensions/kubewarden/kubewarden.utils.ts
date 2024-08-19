import ExtensionsCompatibilityUtils from '@/cypress/e2e/po/extensions/extensions-compatibility.utils';
import Kubectl from '~/cypress/e2e/po/components/kubectl.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import SortableTablePo from '@/cypress/e2e/po/components/sortable-table.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import PagePo from '@/cypress/e2e/po/pages/page.po';

class KubewardenDashboardPagePo extends PagePo {
  static url = '/c/local/kubewarden';
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(KubewardenDashboardPagePo.url);
  }

  constructor() {
    super(KubewardenDashboardPagePo.url);
  }

  waitForTitlePreControllerInstall(): Cypress.Chainable {
    return this.self().find('h1').should('contain', 'OS Management');
  }

  waitForTitleAfterControllerInstall(): Cypress.Chainable {
    return this.self().find('[data-testid="kw-dashboard-title"]').should('contain', 'Welcome to Kubewardent');
  }

  startBackendInstallClick(): Cypress.Chainable {
    return this.self().getId('kw-initial-install-button').click();
  }

  openTerminalClick() {
    return this.self().getId('kw-cm-open-shell').click();
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
}

class KubewardenPolicyServerListPagePo extends PagePo {
  static url = '/c/local/kubewarden/policies.kubewarden.io.policyserver';
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(KubewardenPolicyServerListPagePo.url);
  }

  constructor() {
    super(KubewardenPolicyServerListPagePo.url);
  }
}

class KubewardenPolicyServerDetailPagePo extends PagePo {
  static url = '/c/local/kubewarden/policies.kubewarden.io.policyserver';
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(KubewardenPolicyServerDetailPagePo.url);
  }

  constructor() {
    super(KubewardenPolicyServerDetailPagePo.url);
  }

  metricsAddServiceMonitorClick() {
    this.self().getId('kw-monitoring-checklist-step-service-monitor-button').click();
  }

  metricsAddGrafanaDasboardClick() {
    this.self().getId('kw-monitoring-checklist-step-config-map-button').click();
  }
}

class KubewardenAdmissionPoliciesListPagePo extends PagePo {
  static url = '/c/local/kubewarden/policies.kubewarden.io.admissionpolicy';
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(KubewardenAdmissionPoliciesListPagePo.url);
  }

  constructor() {
    super(KubewardenAdmissionPoliciesListPagePo.url);
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
}

export default class KubewardenPo extends ExtensionsCompatibilityUtils {
  dashboard() {
    return new KubewardenDashboardPagePo();
  }

  policyServerList() {
    return new KubewardenPolicyServerListPagePo();
  }

  policyServerDetail() {
    return new KubewardenPolicyServerDetailPagePo();
  }

  admissionPoliciesList() {
    return new KubewardenAdmissionPoliciesListPagePo();
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

  rancherMonitoringInstallIntoProjectSelect(optionIndex: number): Cypress.Chainable {
    const selectProject = new LabeledSelectPo('.labeled-select.edit');

    selectProject.toggle();

    return selectProject.clickOption(optionIndex);
  }

  waitForNamespaceCreation(interceptName: string, namespaceToCheck: string) {
    cy.wait(`@${ interceptName }`, { requestTimeout: 15000 }).then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body.metadata).to.have.property('name', namespaceToCheck);
      cy.wait(3000); // eslint-disable-line cypress/no-unnecessary-waiting
    });
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
