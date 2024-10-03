import ExtensionsPagePo from '@/cypress/e2e/po/pages/extensions.po';
import RepositoriesPagePo from '@/cypress/e2e/po/pages/chart-repositories.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import { LoginPagePo } from '@/cypress/e2e/po/pages/login-page.po';

const DISABLED_CACHE_EXTENSION_NAME = 'large-extension';
const DISABLED_CACHE_EXTENSION_MENU_LABEL = 'Large-extension';
const DISABLED_CACHE_EXTENSION_TITLE = 'Large extension demo (> 20mb) - cache testing';
const UNAUTHENTICATED_EXTENSION_NAME = 'uk-locale';
const EXTENSION_NAME = 'clock';
const UI_PLUGINS_PARTNERS_REPO_URL = 'https://github.com/rancher/partner-extensions';
const UI_PLUGINS_PARTNERS_REPO_NAME = 'partner-extensions';

describe('Extensions page', { tags: ['@extensions', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('versions for built-in extensions should display as expected', () => {
    const pluginVersion = '1.0.0';
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage(null, 'available');
    extensionsPo.extensionTabInstalledClick();
    extensionsPo.waitForPage(null, 'installed');

    // AKS Provisioning
    extensionsPo.extensionCardVersion('aks').should('contain', pluginVersion);
    extensionsPo.extensionCardClick('aks');
    extensionsPo.extensionDetailsTitle().should('contain', 'AKS Provisioning');
    extensionsPo.extensionDetailsVersion().should('contain', pluginVersion);
    extensionsPo.extensionDetailsCloseClick();

    // EKS Provisioning
    extensionsPo.extensionCardVersion('eks').should('contain', pluginVersion);
    extensionsPo.extensionCardClick('eks');
    extensionsPo.extensionDetailsTitle().should('contain', 'EKS Provisioning');
    extensionsPo.extensionDetailsVersion().should('contain', pluginVersion);
    extensionsPo.extensionDetailsCloseClick();

    // GKE Provisioning
    extensionsPo.extensionCardVersion('gke').should('contain', pluginVersion);
    extensionsPo.extensionCardClick('gke');
    extensionsPo.extensionDetailsTitle().should('contain', 'GKE Provisioning');
    extensionsPo.extensionDetailsVersion().should('contain', pluginVersion);
    extensionsPo.extensionDetailsCloseClick();

    // Virtualization Manager
    extensionsPo.extensionCardVersion('harvester-manager').should('contain', pluginVersion);
    extensionsPo.extensionCardClick('harvester-manager');
    extensionsPo.extensionDetailsTitle().should('contain', 'Virtualization Manager');
    extensionsPo.extensionDetailsVersion().should('contain', pluginVersion);
    extensionsPo.extensionDetailsCloseClick();
  });

  it('add repository', () => {
    // This should be in a `before` however is flaky. Move it to an `it` to let cypress retry
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();
    extensionsPo.extensionTabInstalledClick(); // Avoid nav guard failures that probably auto move user to this tab

    // install the rancher plugin examples
    extensionsPo.addExtensionsRepository('https://github.com/rancher/ui-plugin-examples', 'main', 'rancher-plugin-examples');
  });

  it('has the correct title', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForTitle();

    cy.title().should('eq', 'Rancher - Extensions');
  });

  it('Should check the feature flag', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    cy.intercept('GET', '/v1/management.cattle.io.features?*', {
      type:         'collection',
      resourceType: 'management.cattle.io.feature',
      data:         [
        {
          id:     'uiextension',
          type:   'management.cattle.io.feature',
          kind:   'Feature',
          spec:   { value: true },
          status: {
            default:     true,
            description: 'Enable UI Extensions when starting Rancher',
            dynamic:     false,
            lockedValue: null
          }
        }
      ]
    }).as('getFeatureFlag');

    extensionsPo.waitForPage();
    extensionsPo.waitForTitle();

    cy.wait('@getFeatureFlag').then(() => {
      extensionsPo.extensionTabs.checkVisible();
    });
  });

  it('using "Add Rancher Repositories" should add a new repository (Partners repo)', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    // check if burguer menu nav is highlighted correctly for extensions
    // https://github.com/rancher/dashboard/issues/10010
    BurgerMenuPo.checkIfMenuItemLinkIsHighlighted('Extensions');

    // catching regression https://github.com/rancher/dashboard/issues/10576
    BurgerMenuPo.checkIfClusterMenuLinkIsHighlighted('local', false);

    // go to "add rancher repositories"
    extensionsPo.extensionMenuToggle();
    extensionsPo.addRepositoriesClick();

    // add the partners repo
    extensionsPo.addReposModalAddClick();
    extensionsPo.addReposModal().should('not.exist');

    // go to repos list page
    const appRepoList = new RepositoriesPagePo('local', 'apps');

    appRepoList.goTo();
    appRepoList.waitForPage();
    appRepoList.sortableTable().rowElementWithName(UI_PLUGINS_PARTNERS_REPO_URL).should('exist');
  });

  it('New repos banner should only appear once (after dismiss should NOT appear again)', () => {
    cy.getRancherResource('v3', 'setting', 'display-add-extension-repos-banner', null).then((resp: Cypress.Response<any>) => {
      const notFound = resp.status === 404;
      const requiredValue = resp.body?.value === 'true';

      if (notFound || requiredValue) {
        cy.log('Good test state', '/v3/setting/display-add-extension-repos-banner', resp.status, JSON.stringify(resp?.body || {}));
      } else {
        cy.log('Bad test state', '/v3/setting/display-add-extension-repos-banner', resp.status, JSON.stringify(resp?.body || {}));

        return cy.setRancherResource('v3', 'setting', 'display-add-extension-repos-banner', {
          ...resp.body,
          value: 'true'
        });
      }
    });

    const appRepoList = new RepositoriesPagePo('local', 'apps');

    // Ensure that the banner should be shown (by confirming that a required repo isn't there)
    appRepoList.goTo();
    appRepoList.waitForPage();
    appRepoList.sortableTable().noRowsShouldNotExist();
    appRepoList.sortableTable().rowNames().then((names) => {
      if (names.includes(UI_PLUGINS_PARTNERS_REPO_NAME)) {
        appRepoList.list().actionMenu(UI_PLUGINS_PARTNERS_REPO_NAME).getMenuItem('Delete').click();
        const promptRemove = new PromptRemove();

        return promptRemove.remove();
      }
    });

    // Now go to extensions (by nav, not page load....)
    appRepoList.navToMenuEntry('Extensions');

    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.waitForPage();
    extensionsPo.loading().should('not.exist');

    extensionsPo.repoBanner().checkVisible();
    extensionsPo.repoBanner().self().find('[data-testid="extensions-new-repos-banner-action-btn"]').click();
    extensionsPo.repoBanner().checkNotExists();

    // let's refresh the page to make sure it doesn't appear again...
    extensionsPo.goTo();
    extensionsPo.waitForPage();
    extensionsPo.waitForTitle();
    extensionsPo.loading().should('not.exist');
    extensionsPo.repoBanner().checkNotExists();
  });

  it('Should toggle the extension details', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    extensionsPo.extensionTabAvailableClick();

    // we should be on the extensions page
    extensionsPo.waitForTitle();

    // show extension details
    extensionsPo.extensionCardClick(EXTENSION_NAME);

    // after card click, we should get the info slide in panel
    extensionsPo.extensionDetails().should('be.visible');
    extensionsPo.extensionDetailsTitle().should('contain', EXTENSION_NAME);

    // close the details on the cross icon X
    extensionsPo.extensionDetailsCloseClick();
    extensionsPo.extensionDetails().should('not.be.visible');

    // show extension details again...
    extensionsPo.extensionCardClick(EXTENSION_NAME);
    extensionsPo.extensionDetails().should('be.visible');

    // clicking outside the details tab should also close it
    extensionsPo.extensionDetailsBgClick();
    extensionsPo.extensionDetails().should('not.be.visible');
  });

  it.skip('[Vue3 Skip]: Should install an extension', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    extensionsPo.extensionTabAvailableClick();

    // click on install button on card
    extensionsPo.extensionCardInstallClick(EXTENSION_NAME);
    extensionsPo.extensionInstallModal().should('be.visible');

    // select version and click install
    extensionsPo.installModalSelectVersionClick(2);
    extensionsPo.installModalInstallClick();

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();

    // make sure extension card is in the installed tab
    extensionsPo.extensionTabInstalledClick();
    extensionsPo.extensionCardClick(EXTENSION_NAME);
    extensionsPo.extensionDetailsTitle().should('contain', EXTENSION_NAME);
    extensionsPo.extensionDetailsCloseClick();
  });

  it.skip('[Vue3 Skip]: Should not display installed extensions within the available tab', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    // check for installed extension in "installed" tab
    extensionsPo.extensionTabInstalledClick();
    extensionsPo.extensionCard(EXTENSION_NAME).should('be.visible');

    // check for installed extension in "available" tab
    extensionsPo.extensionTabAvailableClick();
    extensionsPo.extensionCard(EXTENSION_NAME).should('not.exist');
  });

  it.skip('[Vue3 Skip]: Should update an extension version', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    extensionsPo.extensionTabInstalledClick();

    // click on update button on card
    extensionsPo.extensionCardUpdateClick(EXTENSION_NAME);
    extensionsPo.installModalInstallClick();

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();

    // make sure extension card is not available anymore on the updates tab
    // since we installed the latest version
    extensionsPo.extensionTabUpdatesClick();
    extensionsPo.extensionCard(EXTENSION_NAME).should('not.exist');
  });

  it.skip('[Vue3 Skip]: Should rollback an extension version', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    extensionsPo.extensionTabInstalledClick();

    // click on the rollback button on card
    // this will rollback to the immediate previous version
    extensionsPo.extensionCardRollbackClick(EXTENSION_NAME);
    extensionsPo.installModalInstallClick();

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();

    // make sure extension card is on the updates tab
    extensionsPo.extensionTabUpdatesClick();
    extensionsPo.extensionCard(EXTENSION_NAME).should('be.visible');
  });

  it.skip('[Vue3 Skip]: An extension larger than 20mb, which will trigger chacheState disabled, should install and work fine', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    extensionsPo.extensionTabAvailableClick();

    // click on install button on card
    extensionsPo.extensionCardInstallClick(DISABLED_CACHE_EXTENSION_NAME);
    extensionsPo.extensionInstallModal().should('be.visible');

    // click install
    extensionsPo.installModalInstallClick();

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();

    // make sure extension card is in the installed tab
    extensionsPo.extensionTabInstalledClick();
    extensionsPo.extensionCardClick(DISABLED_CACHE_EXTENSION_NAME);
    extensionsPo.extensionDetailsTitle().should('contain', DISABLED_CACHE_EXTENSION_NAME);
    extensionsPo.extensionDetailsCloseClick();

    // check if extension is working fine
    BurgerMenuPo.burgerMenuNavToMenubyLabel(DISABLED_CACHE_EXTENSION_MENU_LABEL);
    cy.get('h1').should('have.text', DISABLED_CACHE_EXTENSION_TITLE);
  });

  it.skip('[Vue3 Skip]: Should respect authentication when importing extension scripts', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    extensionsPo.extensionTabAvailableClick();

    // Install unauthenticated extension
    extensionsPo.extensionCardInstallClick(UNAUTHENTICATED_EXTENSION_NAME);
    extensionsPo.extensionInstallModal().should('be.visible');
    extensionsPo.installModalInstallClick();

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();

    // make sure both extensions have been imported
    extensionsPo.extensionScriptImport(UNAUTHENTICATED_EXTENSION_NAME).should('exist');
    extensionsPo.extensionScriptImport(EXTENSION_NAME).should('exist');

    cy.logout();

    // make sure only the unauthenticated extension has been imported after logout
    const loginPage = new LoginPagePo();

    loginPage.goTo();
    loginPage.waitForPage();
    loginPage.extensionScriptImport(UNAUTHENTICATED_EXTENSION_NAME).should('exist');
    loginPage.extensionScriptImport(EXTENSION_NAME).should('not.exist');

    // make sure both extensions have been imported after logging in again
    cy.login(undefined, undefined, false);
    extensionsPo.goTo();
    extensionsPo.waitForPage();
    extensionsPo.waitForTitle();
    extensionsPo.extensionScriptImport(UNAUTHENTICATED_EXTENSION_NAME).should('exist');
    extensionsPo.extensionScriptImport(EXTENSION_NAME).should('exist');
  });

  it.skip('[Vue3 Skip]: Should uninstall extensions', () => {
    // Because we logged out in the previous test this one will also have to use an uncached login
    cy.login(undefined, undefined, false);
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    extensionsPo.extensionTabInstalledClick();

    // click on uninstall button on card
    extensionsPo.extensionCardUninstallClick(EXTENSION_NAME);
    extensionsPo.extensionUninstallModal().should('be.visible');
    extensionsPo.uninstallModaluninstallClick();
    extensionsPo.extensionReloadBanner().should('be.visible');

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();

    // make sure extension card is in the available tab
    extensionsPo.extensionTabAvailableClick();
    extensionsPo.extensionCardClick(EXTENSION_NAME);
    extensionsPo.extensionDetailsTitle().should('contain', EXTENSION_NAME);
  });

  it.skip('[Vue3 Skip]: Should uninstall unathenticated extensions', () => {
    // Because we logged out in the previous test this one will also have to use an uncached login
    cy.login(undefined, undefined, false);
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    extensionsPo.extensionTabInstalledClick();

    // click on uninstall button on card
    extensionsPo.extensionCardUninstallClick(UNAUTHENTICATED_EXTENSION_NAME);
    extensionsPo.extensionUninstallModal().should('be.visible');
    extensionsPo.uninstallModaluninstallClick();
    extensionsPo.extensionReloadBanner().should('be.visible');

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();

    // make sure extension card is in the available tab
    extensionsPo.extensionTabAvailableClick();
    extensionsPo.extensionCardClick(UNAUTHENTICATED_EXTENSION_NAME);
    extensionsPo.extensionDetailsTitle().should('contain', UNAUTHENTICATED_EXTENSION_NAME);
  });

  it.skip('[Vue3 Skip]: Should uninstall un-cached extensions', () => {
    // Because we logged out in the previous test this one will also have to use an uncached login
    cy.login(undefined, undefined, false);
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    extensionsPo.extensionTabInstalledClick();

    // click on uninstall button on card
    extensionsPo.extensionCardUninstallClick(DISABLED_CACHE_EXTENSION_NAME);
    extensionsPo.extensionUninstallModal().should('be.visible');
    extensionsPo.uninstallModaluninstallClick();

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();

    // make sure extension card is in the available tab
    extensionsPo.extensionTabAvailableClick();
    extensionsPo.extensionCardClick(DISABLED_CACHE_EXTENSION_NAME);
    extensionsPo.extensionDetailsTitle().should('contain', DISABLED_CACHE_EXTENSION_NAME);
  });
});
