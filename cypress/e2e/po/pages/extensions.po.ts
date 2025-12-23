import PagePo from '@/cypress/e2e/po/pages/page.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import ActionMenuPo from '@/cypress/e2e/po/components/action-menu.po';
import NameNsDescriptionPo from '@/cypress/e2e/po/components/name-ns-description.po';
import RepositoriesPagePo from '@/cypress/e2e/po/pages/chart-repositories.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';
import ChartRepositoriesCreateEditPo from '@/cypress/e2e/po/edit/chart-repositories.po';
import AppClusterRepoEditPo from '@/cypress/e2e/po/edit/catalog.cattle.io.clusterrepo.po';
import { LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import { CLUSTER_REPOS_BASE_URL } from '@/cypress/support/utils/api-endpoints';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';
import { GetOptions } from '@/cypress/e2e/po/components/component.po';
import RcItemCardPo from '@/cypress/e2e/po/components/rc-item-card.po';
import TooltipPo from '@/cypress/e2e/po/components/tooltip.po';
import InstallExtensionDialog from '@/cypress/e2e/po/prompts/installExtensionDialog.po';

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

  catalogsList() {
    return new ResourceTablePo('[data-testid="sortable-table-list-container"]');
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
    cy.intercept('GET', `${ CLUSTER_REPOS_BASE_URL }?*`).as('getRepos');

    // we should be on the extensions page
    this.waitForPage(null, 'available');
    this.loading().should('not.exist');

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
    appRepoCreate.saveAndWaitForRequests('POST', CLUSTER_REPOS_BASE_URL);

    appRepoList.waitForPage();
    cy.waitForRepositoryDownload('v1', 'catalog.cattle.io.clusterrepos', name);
    cy.waitForResourceState('v1', 'catalog.cattle.io.clusterrepos', name);
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
  addExtensionsRepositoryDirectLink(repo: string, branch: string, name: string, waitForActiveState = true) {
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
  extensionCard(extensionTitle: string): RcItemCardPo {
    return RcItemCardPo.getCardByTitle(extensionTitle);
  }

  private clickAction(extensionTitle: string, actionLabel: string) {
    const actionMenu = this.extensionCard(extensionTitle).openActionMenu();

    return actionMenu.getMenuItem(actionLabel).click();
  }

  extensionCardVersion(extensionTitle: string): Cypress.Chainable<string> {
    return this.extensionCard(extensionTitle).self().find('[data-testid="app-chart-card-sub-header-item"]').first()
      .invoke('text');
  }

  extensionCardClick(extensionTitle: string): void {
    this.extensionCard(extensionTitle).click();
  }

  extensionCardInstallClick(extensionTitle: string): Cypress.Chainable {
    return this.clickAction(extensionTitle, 'Install');
  }

  extensionCardUpgradeClick(extensionTitle: string): Cypress.Chainable {
    return this.clickAction(extensionTitle, 'Upgrade');
  }

  extensionCardDowngradeClick(extensionTitle: string): Cypress.Chainable {
    return this.clickAction(extensionTitle, 'Downgrade');
  }

  extensionCardUninstallClick(extensionTitle: string): Cypress.Chainable {
    return this.clickAction(extensionTitle, 'Uninstall');
  }

  extensionCardHeaderStatusIcons(extensionTitle: string, index: number): Cypress.Chainable {
    return this.extensionCard(extensionTitle).self().find(`[data-testid="item-card-header-status-${ index }"]`);
  }

  extensionCardHeaderStatusTooltip(extensionTitle: string, index: number): TooltipPo {
    return new TooltipPo(this.extensionCardHeaderStatusIcons(extensionTitle, index));
  }

  // ------------------ extension install modal ------------------
  installModal() {
    return new InstallExtensionDialog();
  }

  // ------------------ extension uninstall modal ------------------
  extensionUninstallModal() {
    return this.self().get('[data-testid="uninstall-extension-modal"]');
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
    return this.extensionTabs.clickTabWithName('installed');
  }

  extensionTabAvailableClick(): Cypress.Chainable {
    return this.extensionTabs.clickTabWithName('available');
  }

  extensionTabBuiltinClick(): Cypress.Chainable {
    return this.extensionTabs.clickTabWithName('builtin');
  }

  extensionTabBuiltin() {
    return this.extensionTabs.getTab('builtin');
  }

  // ------------------ extension reload banner ------------------
  extensionReloadBanner(options: GetOptions = LONG_TIMEOUT_OPT) {
    return this.self().get(`[data-testid="extension-reload-banner"]`, options);
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

  manageExtensionCatalogsClick(): Cypress.Chainable {
    return new ActionMenuPo(this.self()).getMenuItem('Manage Extension Catalogs').click();
  }

  // ------------------ ADD RANCHER REPOSITORIES modal ------------------
  addReposModal() {
    return this.self().getId('add-extensions-repos-modal');
  }

  addReposModalAddClick(): Cypress.Chainable {
    return this.addReposModal().get('.dialog-buttons button:last-child').click();
  }

  // ------------------ Import Extension Catalog modal ------------------
  importExtensionCatalogModal(): Cypress.Chainable {
    return this.self().get('.plugin-install-dialog');
  }

  // ------------------ add a new repo (Extension Examples) ------------------
  enterClusterRepoName(name: string) {
    return new NameNsDescriptionPo(this.self()).name().set(name);
  }
}
