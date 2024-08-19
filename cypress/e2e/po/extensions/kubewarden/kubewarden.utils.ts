import ExtensionsCompatibilityUtils from '@/cypress/e2e/po/extensions/extensions-compatibility.utils';
import Kubectl from '~/cypress/e2e/po/components/kubectl.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import SortableTablePo from '@/cypress/e2e/po/components/sortable-table.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import PagePo from '@/cypress/e2e/po/pages/page.po';
<<<<<<< HEAD
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import CodeMirrorPo from '@/cypress/e2e/po/components/code-mirror.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
=======
>>>>>>> 7c0eacee5a (redo PR based on previous PR 11626 and taking into account changes to the utils files + comment unwanted workflow runs)

class KubewardenDashboardPagePo extends PagePo {
  static url = '/c/local/kubewarden';
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(KubewardenDashboardPagePo.url);
  }

  constructor() {
    super(KubewardenDashboardPagePo.url);
  }

  waitForTitlePreControllerInstall(): Cypress.Chainable {
<<<<<<< HEAD
    return this.self().find('[data-testid="kw-install-title"]').should('contain', 'Kubewarden');
  }

  waitForTitleAfterControllerInstall(): Cypress.Chainable {
    return this.self().find('[data-testid="kw-dashboard-title"]').should('contain', 'Welcome to Kubewarden');
=======
    return this.self().find('h1').should('contain', 'OS Management');
  }

  waitForTitleAfterControllerInstall(): Cypress.Chainable {
    return this.self().find('[data-testid="kw-dashboard-title"]').should('contain', 'Welcome to Kubewardent');
>>>>>>> 7c0eacee5a (redo PR based on previous PR 11626 and taking into account changes to the utils files + comment unwanted workflow runs)
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

<<<<<<< HEAD
class KubewardenPolicyServerEditPagePo extends PagePo {
  private static createPath(clusterId: string, id?: string ) {
    const root = `/c/${ clusterId }/kubewarden/policies.kubewarden.io.policyserver`;

    return id ? `${ root }/${ id }?mode=edit` : `${ root }/create`;
  }

  goTo(clusterId: string, id?:string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(KubewardenPolicyServerEditPagePo.createPath(clusterId, id));
  }

  constructor(clusterId = 'local', id?: string) {
    super(KubewardenPolicyServerEditPagePo.createPath(clusterId, id));
  }

  editYamlBtnClick():Cypress.Chainable {
    return this.self().get('[data-testid="kw-policy-server-config-yaml-option"] [data-testid="button-group-child-1"]').click();
  }

  // the edit view of the policy server is not a generic resource edit/yaml view, so let's go
  // straight to the source
  codeMirror() {
    return CodeMirrorPo.bySelector(this.self(), '[data-testid="yaml-editor-code-mirror"]');
  }

  saveCreateForm(): ResourceDetailPo {
    return new ResourceDetailPo(this.self());
  }

  waitForPolicyServerCreation(interceptName: string, nameToCheck: string) {
    cy.wait(`@${ interceptName }`, { requestTimeout: 20000 }).then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body.metadata).to.have.property('name', nameToCheck);

      cy.wait(5000); // eslint-disable-line cypress/no-unnecessary-waiting
    });
  }
}

class KubewardenPolicyServerDetailPagePo extends PagePo {
  private static createPath(clusterId: string, id: string) {
    return `/c/${ clusterId }/kubewarden/policies.kubewarden.io.policyserver/${ id }`;
  }

  goTo(clusterId: string, id:string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(KubewardenPolicyServerDetailPagePo.createPath(clusterId, id));
  }

  constructor(clusterId = 'local', id: string) {
    super(KubewardenPolicyServerDetailPagePo.createPath(clusterId, id));
=======
class KubewardenPolicyServerDetailPagePo extends PagePo {
  static url = '/c/local/kubewarden/policies.kubewarden.io.policyserver';
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(KubewardenPolicyServerDetailPagePo.url);
  }

  constructor() {
    super(KubewardenPolicyServerDetailPagePo.url);
>>>>>>> 7c0eacee5a (redo PR based on previous PR 11626 and taking into account changes to the utils files + comment unwanted workflow runs)
  }

  metricsAddServiceMonitorClick() {
    this.self().getId('kw-monitoring-checklist-step-service-monitor-button').click();
  }

  metricsAddGrafanaDasboardClick() {
    this.self().getId('kw-monitoring-checklist-step-config-map-button').click();
  }
}

<<<<<<< HEAD
class AdmissionPoliciesListPo extends BaseResourceList {
  state(name: string) {
    return this.resourceTable().sortableTable().rowWithName(name).column(1);
  }
}

=======
>>>>>>> 7c0eacee5a (redo PR based on previous PR 11626 and taking into account changes to the utils files + comment unwanted workflow runs)
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

<<<<<<< HEAD
  artifactHubPoliciesTable() {
    return new SortableTablePo(this.self().get('.sortable-table'));
  }

