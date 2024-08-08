import ExtensionsCompatibiliyPo from '@/cypress/e2e/po/pages/extensions-compatibility-tests/extensions-compatibility.po';
import Kubectl from '~/cypress/e2e/po/components/kubectl.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
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

  // installOperatorBtnClick(): Cypress.Chainable {
  //   return this.self().getId('charts-install-button').click();
  // }

  // dashboardCreateElementalClusterClick() {
  //   return this.self().getId('button-create-elemental-cluster').click();
  // }

  // dashboardCreateUpdateGroupClick() {
  //   return this.self().getId('create-update-group-btn').click();
  // }

  // elementalClusterSelectorTemplateBanner() {
  //   return new BannersPo('[provider="machineinventoryselectortemplate"] .banner.warning');
  // }

  // updateGroupTargetClustersSelect() {
  //   return new LabeledSelectPo('[data-testid="cluster-target"]');
  // }

  // updateGroupImageOption() {
  //   return new RadioGroupInputPo('[data-testid="upgrade-choice-selector"]');
  // }
}
