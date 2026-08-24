import PagePo from '@/cypress/e2e/po/pages/page.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import ActionMenuPo from '@/cypress/e2e/po/components/action-menu.po';
import NameNsDescriptionPo from '@/cypress/e2e/po/components/name-ns-description.po';
import RepositoriesPagePo from '@/cypress/e2e/po/pages/chart-repositories.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';
import ChartRepositoriesCreateEditPo from '@/cypress/e2e/po/edit/chart-repositories.po';
import AppClusterRepoEditPo from '@/cypress/e2e/po/edit/catalog.cattle.io.clusterrepo.po';
import { LONG_TIMEOUT_OPT, MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import { CLUSTER_REPOS_BASE_URL } from '@/cypress/support/utils/api-endpoints';
import ResourceTablePo from '@/cypress/e2e/po/components/resource-table.po';
import { GetOptions } from '@/cypress/e2e/po/components/component.po';
import RcItemCardPo from '@/cypress/e2e/po/components/rc-item-card.po';
import TooltipPo from '@/cypress/e2e/po/components/tooltip.po';
import InstallExtensionDialog from '@/cypress/e2e/po/prompts/installExtensionDialog.po';

export default class ExtensionsPagePo extends PagePo {
  static url = '/c/local/uiplugins';
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
   * Returns whether the given extension tab is present.
   */
  checkForExtensionTab(tab: 'available' | 'installed' | 'builtin'): Cypress.Chainable<boolean> {
    this.waitForTabs();

    return this.self().then((el) => {
      return el.find(`[data-testid="btn-${ tab }"]`).length > 0;
    });
  }

  /**
   * Returns whether any card under the page root has a title containing `extensionName`
   * Resolves to false when none match; does not assert failure.
   */
  checkForExtensionCardWithName(extensionName: string): Cypress.Chainable<boolean> {
    this.waitForTabs();

    return this.self(MEDIUM_TIMEOUT_OPT).then((el) => {
      const header = el.find('[data-testid="item-card-header-title"]').filter((_, titleEl) => {
        return Cypress.$(titleEl).text().includes(extensionName);
      });

      return header.length > 0;
    });
  }

  /**
   * Intercepts the cluster-repo install POST, installs `extensionName` from the Available tab through
   * the modal, asserts a 2xx response, then completes the reload banner flow.
   */
  installExtensionFromCatalog(extensionName: string, clusterRepoName: string, interceptAlias: string): void {
    cy.intercept('POST', `${ CLUSTER_REPOS_BASE_URL }/${ clusterRepoName }?action=install`).as(interceptAlias);

    this.extensionTabAvailableClick();
    this.waitForPage(null, 'available');
    this.extensionCardInstallClick(extensionName);
    this.installModal().checkVisible();
    this.installModal().installButton().click();
    cy.wait(`@${ interceptAlias }`, MEDIUM_TIMEOUT_OPT).its('response.statusCode').should('be.oneOf', [200, 201]);
    this.extensionReloadBanner().should('be.visible');
    this.extensionReloadClick();
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
    appRepoCreate.selectGitRepoCard();
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
    // Known issue rancher/dashboard#17554: a clusterrepo can report Active before its Download has
    // actually completed, and the repo list's state badge then lags the (already-Active) API state
    // under CI load, only rendering 'Active' after a delayed re-fetch. kubewarden calls this from a
    // before-all hook, which Cypress does NOT retry, so a badge that outruns the default window fails
    // the whole suite. Reload once to force a fresh list render off the now-Active API state before
    // asserting the badge.
    cy.reload();
    appRepoList.waitForPage();
    appRepoList.list().checkVisible();
    appRepoList.list().state(name).should('contain', 'Active');

    return cy.wrap(appRepoList.list());
  }

  /**
   * Adds a cluster repo for extensions
   * @param repo - The repository url (e.g. https://github.com/rancher/ui-plugin-examples)
   * @param branch - The git branch to target
   * @param name - A name for the repository
   */
  addExtensionsRepositoryDirectLink(repo: string, branch: string, name: string, waitForActiveState = true) {
    const appRepoList = new RepositoriesPagePo('local', 'apps');
    const appRepoCreate = new AppClusterRepoEditPo('local', 'create');

    appRepoCreate.goTo();
    appRepoCreate.waitForPage();

    appRepoCreate.nameNsDescription().name().self().scrollIntoView()
      .should('be.visible');
    appRepoCreate.nameNsDescription().name().set(name);
    appRepoCreate.selectRcItemCard('git-repo');
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
  extensionCard(extensionTitle: string, options?: Partial<Cypress.Timeoutable>): RcItemCardPo {
    return RcItemCardPo.getCardByTitle(extensionTitle, options);
  }

  private clickAction(extensionTitle: string, actionLabel: string) {
    // The card list renders asynchronously (chart-repo fetch then render), so wait
    // for loading to finish and the target card to be visible before opening its
    // action menu. Otherwise the lookup outruns the default retry window under CI
    // load, which is the main source of flakiness on these tests.
    this.loading().should('not.exist');
    const card = this.extensionCard(extensionTitle, LONG_TIMEOUT_OPT);

    card.self().should('be.visible');

    // The Upgrade/Downgrade items appear only once the extension's available versions have loaded
    // from the (sometimes slow) chart repo. The menu re-renders reactively when they arrive, so give
    // the item lookup a long window instead of the default - otherwise it outruns a slow repo fetch
    // and the action is reported missing even though it shows up moments later.
    return card.openActionMenu().getMenuItem(actionLabel, LONG_TIMEOUT_OPT).click();
  }

  /**
   * Open the card action menu and click `actionLabel` only if it is offered; resolves to whether it
   * was clicked. Used to keep the upgrade/downgrade tests idempotent across retries: a prior attempt
   * may already have moved the extension to the target version (e.g. upgraded to latest), which
   * removes that action - so a plain retry, which re-runs the whole test, would otherwise hard-fail on
   * the now-missing menu item. Waits for the version-dependent actions to load first (Upgrade and/or
   * Downgrade appear only once the chart repo versions are fetched) so a slow menu is not misread as
   * "action absent".
   */
  clickActionIfPresent(extensionTitle: string, actionLabel: string): Cypress.Chainable<boolean> {
    this.loading().should('not.exist');
    const card = this.extensionCard(extensionTitle, LONG_TIMEOUT_OPT);

    card.self().should('be.visible');
    const menu = card.openActionMenu();

    // Wait for the version-dependent actions to load before deciding: Upgrade and/or Downgrade appear
    // only once the chart repo versions are fetched, so their absence earlier is a slow menu, not a
    // genuinely missing action.
    menu.menuItems(LONG_TIMEOUT_OPT).should(($items) => {
      const text = $items.toArray().map((el) => el.textContent || '').join('|');

      expect(text).to.match(/Upgrade|Downgrade/);
    });

    return menu.clickMenuItemIfPresent(actionLabel);
  }

  extensionCardVersion(extensionTitle: string): Cypress.Chainable<string> {
    return this.extensionCard(extensionTitle).self().find('[data-testid="app-chart-card-sub-header-item"]').first()
      .invoke('text');
  }

  extensionCardClick(extensionTitle: string, options?: Partial<Cypress.Timeoutable>): void {
    this.extensionCard(extensionTitle, options).click();
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

  uninstallModalUninstallClick(): Cypress.Chainable {
    return this.extensionUninstallModal().getId('uninstall-ext-modal-uninstall-btn').click();
  }

  // ------------------ extension details ------------------
  extensionDetails() {
    return this.self().getId('slide-in-panel-component');
  }

  extensionDetailsBgClick(): Cypress.Chainable {
    return this.self().getId('slide-in-glass').click();
  }

  extensionDetailsTitle(): Cypress.Chainable<string> {
    return this.extensionDetails().getId('extension-details-title').invoke('text');
  }

  extensionDetailsVersion(): Cypress.Chainable<string> {
    return this.extensionDetails().find('.version-link').invoke('text');
  }

  extensionDetailsCloseClick(): Cypress.Chainable {
    return this.extensionDetails().getId('rc-drawer-close').click();
  }

  // ------------------ extension tabs ------------------
  extensionTabInstalledClick(): Cypress.Chainable {
    // Wait for the tab to render before clicking it. The tabs load asynchronously,
    // and unlike the 'Available' tab this one had no guard, so it would flake when
    // the tab button hadn't rendered within the default retry window.
    this.extensionTabs.allTabs().contains('Installed', MEDIUM_TIMEOUT_OPT).should('be.visible');

    return this.extensionTabs.clickTabWithName('installed');
  }

  extensionTabAvailableClick(): Cypress.Chainable {
    this.extensionTabs.allTabs().contains('Available', MEDIUM_TIMEOUT_OPT).should('be.visible');

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
    // Force the click: a transient growl toast can overlay the reload button, which makes Cypress
    // error with "being covered by another element". The button itself is interactable - the growl
    // is an incidental, self-dismissing overlay - so the covered-element check is a false negative.
    return this.extensionReloadBanner().getId('extension-reload-banner-reload-btn').click({ force: true });
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
    return this.addReposModal().get('.dialog-buttons button:last-child').should('be.visible').click();
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
