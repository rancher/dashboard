import PagePo from '@/cypress/e2e/po/pages/page.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import ActionMenuPo from '@/cypress/e2e/po/components/action-menu.po';
import NameNsDescriptionPo from '@/cypress/e2e/po/components/name-ns-description.po';
import ReposListPagePo from '@/cypress/e2e/po/pages/repositories.po';
import AppClusterRepoEditPo from '@/cypress/e2e/po/edit/catalog.cattle.io.clusterrepo.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';

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

  /**
   * install extensions operator
   */
  installExtensionsOperatorIfNeeded(attempt = 0): Cypress.Chainable | null {
    // this will make sure we wait for the page to render first content
    // so that the attempts aren't on a blank page
    // this.title();

    this.waitForPage();
    this.title();

    if (attempt > 30) {
      return null;
    }

    const enableButton = this.installOperatorBtn();

    if (!enableButton.isVisible) {
      throw new Error('PO changed');
    }

    return enableButton.isVisible().then((visible) => {
      if (visible) {
        return enableButton.click().then(() => {
          // don't install the parners repo yet, as it's needed for the add repositories test
          this.enableExtensionModalParnersRepoClick();

          return this.enableExtensionModalEnableClick();
        });
      } else {
        return cy.wait(250).then(() => { // eslint-disable-line cypress/no-unnecessary-waiting
          return this.installExtensionsOperatorIfNeeded(++attempt); // next attempt
        });
      }
    });
  }

  /**
   * Adds a cluster repo for extensions
   * @param repo - The repository url (e.g. https://github.com/rancher/ui-plugin-examples)
   * @param branch - The git branch to target
   * @param name - A name for the repository
   * @returns {Cypress.Chainable}
   */
  addExtensionsRepository(repo: string, branch: string, name: string): Cypress.Chainable {
    // we should be on the extensions page
    this.waitForPage();

    // go to app repos
    this.extensionMenuToggle();
    this.manageReposClick();

    // create a new clusterrepo
    const appRepoList = new ReposListPagePo('local', 'apps');

    appRepoList.waitForPage();
    appRepoList.create();

    const appRepoCreate = new AppClusterRepoEditPo('local', 'create');

    appRepoCreate.waitForPage();

    // fill the form
    appRepoCreate.selectRadioOptionGitRepo(1);
    appRepoCreate.nameNsDescription().name().self().scrollIntoView()
      .should('be.visible');
    appRepoCreate.nameNsDescription().name().set(name);
    appRepoCreate.enterGitRepoName(repo);
    appRepoCreate.enterGitBranchName(branch);

    // save it
    return appRepoCreate.save();
  }

  // ------------------ extension card ------------------
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

  // ------------------ extension install modal ------------------
  extensionInstallModal() {
    return this.self().get('[data-modal="installPluginDialog"]');
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
    return this.self().getId('extensions-page-menu');
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

  disableExtensionsClick(): Cypress.Chainable {
    return new ActionMenuPo(this.self()).getMenuItem('Disable Extension Support').click();
  }

  // ------------------ ADD RANCHER REPOSITORIES modal ------------------
  addReposModal() {
    return this.self().getId('add-extensions-repos-modal');
  }

  addReposModalAddClick(): Cypress.Chainable {
    return this.addReposModal().get('.dialog-buttons button:last-child').click();
  }

  // ------------------ DISABLE EXTENSIONS modal ------------------
  disableExtensionModal() {
    return this.self().getId('disable-ext-modal');
  }

  removeRancherExtRepoCheckboxClick(): Cypress.Chainable {
    return this.self().getId('disable-ext-modal-remove-official-repo').click();
  }

  disableExtensionModalCancelClick(): Cypress.Chainable {
    return this.disableExtensionModal().get('.dialog-buttons button:first-child').click();
  }

  disableExtensionModalDisableClick(): Cypress.Chainable {
    return this.disableExtensionModal().get('.dialog-buttons button:last-child').click();
  }

  // ------------------ ENABLE EXTENSIONS modal ------------------
  enableExtensionModal() {
    return this.self().get('[data-modal="confirm-uiplugins-setup"]');
  }

  enableExtensionModalParnersRepoClick(): Cypress.Chainable {
    return this.enableExtensionModal().getId('extension-enable-operator-partners-repo').click();
  }

  enableExtensionModalCancelClick(): Cypress.Chainable {
    return this.enableExtensionModal().get('.dialog-buttons button:first-child').click();
  }

  enableExtensionModalEnableClick(): Cypress.Chainable {
    return this.enableExtensionModal().get('.dialog-buttons button:last-child').click();
  }

  // ------------------ install operator ------------------
  installOperatorBtn(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="extension-enable-operator"]');
  }

  // ------------------ add a new repo (Extension Examples) ------------------
  enterClusterRepoName(name: string) {
    return new NameNsDescriptionPo(this.self()).name().set(name);
  }
}
