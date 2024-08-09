import ExtensionsCompatibiliyPo from '@/cypress/e2e/po/pages/extensions-compatibility-tests/extensions-compatibility.po';
import Kubectl from '~/cypress/e2e/po/components/kubectl.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
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
}
