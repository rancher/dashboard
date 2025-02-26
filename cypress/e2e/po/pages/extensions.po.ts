import PagePo from '@/cypress/e2e/po/pages/page.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import ActionMenuPo from '@/cypress/e2e/po/components/action-menu.po';
import NameNsDescriptionPo from '@/cypress/e2e/po/components/name-ns-description.po';
import RepositoriesPagePo from '@/cypress/e2e/po/pages/chart-repositories.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';
import ChartRepositoriesCreateEditPo from '@/cypress/e2e/po/edit/chart-repositories.po';
import AppClusterRepoEditPo from '@/cypress/e2e/po/edit/catalog.cattle.io.clusterrepo.po';
import { LONG_TIMEOUT_OPT, MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

export default class ExtensionsPagePo extends PagePo {
  static url = '/c/local/uiplugins'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ExtensionsPagePo.url);
  }

  extensionTabs: TabbedPo;

  constructor() {
    super(ExtensionsPagePo.url);

    this.extensionTabs = new TabbedPo('[data-testid="extension-tabs"]');
  }

  /**
   * Page Title
   */
  title(): Cypress.Chainable<string> {
    return this.self().getId('extensions-page-title').invoke('text');
  }

  waitForTitle() {
    return this.title().should('contain', 'Extensions');
  }

  loading() {
    return this.self().get('.data-loading');
  }

  waitForTabs() {
    return this.extensionTabs.checkVisible(LONG_TIMEOUT_OPT);
  }

  /**
   * Adds a cluster repo for extensions
   * @param repo - The repository url (e.g. https://github.com/rancher/ui-plugin-examples)
   * @param branch - The git branch to target
   * @param name - A name for the repository
   * @returns {Cypress.Chainable}
   */
  addExtensionsRepository(repo: string, branch: string, name: string): Cypress.Chainable {
    cy.intercept('GET', '/v1/catalog.cattle.io.clusterrepos?exclude=metadata.managedFields').as('getRepos');

    // we should be on the extensions page
    this.waitForPage(null, 'available');
    this.loading(MEDIUM_TIMEOUT_OPT).should('not.exist');

    // go to app repos
    this.extensionMenuToggle();
    this.manageReposClick();
    cy.wait('@getRepos').its('response.statusCode').should('eq', 200);

    // create a new clusterrepo
    const appRepoList = new RepositoriesPagePo('local', 'apps');

    appRepoList.waitForPage();
    appRepoList.list().checkVisible();

    appRepoList.create();

    const appRepoCreate = new ChartRepositoriesCreateEditPo('local', 'apps');

    appRepoCreate.waitForPage();

    // fill the form
    appRepoCreate.repoRadioBtn().set(1);
    appRepoCreate.nameNsDescription().name().self().scrollIntoView()
      .should('be.visible');
    appRepoCreate.nameNsDescription().name().set(name);
    appRepoCreate.gitRepoUrl().set(repo);
    appRepoCreate.gitBranch().set(branch);

    // save it
    appRepoCreate.saveAndWaitForRequests('POST', '/v1/catalog.cattle.io.clusterrepos');

    appRepoList.waitForPage();
    appRepoList.list().state(name).should('contain', 'Active');

    return cy.wrap(appRepoList.list());
  }

  /**
   * Adds a cluster repo for extensions
   * @param repo - The repository url (e.g. https://github.com/rancher/ui-plugin-examples)
   * @param branch - The git branch to target
   * @param name - A name for the repository
   * @returns {Cypress.Chainable}
   */
  addExtensionsRepositoryDirectLink(repo: string, branch: string, name: string, waitForActiveState = true): Cypress.Chainable {
    const appRepoList = new RepositoriesPagePo('local', 'apps');
    const appRepoCreate = new AppClusterRepoEditPo('local', 'create');

    appRepoCreate.goTo();
    appRepoCreate.waitForPage();

    appRepoCreate.nameNsDescription().name().self().scrollIntoView()
      .should('be.visible');
    appRepoCreate.nameNsDescription().name().set(name);
    appRepoCreate.selectRadioOptionGitRepo(1);
    // fill the git repo form
    appRepoCreate.enterGitRepoName(repo);
    appRepoCreate.enterGitBranchName(branch);
    appRepoCreate.create().click();

    if (waitForActiveState) {
      appRepoList.waitForPage();
      appRepoList.list().state(name).should('contain', 'Active');
    }
  }

  // ------------------ extension card ------------------
  extensionCard(extensionName: string) {
    return this.self().getId(`extension-card-${ extensionName }`).scrollIntoView();
  }

  extensionCardVersion(extensionName: string): Cypress.Chainable {
    return this.extensionCard(extensionName).find('.plugin-version > span').invoke('text');
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

  // ------------------ extension install modal ------------------
  extensionInstallModal() {
    return this.self().get('[data-modal="installPluginDialog"]');
  }

  installModalSelectVersionLabel(label: string): Cypress.Chainable {
    const selectVersion = new LabeledSelectPo(this.extensionInstallModal().getId('install-ext-modal-select-version'));

    selectVersion.toggle();

    return selectVersion.setOptionAndClick(label);
  }

  installModalSelectVersionClick(optionIndex: number): Cypress.Chainable {
    const selectVersion = new LabeledSelectPo(this.extensionInstallModal().getId('install-ext-modal-select-version'));

    selectVersion.toggle();

    return selectVersion.clickOption(optionIndex);
  }

  installModalCancelClick(): Cypress.Chainable {
    return this.extensionInstallModal().getId('install-ext-modal-cancel-btn').click();
  }

  installModalInstallClick(): Cypress.Chainable {
    return this.extensionInstallModal().getId('install-ext-modal-install-btn').click();
  }

  // ------------------ extension uninstall modal ------------------
  extensionUninstallModal() {
    return this.self().get('[data-modal="uninstallPluginDialog"]');
  }

  uninstallModalCancelClick(): Cypress.Chainable {
    return this.extensionUninstallModal().getId('uninstall-ext-modal-cancel-btn').click();
  }

  uninstallModaluninstallClick(): Cypress.Chainable {
    return this.extensionUninstallModal().getId('uninstall-ext-modal-uninstall-btn').click();
  }

  // ------------------ extension details ------------------
  extensionDetails() {
    return this.self().getId('extension-details');
  }

  extensionDetailsBgClick(): Cypress.Chainable {
    return this.self().getId('extension-details-bg').click();
  }

  extensionDetailsTitle(): Cypress.Chainable<string> {
    return this.extensionDetails().getId('extension-details-title').invoke('text');
  }

  extensionDetailsVersion(): Cypress.Chainable<string> {
    return this.extensionDetails().find('.version-link').invoke('text');
  }

  extensionDetailsCloseClick(): Cypress.Chainable {
    return this.extensionDetails().getId('extension-details-close').click();
  }

  // ------------------ extension tabs ------------------
  extensionTabInstalledClick(): Cypress.Chainable {
    return this.extensionTabs.clickNthTab(1);
  }

  extensionTabAvailableClick(): Cypress.Chainable {
    return this.extensionTabs.clickNthTab(2);
  }

  extensionTabUpdatesClick(): Cypress.Chainable {
    return this.extensionTabs.clickNthTab(3);
  }

  extensionTabAllClick(): Cypress.Chainable {
    return this.extensionTabs.clickNthTab(4);
  }

  extensionTabBuiltinClick(): Cypress.Chainable {
    return this.extensionTabs.clickTabWithName('builtin');
  }

  extensionTabBuiltin() {
    return this.extensionTabs.getTab('builtin');
  }

  // ------------------ extension reload banner ------------------
  extensionReloadBanner() {
    return this.self().getId('extension-reload-banner');
  }

  extensionReloadClick(): Cypress.Chainable {
    return this.extensionReloadBanner().getId('extension-reload-banner-reload-btn').click();
  }

  // ------------------ new repos banner ------------------
  repoBanner() {
    return new BannersPo('[data-testid="extensions-new-repos-banner"]', this.self());
  }

  // ------------------ extension menu ------------------
  private extensionMenu() {
    return this.self().get('[data-testid="extensions-page-menu"]', LONG_TIMEOUT_OPT);
  }

  extensionMenuToggle(): Cypress.Chainable {
    return this.extensionMenu().click();
  }

  manageReposClick(): Cypress.Chainable {
    return new ActionMenuPo(this.self()).getMenuItem('Manage Repositories').click();
  }

  addRepositoriesClick(): Cypress.Chainable {
    return new ActionMenuPo(this.self()).getMenuItem('Add Rancher Repositories').click();
  }

  // ------------------ ADD RANCHER REPOSITORIES modal ------------------
  addReposModal() {
    return this.self().getId('add-extensions-repos-modal');
  }

  addReposModalAddClick(): Cypress.Chainable {
    return this.addReposModal().get('.dialog-buttons button:last-child').click();
  }

  // ------------------ add a new repo (Extension Examples) ------------------
  enterClusterRepoName(name: string) {
    return new NameNsDescriptionPo(this.self()).name().set(name);
  }
}