  admissionPolicyOfficialPoliciesTableRowClick(policyName: string) {
    this.artifactHubPoliciesTable().rowElementWithName(policyName).scrollIntoView().click();
  }

  list(): AdmissionPoliciesListPo {
    return new AdmissionPoliciesListPo('[data-testid="kw-ap-policy-list"]');
  }
}

class KubewardenAdmissionPoliciesEditPagePo extends PagePo {
  private static createPath(clusterId: string, id?: string ) {
    const root = `/c/${ clusterId }/kubewarden/policies.kubewarden.io.admissionpolicy`;

    return id ? `${ root }/${ id }?mode=edit` : `${ root }/create`;
  }

  goTo(clusterId: string, id?: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(KubewardenAdmissionPoliciesEditPagePo.createPath(clusterId, id));
  }

  constructor(clusterId = 'local', id?: string) {
    super(KubewardenAdmissionPoliciesEditPagePo.createPath(clusterId, id));
  }

  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  admissionPolicyCreateBtn(): AsyncButtonPo {
=======
  apOfficialPoliciesTable() {
    return new SortableTablePo(this.self().get('.sortable-table'));
  }

  apOfficialPoliciesTableRowClick(policyName: string) {
    this.apOfficialPoliciesTable().rowElementWithName(policyName).scrollIntoView().click();
  }

  apCreateBtn(): AsyncButtonPo {
>>>>>>> 7c0eacee5a (redo PR based on previous PR 11626 and taking into account changes to the utils files + comment unwanted workflow runs)
    return new AsyncButtonPo('[data-testid="kw-policy-create-finish-button"]', this.self());
  }
}

<<<<<<< HEAD
export class KubewardenResourceComplianceReportPagePo extends PagePo {
  clickComplianceTab() {
    return new TabbedPo().clickTabWithSelector('[data-testid="btn-policy-report-tab"]');
  }

  complianceSortableTable() {
    return new SortableTablePo(this.self().get('#policy-report-tab .sortable-table'));
  }
}

=======
>>>>>>> 7c0eacee5a (redo PR based on previous PR 11626 and taking into account changes to the utils files + comment unwanted workflow runs)
export default class KubewardenPo extends ExtensionsCompatibilityUtils {
  dashboard() {
    return new KubewardenDashboardPagePo();
  }

  policyServerList() {
    return new KubewardenPolicyServerListPagePo();
  }

<<<<<<< HEAD
  policyServerEdit(clusterId = 'local', id?: string) {
    return new KubewardenPolicyServerEditPagePo(clusterId, id);
  }

  policyServerDetail(clusterId = 'local', id: string) {
    return new KubewardenPolicyServerDetailPagePo(clusterId, id);
=======
  policyServerDetail() {
    return new KubewardenPolicyServerDetailPagePo();
>>>>>>> 7c0eacee5a (redo PR based on previous PR 11626 and taking into account changes to the utils files + comment unwanted workflow runs)
  }

  admissionPoliciesList() {
    return new KubewardenAdmissionPoliciesListPagePo();
  }

<<<<<<< HEAD
  admissionPoliciesEdit(clusterId = 'local', id?: string) {
    return new KubewardenAdmissionPoliciesEditPagePo(clusterId, id);
  }

=======
>>>>>>> 7c0eacee5a (redo PR based on previous PR 11626 and taking into account changes to the utils files + comment unwanted workflow runs)
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
<<<<<<< HEAD
    cy.wait(`@${ interceptName }`, { requestTimeout: 20000 }).then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body.metadata).to.have.property('name', namespaceToCheck);
      cy.wait(5000); // eslint-disable-line cypress/no-unnecessary-waiting
    });
  }

  waitForAdmissionPolicyCreation(interceptName: string, name: string, namespace: string, beforeTimeout = 70000) {
    cy.wait(`@${ interceptName }`, { requestTimeout: 20000 }).then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body).to.have.property('id', `${ namespace }/${ name }`);
      expect(response?.body.spec).to.have.property('mode', 'protect');
      expect(response?.body.spec.settings).to.have.property('requireTLS', true);

      // giving it a buffer so that the state is propagated successfully
      cy.wait(beforeTimeout); // eslint-disable-line cypress/no-unnecessary-waiting

      return this.admissionPoliciesList().list().state(name).should('contain', 'Active');
=======
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
>>>>>>> 7c0eacee5a (redo PR based on previous PR 11626 and taking into account changes to the utils files + comment unwanted workflow runs)
    });
  }
}
