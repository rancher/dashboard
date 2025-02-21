import ExtensionsPagePo from '@/cypress/e2e/po/pages/extensions.po';
import RepositoriesPagePo from '@/cypress/e2e/po/pages/chart-repositories.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import { LoginPagePo } from '@/cypress/e2e/po/pages/login-page.po';
import UiPluginsPagePo from '@/cypress/e2e/po/pages/explorer/uiplugins.po';
import { NamespaceFilterPo } from '@/cypress/e2e/po/components/namespace-filter.po';

const namespaceFilter = new NamespaceFilterPo();
const cluster = 'local';
let removeExtensions = false;

const DISABLED_CACHE_EXTENSION_NAME = 'large-extension';
// const DISABLED_CACHE_EXTENSION_MENU_LABEL = 'Large-extension';
// const DISABLED_CACHE_EXTENSION_TITLE = 'Large extension demo (> 20mb) - cache testing';
const UNAUTHENTICATED_EXTENSION_NAME = 'uk-locale';
const EXTENSION_NAME = 'clock';
const UI_PLUGINS_PARTNERS_REPO_URL = 'https://github.com/rancher/partner-extensions';
const UI_PLUGINS_PARTNERS_REPO_NAME = 'partner-extensions';
const GIT_REPO_NAME = 'rancher-plugin-examples';

