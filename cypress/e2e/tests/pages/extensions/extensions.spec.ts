import ExtensionsPagePo from '@/cypress/e2e/po/pages/extensions.po';
import RepositoriesPagePo from '@/cypress/e2e/po/pages/chart-repositories.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import { LoginPagePo } from '@/cypress/e2e/po/pages/login-page.po';
import UiPluginsPagePo from '@/cypress/e2e/po/pages/explorer/uiplugins.po';
import { NamespaceFilterPo } from '@/cypress/e2e/po/components/namespace-filter.po';
import { CLUSTER_REPOS_BASE_URL } from '@/cypress/support/utils/api-endpoints';
import { LONG_TIMEOUT_OPT, MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import { catchTargetPageException } from '@/cypress/support/utils/exception-utils';

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
    // Tolerate the transient app-side "Failed call" unhandled rejection from the
    // Steve request layer (it retries internally). It surfaces intermittently while
    // the extensions views load/reload - e.g. after a successful upgrade the reload
    // would throw and fail the test even though the extension was already upgraded,
    // leaving no Upgrade action for the retry.
    catchTargetPageException(['Failed call', 'Network Error']);
  });

  it('should go to the available tab by default and preserve active tab on reload', () => {
    const extensionsPo = new ExtensionsPagePo();

    // With no extensions installed, should default to "Available"
    extensionsPo.goTo();
    extensionsPo.waitForPage(undefined, 'available');

    // Preserve active tab on reload
    cy.setUserPreference({ 'plugin-developer': true });
    extensionsPo.goTo(); // reload to get pref
    extensionsPo.waitForPage(undefined, 'available');
    extensionsPo.extensionTabBuiltinClick();
    extensionsPo.waitForPage(undefined, 'builtin');
    cy.reload();
    extensionsPo.waitForPage(undefined, 'builtin');
    cy.setUserPreference({ 'plugin-developer': false });
  });

  it('should show built-in extensions only when configured', () => {
    const extensionsPo = new ExtensionsPagePo();
    const pluginVersion = '1.0.0';

    cy.setUserPreference({ 'plugin-developer': false });
    extensionsPo.goTo();
    extensionsPo.waitForPage(undefined, 'available');

    // Should not be able to see the built-in tab
    extensionsPo.extensionTabBuiltin().checkNotExists();

    // Set the preference
    cy.setUserPreference({ 'plugin-developer': true });
    extensionsPo.goTo();
    extensionsPo.waitForPage(undefined, 'available');

    // Reload
    extensionsPo.extensionTabBuiltin().checkExists();
    extensionsPo.waitForPage(undefined, 'available');
    extensionsPo.extensionTabBuiltinClick();
    extensionsPo.waitForPage(undefined, 'builtin');

    // AKS Provisioning
    extensionsPo.extensionCardVersion('AKS Provisioning').should('contain', pluginVersion);
    extensionsPo.extensionCardClick('AKS Provisioning');
    extensionsPo.extensionDetailsTitle().should('contain', 'AKS Provisioning');
    extensionsPo.extensionDetailsVersion().should('contain', pluginVersion);
    extensionsPo.extensionDetailsCloseClick();

    // EKS Provisioning
    extensionsPo.extensionCardVersion('EKS Provisioning').should('contain', pluginVersion);
    extensionsPo.extensionCardClick('EKS Provisioning');
    extensionsPo.extensionDetailsTitle().should('contain', 'EKS Provisioning');
    extensionsPo.extensionDetailsVersion().should('contain', pluginVersion);
    extensionsPo.extensionDetailsCloseClick();

    // GKE Provisioning
    extensionsPo.extensionCardVersion('GKE Provisioning').should('contain', pluginVersion);
    extensionsPo.extensionCardClick('GKE Provisioning');
    extensionsPo.extensionDetailsTitle().should('contain', 'GKE Provisioning');
    extensionsPo.extensionDetailsVersion().should('contain', pluginVersion);
    extensionsPo.extensionDetailsCloseClick();

    // Virtualization Manager
    extensionsPo.extensionCardVersion('Virtualization Manager').should('contain', pluginVersion);
    extensionsPo.extensionCardClick('Virtualization Manager');
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
    extensionsPo.extensionTabAvailableClick(); // Avoid nav guard failures that probably auto move user to this tab

    // install the rancher plugin examples
    extensionsPo.addExtensionsRepository('https://github.com/rancher/ui-plugin-examples', 'main', GIT_REPO_NAME).then(() => {
      removeExtensions = true;
    });
  });

  it('has the correct title for Prime users and should display banner on main extensions screen EVEN IF setting is empty string', { tags: '@prime' }, () => {
    cy.getRancherResource('v3', 'setting', 'display-add-extension-repos-banner', undefined).then((resp: Cypress.Response<any>) => {
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

    // if rancher prime, title should be Rancher Prime - Extensions, otherewise Rancher - Extensions
    cy.getRancherVersion(true).then((version) => {
      const expectedTitle = version.RancherPrime === 'true' ? 'Rancher Prime - Extensions' : 'Rancher - Extensions';

      cy.title().should('eq', expectedTitle);
    });

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

    // check if burger menu nav is highlighted correctly for extensions
    // https://github.com/rancher/dashboard/issues/10010
    BurgerMenuPo.checkIfMenuItemLinkIsHighlighted('Extensions');

    // catching regression https://github.com/rancher/dashboard/issues/10576
    BurgerMenuPo.checkIfClusterMenuLinkIsHighlighted(cluster, false);

    // go to "add rancher repositories"
    // Wait for the tabs AND the card content to finish loading before opening the menu: tab/card
    // content rendering resizes the window, which closes the actions menu between opening it and
    // clicking the item (the observed flake where the Add flow silently never ran). Settling the
    // layout first keeps the menu open through the item click.
    extensionsPo.waitForTabs();
    extensionsPo.loading().should('not.exist');
    extensionsPo.extensionMenuToggle();
    extensionsPo.addRepositoriesClick();

    // add the partners repo - confirm the modal actually opened before clicking Add, otherwise a
    // missed menu interaction would no-op the Add click and leave the repo unadded (row-not-found).
    extensionsPo.addReposModal().should('be.visible');
    extensionsPo.addReposModalAddClick();
    extensionsPo.addReposModal().should('not.exist');

    // go to repos list page
    const appRepoList = new RepositoriesPagePo(cluster, 'apps');

    appRepoList.goTo(cluster, 'apps');
    appRepoList.waitForPage();
    appRepoList.sortableTable().rowElementWithName(UI_PLUGINS_PARTNERS_REPO_URL).should('exist');
  });

  it('New repos banner should only appear once (after dismiss should NOT appear again)', () => {
    cy.getRancherResource('v3', 'setting', 'display-add-extension-repos-banner').then((resp: Cypress.Response<any>) => {
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
    appRepoList.goTo(cluster, 'apps');
    appRepoList.waitForPage();
    appRepoList.sortableTable().checkLoadingIndicatorNotVisible();
    appRepoList.sortableTable().noRowsShouldNotExist();
    appRepoList.sortableTable().rowNames().then((names: any) => {
      if (names.includes(UI_PLUGINS_PARTNERS_REPO_NAME)) {
        // Ensure the row exists before opening action menu
        appRepoList.sortableTable().rowElementWithName(UI_PLUGINS_PARTNERS_REPO_NAME).should('be.visible');

        const actionMenu = appRepoList.list().actionMenu(UI_PLUGINS_PARTNERS_REPO_NAME);

        actionMenu.getMenuItem('Delete').click();
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
    extensionsPo.waitForPage(undefined, 'available');

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
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();
    extensionsPo.waitForTabs();

    const install = () => {
      cy.intercept('POST', `${ CLUSTER_REPOS_BASE_URL }/${ GIT_REPO_NAME }?action=install`).as('installExtension');

      extensionsPo.extensionTabAvailableClick();
      extensionsPo.waitForPage(undefined, 'available');

      // click on install button on card
      extensionsPo.extensionCardInstallClick(EXTENSION_NAME);
      extensionsPo.installModal().checkVisible();

      // select version and click install
      extensionsPo.installModal().selectVersionClick(2);
      extensionsPo.installModal().installButton().click();
      cy.wait('@installExtension').its('response.statusCode').should('eq', 201);

      // let's check the extension reload banner and reload the page
      extensionsPo.extensionReloadBanner().should('be.visible');
      extensionsPo.extensionReloadClick();
    };

    // Idempotent across retries: the install succeeds but the test can still fail
    // afterwards (e.g. the post-install reload lands on the Available tab instead of
    // Installed), and on the retry the extension is already installed so it is no
    // longer on the Available tab. Only install when it is not already installed.
    extensionsPo.checkForExtensionTab('installed').then((installedTabRendered) => {
      if (!installedTabRendered) {
        install();

        return;
      }

      extensionsPo.extensionTabInstalledClick();
      extensionsPo.waitForPage(undefined, 'installed');
      extensionsPo.checkForExtensionCardWithName(EXTENSION_NAME).then((alreadyInstalled) => {
        if (!alreadyInstalled) {
          install();
        }
      });
    });

    // make sure extension card is in the installed tab (end state, whether this
    // attempt installed it or a previous one did)
    extensionsPo.extensionTabInstalledClick();
    extensionsPo.waitForPage(undefined, 'installed');
    extensionsPo.extensionCardClick(EXTENSION_NAME);
    extensionsPo.extensionDetailsTitle().should('contain', EXTENSION_NAME);
    extensionsPo.extensionDetailsCloseClick();
  });

  it('Should not display installed extensions within the available tab', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    // check for installed extension in "installed" tab
    extensionsPo.extensionTabInstalledClick();
    extensionsPo.waitForPage(undefined, 'installed');
    extensionsPo.extensionCard(EXTENSION_NAME).checkVisible();

    // check for installed extension in "available" tab
    extensionsPo.extensionTabAvailableClick();
    extensionsPo.waitForPage(undefined, 'available');
    cy.contains(`[data-testid="extension-card-${ EXTENSION_NAME }"]`).should('not.exist');
  });

  it('Should upgrade an extension version', () => {
    cy.intercept('POST', `${ CLUSTER_REPOS_BASE_URL }/${ GIT_REPO_NAME }?action=upgrade`).as('upgradeExtension');
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();

    extensionsPo.extensionTabInstalledClick();
    extensionsPo.waitForPage(undefined, 'installed');
    extensionsPo.loading().should('not.exist');

    // Ensure the extension card is visible and loaded before trying to upgrade
    extensionsPo.extensionCard(EXTENSION_NAME).checkVisible();

    // Idempotent across retries (testIsolation is off): attempt 1 can upgrade the extension to the
    // latest version - the @upgradeExtension 201 already fires - and then still fail afterwards on the
    // post-reload tab check. On the retry the extension is already at latest, so the card no longer
    // offers an "Upgrade" action and a plain retry can NEVER pass (it hard-fails looking for it). Only
    // drive the upgrade when it is actually available; the end-state assertions below then hold whether
    // this attempt upgraded it or a previous one did.
    extensionsPo.clickActionIfPresent(EXTENSION_NAME, 'Upgrade').then((upgrading: boolean) => {
      if (!upgrading) {
        return;
      }

      extensionsPo.installModal().installButton().click();
      cy.wait('@upgradeExtension').its('response.statusCode').should('eq', 201);

      // let's check the extension reload banner and reload the page
      extensionsPo.extensionReloadBanner().should('be.visible');
      extensionsPo.extensionReloadClick();

      // [CREATE ISSUE TO INVESTIGATE] Clicking the extension reload banner re-initialises the whole app
      // and intermittently lands on the extensions page with the tabs container never mounting
      // ("extension-tabs not found"). The reload should reliably re-render the extensions page (or
      // recover) rather than occasionally leaving it half-mounted.
      //
      // The extension reload re-initialises the whole app and occasionally lands on a page where the
      // tabs container never mounts (seen as "extension-tabs not found"). A fresh navigation to the
      // extensions page recovers deterministically off a clean load before we wait for the tabs.
      extensionsPo.goTo();
      extensionsPo.waitForPage();
      extensionsPo.waitForTabs();
    });

    // make sure extension card is still on the installed tab
    // since we installed the latest version
    extensionsPo.extensionTabInstalledClick();
    extensionsPo.waitForPage(undefined, 'installed');
    extensionsPo.extensionCard(EXTENSION_NAME).checkVisible();
  });

  it('Should downgrade an extension version', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();

    extensionsPo.extensionTabInstalledClick();
    extensionsPo.waitForPage(undefined, 'installed');

    // click on the downgrade button on card
    // this will downgrade to the immediate previous version
    extensionsPo.extensionCardDowngradeClick(EXTENSION_NAME);
    extensionsPo.installModal().installButton().click();

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();

    // make sure extension card is on the installed tab and is visible
    extensionsPo.extensionTabInstalledClick();
    extensionsPo.waitForPage(undefined, 'installed');
    extensionsPo.extensionCard(EXTENSION_NAME).checkVisible();
  });

  // ui-plugin-operator updated cache disabled threshold to 30mb as per https://github.com/rancher/rancher/pull/47565
  it('An extension larger than 30mb, which will trigger cacheState disabled, should install and work fine', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();
    extensionsPo.waitForTabs();

    const install = () => {
      extensionsPo.extensionTabAvailableClick();
      extensionsPo.waitForPage(undefined, 'available');
      extensionsPo.loading().should('not.exist');

      // click on install button on card
      // (clickAction waits for the card to render before interacting)
      extensionsPo.extensionCardInstallClick(DISABLED_CACHE_EXTENSION_NAME);
      extensionsPo.installModal().checkVisible();

      // click install
      extensionsPo.installModal().installButton().click();

      // let's check the extension reload banner and reload the page
      extensionsPo.extensionReloadBanner().should('be.visible');
      extensionsPo.extensionReloadClick();
    };

    // Idempotent across retries: installing this large extension can fail late with
    // a transient app-side error (SURE-9177) after the extension is already
    // installed. On the retry its card has moved from Available to Installed, so
    // blindly re-running the install flow times out looking for it in Available.
    // Only install when it is not already installed; either way verify the end state.
    extensionsPo.checkForExtensionTab('installed').then((installedTabRendered) => {
      if (!installedTabRendered) {
        install();

        return;
      }

      extensionsPo.extensionTabInstalledClick();
      extensionsPo.waitForPage(undefined, 'installed');
      extensionsPo.checkForExtensionCardWithName(DISABLED_CACHE_EXTENSION_NAME).then((alreadyInstalled) => {
        if (!alreadyInstalled) {
          install();
        }
      });
    });

    // make sure extension card is in the installed tab
    extensionsPo.extensionTabInstalledClick();
    extensionsPo.waitForPage(undefined, 'installed');
    // The >30mb extension installs/renders slowly (cacheState disabled), so its card can take
    // well over the default window to appear under CI load; wait longer before clicking it.
    extensionsPo.extensionCardClick(DISABLED_CACHE_EXTENSION_NAME, LONG_TIMEOUT_OPT);
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

    uiPluginsPo.resourceTable().sortableTable().groupByButtons(1).click();
    uiPluginsPo.cacheState(DISABLED_CACHE_EXTENSION_NAME).should('contain.text', 'disabled');
  });

  it('Should respect authentication when importing extension scripts', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();

    // Retry-independence: a prior attempt can install uk-locale and then fail later, leaving it on
    // the Installed tab so this attempt can no longer find it on Available to install. Uninstall it
    // first (idempotent - a no-op when it is not installed), then re-open a clean Extensions page
    // (the helper leaves the extension details view open).
    uninstallExtensionIdempotently(extensionsPo, UNAUTHENTICATED_EXTENSION_NAME);
    extensionsPo.goTo();
    extensionsPo.waitForPage();

    extensionsPo.extensionTabAvailableClick();
    extensionsPo.waitForPage(undefined, 'available');
    extensionsPo.loading().should('not.exist');

    // Install unauthenticated extension
    cy.intercept('POST', `${ CLUSTER_REPOS_BASE_URL }/${ GIT_REPO_NAME }?action=install`).as('installUnauthenticated');
    extensionsPo.extensionCardInstallClick(UNAUTHENTICATED_EXTENSION_NAME);
    extensionsPo.installModal().checkVisible();
    extensionsPo.installModal().installButton().click();
    // Wait for the install request to be accepted before reloading. Reloading while the install is
    // still in flight leaves the Extensions page stuck on "Loading..." - the other install tests in
    // this spec all wait here too.
    cy.wait('@installUnauthenticated', MEDIUM_TIMEOUT_OPT).its('response.statusCode').should('be.oneOf', [200, 201]);

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();
    extensionsPo.waitForPage(undefined, 'installed');
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
    extensionsPo.waitForPage(undefined, 'installed', MEDIUM_TIMEOUT_OPT);
    extensionsPo.loading().should('not.exist');
    extensionsPo.waitForTitle();
    extensionsPo.extensionScriptImport(UNAUTHENTICATED_EXTENSION_NAME).should('exist');
    extensionsPo.extensionScriptImport(EXTENSION_NAME).should('exist');
  });

  const uninstallExtensionIdempotently = (extensionsPo: ExtensionsPagePo, extensionName: string) => {
    // Idempotent across retries: an attempt can uninstall the extension and then fail
    // later (e.g. a transient app error during reload), and on the retry the extension
    // is no longer on the Installed tab, so blindly clicking uninstall times out
    // looking for its card. Only run the uninstall flow when it is still installed, and
    // verify the end state (card back on the Available tab) either way.
    extensionsPo.checkForExtensionTab('installed').then((installedTabRendered) => {
      if (!installedTabRendered) {
        return;
      }

      extensionsPo.extensionTabInstalledClick();
      extensionsPo.waitForPage(undefined, 'installed');
      extensionsPo.checkForExtensionCardWithName(extensionName).then((isInstalled) => {
        if (!isInstalled) {
          return;
        }

        extensionsPo.extensionCardUninstallClick(extensionName);
        extensionsPo.extensionUninstallModal().should('be.visible');
        extensionsPo.uninstallModalUninstallClick();
        extensionsPo.extensionReloadBanner().should('be.visible');
        extensionsPo.extensionReloadClick();
      });
    });

    // make sure extension card is in the available tab (end state)
    extensionsPo.extensionTabAvailableClick();
    extensionsPo.waitForPage(undefined, 'available');
    extensionsPo.extensionCardClick(extensionName);
    extensionsPo.extensionDetailsTitle().should('contain', extensionName);
  };

  it('Should uninstall extensions', () => {
    // Because we logged out in the previous test this one will also have to use an uncached login
    cy.login(undefined, undefined, false);
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();
    extensionsPo.waitForTabs();

    uninstallExtensionIdempotently(extensionsPo, EXTENSION_NAME);
  });

  it('Should uninstall unauthenticated extensions', () => {
    // Because we logged out in the previous test this one will also have to use an uncached login
    cy.login(undefined, undefined, false);
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();
    extensionsPo.waitForTabs();

    uninstallExtensionIdempotently(extensionsPo, UNAUTHENTICATED_EXTENSION_NAME);
  });

  it('Should uninstall un-cached extensions', () => {
    // Because we logged out in the previous test this one will also have to use an uncached login
    cy.login(undefined, undefined, false);
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();
    extensionsPo.waitForTabs();

    // Idempotent across retries: large-extension is the last installed extension by
    // this point (clock and uk-locale were uninstalled by the previous tests), so once
    // an attempt uninstalls it the Installed tab disappears and a retry can never
    // re-open it. Only run the uninstall flow when it is still installed.
    extensionsPo.checkForExtensionTab('installed').then((installedTabRendered) => {
      if (!installedTabRendered) {
        return;
      }

      extensionsPo.extensionTabInstalledClick();
      extensionsPo.waitForPage(undefined, 'installed');
      extensionsPo.checkForExtensionCardWithName(DISABLED_CACHE_EXTENSION_NAME).then((isInstalled) => {
        if (!isInstalled) {
          return;
        }

        // click on uninstall button on card
        extensionsPo.extensionCardUninstallClick(DISABLED_CACHE_EXTENSION_NAME);
        extensionsPo.extensionUninstallModal().should('be.visible');
        extensionsPo.uninstallModalUninstallClick();

        // let's check the extension reload banner and reload the page
        extensionsPo.extensionReloadBanner().should('be.visible');
        extensionsPo.extensionReloadClick();
      });
    });

    // make sure extension card is in the available tab (end state, whether this attempt
    // performed the uninstall or a previous one already did)
    extensionsPo.extensionTabAvailableClick();
    extensionsPo.waitForPage(undefined, 'available');
    // The >30mb extension installs/renders slowly (cacheState disabled), so its card can take
    // well over the default window to appear under CI load; wait longer before clicking it.
    extensionsPo.extensionCardClick(DISABLED_CACHE_EXTENSION_NAME, LONG_TIMEOUT_OPT);
    extensionsPo.extensionDetailsTitle().should('contain', DISABLED_CACHE_EXTENSION_NAME);
  });

  after(() => {
    if ( removeExtensions ) {
      cy.deleteRancherResource('v1', 'catalog.cattle.io.clusterrepos', GIT_REPO_NAME);
    }
  });
});
