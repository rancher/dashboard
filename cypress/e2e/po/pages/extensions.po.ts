import PagePo from '@/cypress/e2e/po/pages/page.po';

export default class ExtensionsPo extends PagePo {
  static url: string = '/c/local/uiplugins'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ExtensionsPo.url);
  }

  constructor() {
    super(ExtensionsPo.url);
  }

  // screen title
  title(): Cypress.Chainable<string> {
    return this.self().getId('extensions-page-title').invoke('text');
  }

  // install rancher-plugin-examples
  installRancherPluginExamples() {
    // we should be on the extensions page
    this.title().should('contain', 'Extensions');

    // go to app repos
    this.extensionMenuToggle();

    this.manageReposClick();

    // create a new clusterrepo
    this.createNewClusterRepoClick();

    // fill the form
    this.selectRadioOptionGitRepo(2);
    this.enterClusterRepoName('rancher-plugin-examples');
    this.enterGitRepoName('https://github.com/rancher/ui-plugin-examples');
    this.enterGitBranchName('main');

    // save it
    return this.saveNewClusterRepoClick();
  }

  // extension card
  extensionCard(extensionName: string) {
    return this.self().getId(`extension-card-${ extensionName }`);
  }

  extensionCardClick(extensionName: string): Cypress.Chainable {
    return this.extensionCard(extensionName).click();
  }

  extensionCardInstallClick(extensionName: string): Cypress.Chainable {
    return this.extensionCard(extensionName).getId(`extension-card-install-btn-${ extensionName }`).click();
  }

  extensionCardUpdateClick(extensionName: string): Cypress.Chainable {
    return this.extensionCard(extensionName).getId(`extension-card-update-btn-${ extensionName }`).click();
  }

  extensionCardRollbackClick(extensionName: string): Cypress.Chainable {
    return this.extensionCard(extensionName).getId(`extension-card-rollback-btn-${ extensionName }`).click();
  }

  extensionCardUninstallClick(extensionName: string): Cypress.Chainable {
    return this.extensionCard(extensionName).getId(`extension-card-uninstall-btn-${ extensionName }`).click();
  }

  // extension install modal
  extensionInstallModal() {
    return this.self().get('[data-modal="installPluginDialog"]');
  }

  installModalSelectVersionClick(optionIndex: number): Cypress.Chainable {
    this.extensionInstallModal().getId('install-ext-modal-select-version').click();

    return this.self().get(`.vs__dropdown-menu .vs__dropdown-option:nth-child(${ optionIndex })`).click();
  }

  installModalCancelClick(): Cypress.Chainable {
    return this.extensionInstallModal().getId('install-ext-modal-cancel-btn').click();
  }

  installModalInstallClick(): Cypress.Chainable {
    return this.extensionInstallModal().getId('install-ext-modal-install-btn').click();
  }

  // extension uninstall modal
  extensionUninstallModal() {
    return this.self().get('[data-modal="uninstallPluginDialog"]');
  }

  uninstallModalCancelClick(): Cypress.Chainable {
    return this.extensionUninstallModal().getId('uninstall-ext-modal-cancel-btn').click();
  }

  uninstallModaluninstallClick(): Cypress.Chainable {
    return this.extensionUninstallModal().getId('uninstall-ext-modal-uninstall-btn').click();
  }

  // extension details
  extensionDetails() {
    return this.self().getId('extension-details');
  }

  extensionDetailsBgClick(): Cypress.Chainable {
    return this.self().getId('extension-details-bg').click();
  }

  extensionDetailsTitle(): Cypress.Chainable<string> {
    return this.extensionDetails().getId('extension-details-title').invoke('text');
  }

  extensionDetailsCloseClick(): Cypress.Chainable {
    return this.extensionDetails().getId('extension-details-close').click();
  }

  // extension tabs
  extensionTabs() {
    return this.self().getId('extension-tabs');
  }

  extensionTabInstalledClick(): Cypress.Chainable {
    return this.extensionTabs().get('li:nth-child(1) a').click();
  }

  extensionTabAvailableClick(): Cypress.Chainable {
    return this.extensionTabs().get('li:nth-child(2) a').click();
  }

  extensionTabUpdatesClick(): Cypress.Chainable {
    return this.extensionTabs().get('li:nth-child(3) a').click();
  }

  extensionTabAllClick(): Cypress.Chainable {
    return this.extensionTabs().get('li:nth-child(4) a').click();
  }

  // extension reload banner
  extensionReloadBanner() {
    return this.self().getId('extension-reload-banner');
  }

  extensionReloadClick(): Cypress.Chainable {
    return this.extensionReloadBanner().getId('extension-reload-banner-reload-btn').click();
  }

  // extension menu
  private extensionMenu() {
    return this.self().getId('extensions-page-menu');
  }

  extensionMenuToggle(): Cypress.Chainable {
    return this.extensionMenu().click();
  }

  manageReposClick(): Cypress.Chainable {
    return this.self().getId('action-menu-0-item').click();
  }

  // this will only appear with developer mode enabled
  // developerLoadClick(): Cypress.Chainable {
  //   return this.self().getId('action-menu-2-item').click();
  // }

  disableExtensionsClick(): Cypress.Chainable {
    return this.self().getId('action-menu-2-item').click();
  }

  // disable extensions OVERALL modal
  disableExtensionModal() {
    return this.self().getId('disable-ext-modal');
  }

  removeRancherExtRepoCheckboxClick(): Cypress.Chainable {
    return this.self().getId('disable-ext-modal-remove-repo').click();
  }

  disableExtensionModalCancelClick(): Cypress.Chainable {
    return this.disableExtensionModal().get('.dialog-buttons button:first-child').click();
  }

  disableExtensionModalDisableClick(): Cypress.Chainable {
    return this.disableExtensionModal().get('.dialog-buttons button:last-child').click();
  }

  // enable extensions OVERALL modal
  enableExtensionModal() {
    return this.self().get('[data-modal="confirm-uiplugins-setup"]');
  }

  enableExtensionModalCancelClick(): Cypress.Chainable {
    return this.enableExtensionModal().get('.dialog-buttons button:first-child').click();
  }

  enableExtensionModalEnableClick(): Cypress.Chainable {
    return this.enableExtensionModal().get('.dialog-buttons button:last-child').click();
  }

  // install operator
  installOperatorBtn() {
    return this.self().getId('extension-enable-operator');
  }

  installOperatorBtnClick(): Cypress.Chainable {
    return this.installOperatorBtn().click();
  }

  // add a new repo (Extension Examples)
  createNewClusterRepoClick(): Cypress.Chainable {
    return this.self().getId('masthead-create').click();
  }

  enterClusterRepoName(name: string) {
    return cy.get('[data-testid="name-ns-description-name"] input').type(name);
  }

  enterGitRepoName(name: string) {
    return cy.get('[data-testid="clusterrepo-git-repo-input"]').type(name);
  }

  enterGitBranchName(name: string) {
    return cy.get('[data-testid="clusterrepo-git-branch-input"]').type(name);
  }

  selectRadioOptionGitRepo(index: Number): Cypress.Chainable {
    return this.self().get(`[data-testid="clusterrepo-radio-input"] .radio-group > div:nth-child(${ index }) .labeling label`).click();
  }

  saveNewClusterRepoClick(): Cypress.Chainable {
    return this.self().getId('action-button-async-button').click();
  }
}