describe('Extensions page', { tags: ['@extensions', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('should go to the available tab by default', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage(null, 'available');
  });

  it('should show built-in extensions only when configured', () => {
    const extensionsPo = new ExtensionsPagePo();
    const pluginVersion = '1.0.0';

    cy.setUserPreference({ 'plugin-developer': false });
    extensionsPo.goTo();
    extensionsPo.waitForPage(null, 'available');

    // Should not be able to see the built-in tab
    extensionsPo.extensionTabBuiltin().checkNotExists();

    // Set the preference
    cy.setUserPreference({ 'plugin-developer': true });
    extensionsPo.goTo();
    extensionsPo.waitForPage(null, 'available');

    // Reload
    extensionsPo.extensionTabBuiltin().checkExists();
    extensionsPo.waitForPage(null, 'available');
    extensionsPo.extensionTabBuiltinClick();
    extensionsPo.waitForPage(null, 'builtin');

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

    cy.setUserPreference({ 'plugin-developer': false });
  });

  it('add repository', () => {
    // This should be in a `before` however is flaky. Move it to an `it` to let cypress retry
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();
    extensionsPo.extensionTabInstalledClick(); // Avoid nav guard failures that probably auto move user to this tab

    // install the rancher plugin examples
    extensionsPo.addExtensionsRepository('https://github.com/rancher/ui-plugin-examples', 'main', GIT_REPO_NAME).then(() => {
      removeExtensions = true;
    });
  });

  it('has the correct title for Prime users and should display banner on main extensions screen EVEN IF setting is empty string', () => {
    cy.getRancherResource('v3', 'setting', 'display-add-extension-repos-banner', null).then((resp: Cypress.Response<any>) => {
      const notFound = resp.status === 404;
      const requiredValue = resp.body?.value === '';

      if (notFound || requiredValue) {
        cy.log('Good test state', '/v3/setting/display-add-extension-repos-banner', resp.status, JSON.stringify(resp?.body || {}));
      } else {
        cy.log('Bad test state', '/v3/setting/display-add-extension-repos-banner', resp.status, JSON.stringify(resp?.body || {}));

        return cy.setRancherResource('v3', 'setting', 'display-add-extension-repos-banner', {
          ...resp.body,
          value: ''
        });
      }
    });

    cy.intercept('GET', '/rancherversion', {
      statusCode: 200,
      body:       {
        Version:      '9bf6631da',
        GitCommit:    '9bf6631da',
        RancherPrime: 'true'
      }
    });

    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForTitle();

    // in this case, vendor is Rancher because title depends on many different variables such as brand and settings
    cy.title().should('eq', 'Rancher - Extensions');

    extensionsPo.repoBanner().checkVisible();
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
    BurgerMenuPo.checkIfClusterMenuLinkIsHighlighted(cluster, false);

    // go to "add rancher repositories"
    extensionsPo.extensionMenuToggle();
    extensionsPo.addRepositoriesClick();

    // add the partners repo
    extensionsPo.addReposModalAddClick();
    extensionsPo.addReposModal().should('not.exist');

    // go to repos list page
    const appRepoList = new RepositoriesPagePo(cluster, 'apps');

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

    const appRepoList = new RepositoriesPagePo(cluster, 'apps');

    // Ensure that the banner should be shown (by confirming that a required repo isn't there)
    appRepoList.goTo();
    appRepoList.waitForPage();
    appRepoList.sortableTable().checkLoadingIndicatorNotVisible();
    appRepoList.sortableTable().noRowsShouldNotExist();
    appRepoList.sortableTable().rowNames().then((names: any) => {
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
    extensionsPo.waitForPage(null, 'available');

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

  it('Should install an extension', () => {
    cy.intercept('POST', `/v1/catalog.cattle.io.clusterrepos/${ GIT_REPO_NAME }?action=install`).as('installExtension');
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();

    extensionsPo.extensionTabAvailableClick();
    extensionsPo.waitForPage(null, 'available');

    // click on install button on card
    extensionsPo.extensionCardInstallClick(EXTENSION_NAME);
    extensionsPo.extensionInstallModal().should('be.visible');

    // select version and click install
    extensionsPo.installModalSelectVersionClick(2);
    extensionsPo.installModalInstallClick();
    cy.wait('@installExtension').its('response.statusCode').should('eq', 201);

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();

    // make sure extension card is in the installed tab
    extensionsPo.extensionTabInstalledClick();
    extensionsPo.waitForPage(null, 'installed');
    extensionsPo.extensionCardClick(EXTENSION_NAME);
    extensionsPo.extensionDetailsTitle().should('contain', EXTENSION_NAME);
    extensionsPo.extensionDetailsCloseClick();
  });

  it('Should not display installed extensions within the available tab', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    // check for installed extension in "installed" tab
    extensionsPo.extensionTabInstalledClick();
    extensionsPo.waitForPage(null, 'installed');
    extensionsPo.extensionCard(EXTENSION_NAME).should('be.visible');

    // check for installed extension in "available" tab
    extensionsPo.extensionTabAvailableClick();
    extensionsPo.waitForPage(null, 'available');
    cy.contains(`[data-testid="extension-card-${ EXTENSION_NAME }"]`).should('not.exist');
  });

  it('Should update an extension version', () => {
    cy.intercept('POST', `/v1/catalog.cattle.io.clusterrepos/${ GIT_REPO_NAME }?action=upgrade`).as('upgradeExtension');
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();

    extensionsPo.extensionTabInstalledClick();
    extensionsPo.waitForPage(null, 'installed');

    // click on update button on card
    extensionsPo.extensionCardUpdateClick(EXTENSION_NAME);
    extensionsPo.installModalInstallClick();
    cy.wait('@upgradeExtension').its('response.statusCode').should('eq', 201);

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();

    // make sure extension card is not available anymore on the updates tab
    // since we installed the latest version
    extensionsPo.extensionTabUpdatesClick();
    extensionsPo.waitForPage(null, 'updates');
    cy.contains(`[data-testid="extension-card-${ EXTENSION_NAME }"]`).should('not.exist');
  });

  it('Should rollback an extension version', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();

    extensionsPo.extensionTabInstalledClick();
    extensionsPo.waitForPage(null, 'installed');

    // click on the rollback button on card
    // this will rollback to the immediate previous version
    extensionsPo.extensionCardRollbackClick(EXTENSION_NAME);
    extensionsPo.installModalInstallClick();

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();

    // make sure extension card is on the updates tab
    extensionsPo.extensionTabUpdatesClick();
    extensionsPo.waitForPage(null, 'updates');
    extensionsPo.extensionCard(EXTENSION_NAME).should('be.visible');
  });

  // ui-plugin-operator updated cache disabled threshold to 30mb as per https://github.com/rancher/rancher/pull/47565
  it('An extension larger than 30mb, which will trigger cacheState disabled, should install and work fine', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();

    extensionsPo.extensionTabAvailableClick();
    extensionsPo.waitForPage(null, 'available');

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
    extensionsPo.waitForPage(null, 'installed');
    extensionsPo.extensionCardClick(DISABLED_CACHE_EXTENSION_NAME);
    extensionsPo.extensionDetailsTitle().should('contain', DISABLED_CACHE_EXTENSION_NAME);
    extensionsPo.extensionDetailsCloseClick();

    // installing an extension with cache state = "disabled" may result in intermittence on installation SURE-9177
    // reported but not yet addressed 100%
    // // check if extension is working fine
    // BurgerMenuPo.burgerMenuNavToMenubyLabel(DISABLED_CACHE_EXTENSION_MENU_LABEL);
    // cy.get('h1').should('have.text', DISABLED_CACHE_EXTENSION_TITLE);

    // check if cache state is disabled
    const uiPluginsPo = new UiPluginsPagePo(cluster);

    uiPluginsPo.goTo();
    uiPluginsPo.waitForPage();

    // toggle namespace to all
    namespaceFilter.toggle();
    namespaceFilter.clickOptionByLabel('All Namespaces');
    namespaceFilter.closeDropdown();

    uiPluginsPo.cacheState(DISABLED_CACHE_EXTENSION_NAME).should('contain.text', 'disabled');
  });

  it('Should respect authentication when importing extension scripts', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();

    extensionsPo.extensionTabAvailableClick();
    extensionsPo.waitForPage(null, 'available');
    extensionsPo.loading().should('not.exist');

    // Install unauthenticated extension
    extensionsPo.extensionCardInstallClick(UNAUTHENTICATED_EXTENSION_NAME);
    extensionsPo.extensionInstallModal().should('be.visible');
    extensionsPo.installModalInstallClick();

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();
    extensionsPo.waitForPage(null, 'installed');
    extensionsPo.loading().should('not.exist');

    // make sure both extensions have been imported
    extensionsPo.extensionScriptImport(UNAUTHENTICATED_EXTENSION_NAME).should('exist');
    extensionsPo.extensionScriptImport(EXTENSION_NAME).should('exist');

    cy.logout();

    // make sure only the unauthenticated extension has been imported after logout
    const loginPage = new LoginPagePo();

    loginPage.goTo();
    loginPage.waitForPage();
    loginPage.extensionScriptImport(UNAUTHENTICATED_EXTENSION_NAME).should('exist');
    cy.contains(`[id*="${ EXTENSION_NAME }"]`).should('not.exist');

    // make sure both extensions have been imported after logging in again
    cy.login(undefined, undefined, false);
    extensionsPo.goTo();
    extensionsPo.waitForPage(null, 'installed');
    extensionsPo.loading().should('not.exist');
    extensionsPo.waitForTitle();
    extensionsPo.extensionScriptImport(UNAUTHENTICATED_EXTENSION_NAME).should('exist');
    extensionsPo.extensionScriptImport(EXTENSION_NAME).should('exist');
  });

  it('Should uninstall extensions', () => {
    // Because we logged out in the previous test this one will also have to use an uncached login
    cy.login(undefined, undefined, false);
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();

    extensionsPo.extensionTabInstalledClick();
    extensionsPo.waitForPage(null, 'installed');

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
    extensionsPo.waitForPage(null, 'available');
    extensionsPo.extensionCardClick(EXTENSION_NAME);
    extensionsPo.extensionDetailsTitle().should('contain', EXTENSION_NAME);
  });

  it('Should uninstall unauthenticated extensions', () => {
    // Because we logged out in the previous test this one will also have to use an uncached login
    cy.login(undefined, undefined, false);
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();

    extensionsPo.extensionTabInstalledClick();
    extensionsPo.waitForPage(null, 'installed');

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
    extensionsPo.waitForPage(null, 'available');
    extensionsPo.extensionCardClick(UNAUTHENTICATED_EXTENSION_NAME);
    extensionsPo.extensionDetailsTitle().should('contain', UNAUTHENTICATED_EXTENSION_NAME);
  });

  it('Should uninstall un-cached extensions', () => {
    // Because we logged out in the previous test this one will also have to use an uncached login
    cy.login(undefined, undefined, false);
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();

    extensionsPo.extensionTabInstalledClick();
    extensionsPo.waitForPage(null, 'installed');

    // click on uninstall button on card
    extensionsPo.extensionCardUninstallClick(DISABLED_CACHE_EXTENSION_NAME);
    extensionsPo.extensionUninstallModal().should('be.visible');
    extensionsPo.uninstallModaluninstallClick();

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();

    // make sure extension card is in the available tab
    extensionsPo.extensionTabAvailableClick();
    extensionsPo.waitForPage(null, 'available');
    extensionsPo.extensionCardClick(DISABLED_CACHE_EXTENSION_NAME);
    extensionsPo.extensionDetailsTitle().should('contain', DISABLED_CACHE_EXTENSION_NAME);
  });

  after(() => {
    if ( removeExtensions ) {
      cy.deleteRancherResource('v1', 'catalog.cattle.io.clusterrepos', GIT_REPO_NAME);
    }
  });
});
