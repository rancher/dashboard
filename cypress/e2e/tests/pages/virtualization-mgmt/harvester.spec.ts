import ExtensionsPagePo from '@/cypress/e2e/po/pages/extensions.po';
import { HarvesterClusterDetailsPo, HarvesterClusterPagePo } from '@/cypress/e2e/po/pages/virtualization-mgmt/harvester-clusters.po';
import RepositoriesPagePo from '@/cypress/e2e/po/pages/chart-repositories.po';
import { LONG_TIMEOUT_OPT, MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import { CLUSTER_REPOS_BASE_URL } from '@/cypress/support/utils/api-endpoints';
import { qase } from '~/cypress/support/qase';
import { catchTargetPageException } from '@/cypress/support/utils/exception-utils';

const extensionsPo = new ExtensionsPagePo();
const harvesterPo = new HarvesterClusterPagePo();
const appRepoList = new RepositoriesPagePo(undefined, 'manager');

let harvesterClusterName = '';
// Incremented per test attempt so the imported-cluster name is unique across Cypress retries.
let harvesterClusterAttempt = 0;

// Cluster chart repository that supplies the Harvester UI extension (repo id, Git URL, branch) plus the
// product's display names—all differ for Community vs Prime, where Harvester is branded SUSE Virtualization.
const HARVESTER_EXTENSION_CATALOG = {
  community: {
    title:        'Harvester',
    productLabel: 'Virtualization Management',
    repo:         'harvester',
    gitRepo:      'https://github.com/harvester/harvester-ui-extension.git',
    gitBranch:    'gh-pages',
  },
  prime: {
    title:        'SUSE Virtualization',
    productLabel: 'SUSE Virtualization',
    repo:         'rancher',
    gitRepo:      'https://github.com/rancher/ui-plugin-charts',
    gitBranch:    'main',
  },
};

function harvesterExtensionCatalog(version: Cypress.RancherVersion) {
  return version.RancherPrime === 'true' ? HARVESTER_EXTENSION_CATALOG.prime : HARVESTER_EXTENSION_CATALOG.community;
}

// `extensionsPo.waitForTabs()` scrolls the tab bar into view before asserting. The extensions page
// re-mounts around installs and the reload banner, so the element handed to `cy.scrollIntoView()`
// detaches ("the page updated as a result of this command"). The tab bar is always at the top of the
// page, so skip the scroll.
const waitForExtensionTabs = () => extensionsPo.extensionTabs.checkVisible(LONG_TIMEOUT_OPT, { scrollIntoView: false });

// Repo download poll (~27s) + the post-refresh wait for the repo to be active (up to 200s), with headroom.
const HARVESTER_INSTALL_TIMEOUT_OPT = { timeout: 4 * 60 * 1000 };

// How long the app may take to give up on an install: repo download poll (~27s) + the wait for the repo to
// be active (up to 200s) + the chart lookup and install retries, with headroom.
const INSTALL_GIVE_UP_WINDOW_MS = 6 * 60 * 1000;
const MAX_REINSTALLS = 3;

function pollForInstall(deadline: number, reinstalls: number): void {
  cy.get('@installHarvesterExtension.all').then((installs: any) => {
    if (installs.length > 0 || Date.now() > deadline) {
      return;
    }

    harvesterPo.isInstallAbandoned().then((abandoned) => {
      if (abandoned && reinstalls > 0) {
        cy.log('The app gave up on the install - reloading the page and installing again');
        harvesterPo.goTo();
        harvesterPo.waitForPage();
        harvesterPo.updateOrInstallButton().clickWhenEnabled(LONG_TIMEOUT_OPT);
        cy.then(() => pollForInstall(Date.now() + INSTALL_GIVE_UP_WINDOW_MS, reinstalls - 1));

        return;
      }

      if (abandoned) {
        cy.log('The app gave up on the install and no reinstalls are left');

        return;
      }

      cy.wait(2000); // eslint-disable-line cypress/no-unnecessary-waiting
      pollForInstall(deadline, reinstalls);
    });
  });
}

/**
 * Install again if the app gave up on the install. When the repository's download takes longer than the
 * app waits for it, the app reports the install as failed and shows the manual install steps in place of
 * the Install button - or, if the repository index did not list the chart yet, "Could not find a compatible
 * version" with no button at all. Reload the page then - the repository now exists, so the page offers
 * Install for it - click Install, and keep watching in case the new attempt gives up too. Watches by time,
 * not by number of checks, starting when the commands run rather than when they are queued. Does not
 * assert, so a genuine failure is reported by the install wait that follows.
 */
function installAgainIfAbandoned(): void {
  cy.then(() => pollForInstall(Date.now() + INSTALL_GIVE_UP_WINDOW_MS, MAX_REINSTALLS));
}

// A Rancher replica that has not indexed a just-added repository yet answers an install with this 500
// (rancher/dashboard#17543). It clears once the replica catches up.
const TRANSIENT_INDEX_ERROR = /failed to find chart.*version.*not\s*found/i;

function isTransientIndexError(response: any): boolean {
  return response?.statusCode === 500 && TRANSIENT_INDEX_ERROR.test(response?.body?.message || '');
}

/**
 * Install the Harvester extension from the Available tab of the extensions page, through the install modal.
 * `selectVersion` picks the version in the open modal. If the install fails with the transient catalog index
 * 500, give a dashboard that retries it itself the time to do so, and otherwise open the modal and install
 * again. Any other failure fails the test, with Rancher's error message.
 */
function installFromExtensionsPage(harvesterTitle: string, selectVersion: () => void, attemptsLeft = 3): void {
  cy.get('@installHarvesterExtension.all').then((previousInstalls: any) => {
    const previousCount = previousInstalls.length;

    extensionsPo.goTo();
    waitForExtensionTabs();
    // goTo() lands on whichever tab the app defaults to, so switch to the Available tab explicitly.
    extensionsPo.extensionTabAvailableClick();
    extensionsPo.waitForPage(undefined, 'available', MEDIUM_TIMEOUT_OPT);
    extensionsPo.loading().should('not.exist');

    extensionsPo.extensionCardInstallClick(harvesterTitle);
    // The modal is fixed-position, so checkVisible()'s scrollIntoView is pointless and detaches the
    // subject while the dialog animates in - assert visibility without scrolling.
    extensionsPo.installModal().checkVisible(undefined, { scrollIntoView: false });
    selectVersion();
    extensionsPo.installModal().installButton().click();

    cy.wait('@installHarvesterExtension').then(({ response }) => {
      if (isTransientIndexError(response) && attemptsLeft > 1) {
        // A dashboard that retries this error itself does so within 15s (1s, 2s, 4s, 8s backoff).
        cy.wait(20000); // eslint-disable-line cypress/no-unnecessary-waiting
        cy.get('@installHarvesterExtension.all').then((installs: any) => {
          const lastResponse = installs[installs.length - 1]?.response;

          if (installs.length > previousCount + 1 && lastResponse?.statusCode === 201) {
            return;
          }

          cy.log('Rancher has not indexed the chart version yet - installing again');
          installFromExtensionsPage(harvesterTitle, selectVersion, attemptsLeft - 1);
        });

        return;
      }

      // Include the body so a failure reports Rancher's error message, not just the status code.
      expect(response?.statusCode, JSON.stringify(response?.body)).to.eq(201);
    });
  });
}

/**
 * Wait until Rancher no longer serves the Harvester UIPlugin. It outlives the uninstalled app for a moment,
 * and while it exists the UI still loads the extension (e.g. reporting "repository is missing").
 */
function waitForNoHarvesterUiPlugin(retries = 20): void {
  cy.getRancherResource('v1', 'catalog.cattle.io.uiplugins').then((resp: Cypress.Response<any>) => {
    const present = (resp.body?.data || []).some((plugin: any) => plugin?.spec?.plugin?.name === 'harvester');

    if (present && retries > 0) {
      cy.wait(1500); // eslint-disable-line cypress/no-unnecessary-waiting
      waitForNoHarvesterUiPlugin(retries - 1);
    }
  });
}

/**
 * Start every test, and every retry of it, from a clean state: testIsolation is off and the in-test cleanup
 * only runs when a test passes, so a failed attempt can leave the extension installed, its repository, and
 * the cluster it imported.
 */
function resetHarvesterState(repo: string): void {
  cy.createRancherResource('v1', 'catalog.cattle.io.apps/cattle-ui-plugin-system/harvester?action=uninstall', {}, false);
  cy.waitForRancherResource('v1', 'catalog.cattle.io.apps', 'cattle-ui-plugin-system/harvester', (resp) => resp.status === 404, 20, { failOnStatusCode: false })
    .should('eq', true);
  waitForNoHarvesterUiPlugin();

  cy.deleteRancherResource('v1', 'catalog.cattle.io.clusterrepos', repo, false);
  cy.waitForRancherResource('v1', 'catalog.cattle.io.clusterrepos', repo, (resp) => resp.status === 404, 20, { failOnStatusCode: false })
    .should('eq', true);

  cy.getRancherResource('v1', 'management.cattle.io.clusters').then((resp: Cypress.Response<any>) => {
    const leftoverIds = (resp.body?.data || [])
      .filter((cluster: any) => cluster?.spec?.displayName?.includes('harvesterclustername'))
      .map((cluster: any) => cluster.id);

    cy.wrap(leftoverIds, { log: false }).each((id: string) => {
      cy.deleteRancherResource('v1', 'provisioning.cattle.io.clusters', `fleet-default/${ id }`, false);
    });
  });
}

describe('Harvester', { tags: ['@virtualizationMgmt', '@adminUser'] }, () => {
  before(() => {
    cy.login();

    // Clean up stale Harvester extension app and extension source repos to prevent test collisions
    cy.createRancherResource('v1', 'catalog.cattle.io.apps/cattle-ui-plugin-system/harvester?action=uninstall', {}, false);
    cy.waitForRancherResource('v1', 'catalog.cattle.io.apps', 'cattle-ui-plugin-system/harvester', (resourceResp) => resourceResp.status === 404, 10, { failOnStatusCode: false })
      .should('eq', true);

    cy.getRancherResource('v1', 'catalog.cattle.io.clusterrepos').then((resp: Cypress.Response<any>) => {
      const extensionRepoUrls = ['rancher/ui-plugin-charts', 'harvester/harvester-ui-extension'];
      const matchingRepoIds = (resp.body?.data || [])
        .filter((repo: any) => extensionRepoUrls.some((url) => repo?.spec?.gitRepo?.includes(url)))
        .map((repo: any) => repo?.id)
        .filter((id: string | undefined) => !!id);

      cy.wrap(matchingRepoIds, { log: false }).each((repoId: string) => {
        cy.deleteRancherResource('v1', 'catalog.cattle.io.clusterrepos', repoId);
        cy.waitForRancherResource('v1', 'catalog.cattle.io.clusterrepos', repoId, (resourceResp) => resourceResp.status === 404, 10, { failOnStatusCode: false })
          .should('eq', true);
      });
    });
  });

  beforeEach(() => {
    cy.login();
    cy.getRancherVersion().then((version) => {
      cy.wrap(version, { log: false }).as('rancherVersion');
      resetHarvesterState(harvesterExtensionCatalog(version).repo);
    });
    cy.createE2EResourceName('harvesterclustername').then((name) => {
      // createE2EResourceName is deterministic within a run, so a Cypress retry would reuse
      // the name and collide (422) with the cluster a failed earlier attempt left behind:
      // importing via POST /v3/clusters also creates a management cluster, and the inline
      // cleanup only runs when the test succeeds. A unique name per attempt lets a retry
      // create cleanly and recover instead of wedging on the same 422.
      harvesterClusterName = `${ name }-${ ++harvesterClusterAttempt }`;
    });
  });

  qase(7020, it('can auto install harvester and begin process of importing a harvester cluster', () => {
    cy.get<Cypress.RancherVersion>('@rancherVersion').then((version) => {
      const { repo: chartRepo, title: harvesterTitle, productLabel } = harvesterExtensionCatalog(version);

      cy.intercept('POST', CLUSTER_REPOS_BASE_URL).as('createChart');
      cy.intercept('PUT', `${ CLUSTER_REPOS_BASE_URL }/${ chartRepo }`).as('updateChart');
      cy.intercept('POST', `${ CLUSTER_REPOS_BASE_URL }/${ chartRepo }?action=install`).as('installHarvesterExtension');
      cy.intercept('POST', '/v3/clusters').as('createHarvesterCluster');

      // verify install button and message displays
      harvesterPo.goTo();
      harvesterPo.waitForPage();
      harvesterPo.updateOrInstallButton().checkVisible(undefined, { scrollIntoView: false });
      harvesterPo.extensionWarning(LONG_TIMEOUT_OPT).should('have.text', `The ${ harvesterTitle } UI Extension is not installed`);

      // install harvester extension
      harvesterPo.updateOrInstallButton().click();
      cy.wait('@createChart', MEDIUM_TIMEOUT_OPT).its('response.statusCode').should('eq', 201);

      // Known issue rancher/dashboard#19476: after creating the repo the app polls only ~27s (11 x 2.5s)
      // for its git clone to download, then gives up with "Failed to add Helm Chart Repository" and never
      // sends the install - and on CI the clone regularly takes longer. Wait for the download at the API,
      // and if the app gave up, reload the page and click Install again: with the repo now present it
      // refreshes it and installs.
      cy.waitForRepositoryDownload('v1', 'catalog.cattle.io.clusterrepos', chartRepo, 60);
      installAgainIfAbandoned();

      // Don't wait for any @updateChart PUT - the app sends it a variable number of times. Wait for the
      // install request instead, with the app's own budget: after the download it forces a refresh and
      // waits up to 200s for the repo to be active again before it installs (shell/utils/uiplugins.ts).
      cy.wait('@installHarvesterExtension', HARVESTER_INSTALL_TIMEOUT_OPT);
      harvesterPo.waitForPage();
      // After the install the app waits for the extension, then for its package (up to 20 polls of 2.5s
      // each, so well over a minute on a slow install), and only then reloads. The warning stays up until
      // that reload, so give it the same budget as the install.
      harvesterPo.extensionWarning(HARVESTER_INSTALL_TIMEOUT_OPT).should('not.exist');

      // verify harvester extension added to extensions page
      extensionsPo.goTo();
      waitForExtensionTabs();
      // Don't rely on the default tab: switch to Installed explicitly, as the other tests do.
      extensionsPo.extensionTabInstalledClick();
      extensionsPo.waitForPage(undefined, 'installed');
      // The tabs render before the catalog/repos fetch finishes, so wait for the cards to load.
      extensionsPo.loading().should('not.exist');
      extensionsPo.extensionCard(harvesterTitle, LONG_TIMEOUT_OPT).self().should('be.visible');

      // verify harvester repo is added to repos list page
      appRepoList.goTo(undefined, 'manager');
      appRepoList.waitForPage();
      appRepoList.sortableTable().rowElementWithName(chartRepo).should('be.visible');
      appRepoList.list().state(chartRepo).contains('Active', LONG_TIMEOUT_OPT);

      // begin process of importing harvester cluster
      harvesterPo.goTo();
      harvesterPo.waitForPage();
      // As above, wait for the import button rather than for an @updateChart PUT that may never be sent.
      harvesterPo.importHarvesterClusterButton(LONG_TIMEOUT_OPT).should('be.visible');
      harvesterPo.importHarvesterClusterButton().click();
      harvesterPo.createHarvesterClusterForm().waitForPage(undefined, 'memberRoles');
      harvesterPo.createHarvesterClusterForm().title().should('contain', `${ harvesterTitle } Cluster:`);
      harvesterPo.createHarvesterClusterForm().nameNsDescription().name().set(harvesterClusterName);
      harvesterPo.createHarvesterClusterForm().nameNsDescription().description().set(`${ harvesterClusterName }-desc`);
      harvesterPo.createHarvesterClusterForm().resourceDetail().createEditView().create();
      cy.wait('@createHarvesterCluster').then(({ response }) => {
        expect(response?.statusCode).to.eq(201);

        const harvesterClusterId = response.body.id;
        const harvesterDetails = new HarvesterClusterDetailsPo(undefined, undefined, harvesterClusterId);

        harvesterDetails.waitForPage(undefined, 'registration');
        // The detail page's masthead does not always render (seen with the 1.9.0 extension), so check the
        // registration instructions are shown and that the cluster was created with the given name.
        cy.contains('cluster-registration-url', LONG_TIMEOUT_OPT).should('be.visible');
        cy.getRancherResource('v1', 'management.cattle.io.clusters', harvesterClusterId)
          .its('body.spec.displayName').should('eq', harvesterClusterName);

        // The list only shows the cluster once Rancher has linked the provisioning cluster to its management
        // cluster and marked that as a Harvester cluster. Wait for both before navigating to it.
        cy.waitForRancherResource('v1', 'provisioning.cattle.io.clusters', `fleet-default/${ harvesterClusterId }`, (resp) => !!resp.body?.status?.clusterName, 40, { failOnStatusCode: false })
          .should('eq', true);
        cy.waitForRancherResource('v1', 'management.cattle.io.clusters', harvesterClusterId, (resp) => (resp.body?.metadata?.labels?.['provider.cattle.io'] || resp.body?.status?.provider) === 'harvester', 40, { failOnStatusCode: false })
          .should('eq', true);

        // navigate to harvester list page and verify the logo and tagline do not display after cluster created
        HarvesterClusterPagePo.navTo(productLabel);
        harvesterPo.waitForPage();
        // Wait for the just-created cluster to render in the list before acting on it. `rowWithName()`
        // wraps an already-resolved chainable (`.should('exist').contains(...)`), so `checkVisible()`
        // hands `cy.scrollIntoView()` a frozen subject that detaches when the list re-renders; assert
        // visibility without scrolling instead.
        // The list container itself can take longer than the default timeout to render here, and a
        // timeout passed to rowElementWithName() does not reach that container lookup, so wait for it first
        // (list() is built from a selector, so the timeout applies to it).
        harvesterPo.list().self(LONG_TIMEOUT_OPT).should('exist');
        harvesterPo.list().resourceTable().sortableTable().rowElementWithName(harvesterClusterName, LONG_TIMEOUT_OPT)
          .should('be.visible');
        harvesterPo.harvesterLogo().should('not.exist');
        harvesterPo.harvesterTagline().should('not.exist');

        // #14285: Should be able to edit cluster here
        harvesterPo.list().actionMenu(harvesterClusterName).getMenuItem('Edit Config').should('exist');
        // delete cluster
        cy.deleteRancherResource('v1', 'provisioning.cattle.io.clusters', `fleet-default/${ harvesterClusterId }`);
      });
    });
  }));

  qase(7021, it('missing repo message should display when repo does NOT exist', () => {
    // Installing/reloading the extension issues background requests that can transiently fail; the
    // app surfaces that as an uncaught "Failed call" rejection which would fail the test.
    catchTargetPageException(['Failed call', 'Network Error']);

    cy.get<Cypress.RancherVersion>('@rancherVersion').then((version) => {
      const catalog = harvesterExtensionCatalog(version);
      const { repo: chartRepo, title: harvesterTitle } = catalog;

      cy.intercept('POST', `${ CLUSTER_REPOS_BASE_URL }/${ chartRepo }?action=install`).as('installHarvesterExtension');
      cy.intercept('PUT', `${ CLUSTER_REPOS_BASE_URL }/${ chartRepo }`).as('updateHarvesterChart');

      cy.createRancherResource('v1', 'catalog.cattle.io.clusterrepos', {
        type:     'catalog.cattle.io.clusterrepo',
        metadata: { name: catalog.repo },
        spec:     {
          clientSecret: null, gitRepo: catalog.gitRepo, gitBranch: catalog.gitBranch
        }
      });

      // The git clone can take well over the default ~30s on CI. If it hasn't finished, the extensions
      // page gets a 500 for the repo index and renders no cards, so fail here rather than later.
      cy.waitForRepositoryDownload('v1', 'catalog.cattle.io.clusterrepos', chartRepo, 80).should('eq', true);

      appRepoList.goTo(undefined, 'manager');
      appRepoList.waitForPage();
      appRepoList.sortableTable().rowElementWithName(chartRepo).should('be.visible');
      appRepoList.list().state(chartRepo).contains('Active', LONG_TIMEOUT_OPT);

      // Retry-safe (testIsolation is off and the before-hook cleanup runs only once): a prior attempt
      // may have left the Harvester extension installed - the inline uninstall only runs on success -
      // so it would be absent from the Available tab below and the install click times out on a missing
      // card. Ensure it is uninstalled first so this attempt (and any retry) starts installable.
      cy.createRancherResource('v1', 'catalog.cattle.io.apps/cattle-ui-plugin-system/harvester?action=uninstall', {}, false);
      cy.waitForRancherResource('v1', 'catalog.cattle.io.apps', 'cattle-ui-plugin-system/harvester', (r: any) => r?.status === 404, 15, { failOnStatusCode: false });

      // install the latest version
      installFromExtensionsPage(harvesterTitle, () => {
        extensionsPo.installModal().selectVersionClick(1);
      });
      // The app should switch to the Installed tab after install, but that navigation is
      // intermittent (the URL stays on #available); click it explicitly before waiting for it.
      extensionsPo.extensionTabInstalledClick();
      extensionsPo.waitForPage(undefined, 'installed');

      extensionsPo.extensionReloadBanner().should('be.visible');
      extensionsPo.extensionReloadClick();
      waitForExtensionTabs();
      extensionsPo.loading().should('not.exist');

      harvesterPo.goTo();
      harvesterPo.waitForPage();
      cy.wait('@updateHarvesterChart', LONG_TIMEOUT_OPT);
      harvesterPo.extensionWarning().should('not.exist');

      cy.deleteRancherResource('v1', 'catalog.cattle.io.clusterrepos', chartRepo);

      harvesterPo.goTo();
      harvesterPo.waitForPage();
      // verify missing repo message displays
      harvesterPo.extensionWarning(LONG_TIMEOUT_OPT).should('have.text', `The ${ harvesterTitle } UI Extension repository is missing`);

      // uninstall harvester
      cy.createRancherResource('v1', 'catalog.cattle.io.apps/cattle-ui-plugin-system/harvester?action=uninstall', {});

      // reload extensions
      extensionsPo.goTo();
      waitForExtensionTabs();
      extensionsPo.waitForPage();
      extensionsPo.loading().should('not.exist');
      extensionsPo.extensionReloadBanner().should('be.visible');
      extensionsPo.extensionReloadClick();
      waitForExtensionTabs();
      extensionsPo.loading().should('not.exist');

      // verify install button and message displays
      harvesterPo.goTo();
      harvesterPo.waitForPage();
      // The masthead button is always in view and this page re-renders as the extension warning
      // resolves, so assert visibility without scrolling (checkVisible() scrolls first).
      harvesterPo.updateOrInstallButton().checkVisible(undefined, { scrollIntoView: false });
      harvesterPo.extensionWarning(LONG_TIMEOUT_OPT).should('have.text', `The ${ harvesterTitle } UI Extension is not installed`);
    });
  }));

  qase(7022, it('able to update harvester extension version', () => {
    cy.get<Cypress.RancherVersion>('@rancherVersion').then((version) => {
      const catalog = harvesterExtensionCatalog(version);
      const { repo: chartRepo, title: harvesterTitle } = catalog;

      cy.intercept('POST', `${ CLUSTER_REPOS_BASE_URL }/${ chartRepo }?action=install`).as('installHarvesterExtension');
      cy.intercept('POST', `${ CLUSTER_REPOS_BASE_URL }/${ chartRepo }?action=upgrade`).as('upgradeHarvesterExtension');
      cy.intercept('PUT', `${ CLUSTER_REPOS_BASE_URL }/${ chartRepo }`).as('updateHarvesterChart');

      cy.createRancherResource('v1', 'catalog.cattle.io.clusterrepos', {
        type:     'catalog.cattle.io.clusterrepo',
        metadata: { name: catalog.repo },
        spec:     {
          clientSecret: null, gitRepo: catalog.gitRepo, gitBranch: catalog.gitBranch
        }
      });

      // The git clone can take well over the default ~30s on CI. If it hasn't finished, the extensions
      // page gets a 500 for the repo index and renders no cards, so fail here rather than later.
      cy.waitForRepositoryDownload('v1', 'catalog.cattle.io.clusterrepos', chartRepo, 80).should('eq', true);

      appRepoList.goTo(undefined, 'manager');
      appRepoList.waitForPage();
      appRepoList.sortableTable().rowElementWithName(chartRepo).should('be.visible');
      appRepoList.list().state(chartRepo).contains('Active', LONG_TIMEOUT_OPT);

      // Retry-safe (testIsolation is off and the before-hook cleanup runs only once): a prior attempt
      // may have left the Harvester extension installed - the inline uninstall only runs on success -
      // so it would be absent from the Available tab below and the install click times out on a missing
      // card. Ensure it is uninstalled first so this attempt (and any retry) starts installable.
      cy.createRancherResource('v1', 'catalog.cattle.io.apps/cattle-ui-plugin-system/harvester?action=uninstall', {}, false);
      cy.waitForRancherResource('v1', 'catalog.cattle.io.apps', 'cattle-ui-plugin-system/harvester', (r: any) => r?.status === 404, 15, { failOnStatusCode: false });

      let versions: string[] = [];

      // install an older version
      installFromExtensionsPage(harvesterTitle, () => {
        // Note - We can't fetch version from `catalog.cattle.io.clusterrepos/harvester?link=index` given it won't filter out invalid extensions
        // for example in rancher 2.12 the harvester 1.7.0 extension is invalid... however still returned... resulting in expected versions that don't exist as valid options
        extensionsPo.installModal().versionLabelSelect().toggle();
        extensionsPo.installModal().versionLabelSelect().getOptionsAsStrings().then((options) => {
          versions = options;
        });
        extensionsPo.installModal().selectVersionClick(2, false);
      });

      cy.then(() => {
        // As in the 7021 test: the switch to the Installed tab is intermittent, so click it explicitly.
        extensionsPo.extensionTabInstalledClick();
        extensionsPo.waitForPage(undefined, 'installed');

        extensionsPo.extensionReloadBanner().should('be.visible');
        extensionsPo.extensionReloadClick();
        waitForExtensionTabs();
        extensionsPo.loading().should('not.exist');

        // check harvester version on card - should be the latest available version
        extensionsPo.extensionCardVersion(harvesterTitle).should('contain', versions[0]);

        // hover checkmark - tooltip should have older version
        extensionsPo.extensionCardHeaderStatusTooltip(harvesterTitle, 1).waitForTooltipWithText(`Installed (${ versions[1] })`);

        harvesterPo.goTo();
        harvesterPo.waitForPage();
        cy.wait('@updateHarvesterChart', LONG_TIMEOUT_OPT);

        // check for update harvester message
        harvesterPo.extensionWarning(LONG_TIMEOUT_OPT).invoke('text').should('match', new RegExp(`^Your current ${ harvesterTitle } UI Extension \\((v[\\d.]+)\\) is not the latest\\.$`));
        harvesterPo.updateOrInstallButton().click();

        // wait for update version update
        cy.wait('@upgradeHarvesterExtension', LONG_TIMEOUT_OPT).its('request.body.charts.0.version').should('eq', versions[0]);
        // The app retries an upgrade that fails with a transient 500 (a Rancher replica's catalog index not
        // caught up yet, see installHelmChartWithRetry in shell/utils/uiplugins.ts), so check the last attempt.
        cy.get('@upgradeHarvesterExtension.all', LONG_TIMEOUT_OPT).should((upgrades: any) => {
          const response = upgrades[upgrades.length - 1]?.response;

          expect(response?.statusCode, JSON.stringify(response?.body)).to.eq(201);
        });
        cy.wait('@updateHarvesterChart', LONG_TIMEOUT_OPT);

        // verify update button and message not displayed
        harvesterPo.extensionWarning().should('not.exist');
        harvesterPo.updateOrInstallButton().checkNotExists();

        extensionsPo.goTo();
        waitForExtensionTabs();
        extensionsPo.waitForPage(undefined, 'installed');
        extensionsPo.loading().should('not.exist');
        // check harvester version on card after update - should be latest
        extensionsPo.extensionCardVersion(harvesterTitle).should('contain', versions[0]);

        // hover checkmark - tooltip should have latest version
        extensionsPo.extensionCardHeaderStatusTooltip(harvesterTitle, 0).waitForTooltipWithText(`Installed (${ versions[0] })`);
      });
    });
  }));

  afterEach(() => {
    // Ensure Harvester extension is uninstalled and repo is deleted
    cy.createRancherResource('v1', 'catalog.cattle.io.apps/cattle-ui-plugin-system/harvester?action=uninstall', {}, false);
    cy.get<Cypress.RancherVersion>('@rancherVersion').then((version) => {
      cy.deleteRancherResource('v1', 'catalog.cattle.io.clusterrepos', harvesterExtensionCatalog(version).repo, false);
      // Verify deletion completed before proceeding (with retries)
      cy.waitForRancherResource('v1', 'catalog.cattle.io.clusterrepos', harvesterExtensionCatalog(version).repo, (resp) => resp.status === 404, 10, { failOnStatusCode: false })
        .should('eq', true);
    });
  });
});
