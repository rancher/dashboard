import ExtensionsPagePo from '@/cypress/e2e/po/pages/extensions.po';
import { HarvesterClusterDetailsPo, HarvesterClusterPagePo } from '@/cypress/e2e/po/pages/virtualization-mgmt/harvester-clusters.po';
import RepositoriesPagePo from '@/cypress/e2e/po/pages/chart-repositories.po';
import { LONG_TIMEOUT_OPT, MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import { CLUSTER_REPOS_BASE_URL } from '@/cypress/support/utils/api-endpoints';

const extensionsPo = new ExtensionsPagePo();
const harvesterPo = new HarvesterClusterPagePo();
const appRepoList = new RepositoriesPagePo(undefined, 'manager');

let harvesterClusterName = '';
const harvesterGitRepoName = 'harvester';
const harvesterTitle = 'Harvester';
const branchName = 'gh-pages';
const harvesterGitRepoUrl = 'https://github.com/harvester/harvester-ui-extension.git';

/**
 * Conditional retry for Harvester extension installation based on UI warning message
 * Checks for the "Warning, Harvester UI extension automatic installation failed" message
 * and reloads the page to retry if detected
 * Need conditional retry until this is resolved https://github.com/rancher/dashboard/issues/13093
 */
function conditionalRetryHarvesterInstallation() {
  // Check if the installation failed warning is displayed
  harvesterPo.extensionWarning().then(($warning) => {
    if ($warning.text().includes('Warning, Harvester UI extension automatic installation failed')) {
      cy.log('Detected Harvester installation failed warning, reloading page and retrying...');
      cy.reload();
      harvesterPo.waitForPage();
      // Second attempt at installation after reload...
      harvesterPo.updateOrInstallButton().click();
    } else {
      cy.log('No installation failed warning detected, proceeding normally');
    }
  });
}

describe('Harvester', { tags: ['@virtualizationMgmt', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
    cy.createE2EResourceName('harvesterclustername').then((name) => {
      harvesterClusterName = name;
    });
  });

  /**
   * Assumes that Harvester Extension is NOT installed
   *
   * Harvester Extension will also be removed after all tests run
   *
   * (pattern needs fixing)
   */
  
  // it('can auto install harvester and begin process of importing a harvester cluster', () => {
  //   cy.intercept('POST', CLUSTER_REPOS_BASE_URL).as('createHarvesterChart');
  //   cy.intercept('PUT', `${ CLUSTER_REPOS_BASE_URL }/${ harvesterGitRepoName }`).as('updateHarvesterChart');
  //   cy.intercept('POST', `${ CLUSTER_REPOS_BASE_URL }/${ harvesterGitRepoName }?action=install`).as('installHarvesterExtension');
  //   cy.intercept('POST', '/v3/clusters').as('createHarvesterCluster');

  //   // create harvester repository and wait for repo downloaded
  //   cy.createRancherResource('v1', 'catalog.cattle.io.clusterrepos', {
  //     type:     'catalog.cattle.io.clusterrepo',
  //     metadata: { name: harvesterGitRepoName },
  //     spec:     {
  //       clientSecret: null, gitRepo: harvesterGitRepoUrl, gitBranch: branchName
  //     }
  //   });
  //   cy.waitForRepositoryDownload('v1', 'catalog.cattle.io.clusterrepos', harvesterGitRepoName);

  //   // verify install button and message displays
  //   harvesterPo.goTo();
  //   harvesterPo.waitForPage();
  //   harvesterPo.updateOrInstallButton().checkVisible();
  //   harvesterPo.extensionWarning().should('have.text', 'The Harvester UI Extension is not installed');

  //   // install harvester extension
  //   // Note: installHarvesterExtension() (triggered by this click) awaits the chart
  //   // refresh PUT (aliased @updateHarvesterChart, see intercept above) before it awaits
  //   // the install POST, so the @installHarvesterExtension wait right after this already
  //   // proves the refresh happened and resolved - no need for a separate network wait
  //   // here that isn't gating anything the rest of the test depends on.
  //   harvesterPo.updateOrInstallButton().click();
  //   // Wait for the installation request and handle 500 errors
  //   cy.wait('@installHarvesterExtension', MEDIUM_TIMEOUT_OPT).then((interception) => {
  //     const statusCode = interception.response?.statusCode;

  //     if (statusCode === 201) {
  //       cy.log('Harvester extension installation succeeded on first attempt');
  //     } else if (statusCode === 500) {
  //       cy.log('Harvester extension installation failed with 500 error, lets retry...');
  //       conditionalRetryHarvesterInstallation();
  //     } else {
  //       throw new Error(`Unexpected status code: ${ statusCode }`);
  //     }
  //   });
  //   harvesterPo.waitForPage();
  //   // Assert on the resulting UI state (the warning clearing) instead of the chart
  //   // refresh network call directly - more robust than a network wait, and this is
  //   // what the test actually cares about. Give it the same budget the network wait
  //   // used to have, since it now has to cover the refresh completing *and* the DOM
  //   // updating in response.
  //   harvesterPo.extensionWarning(LONG_TIMEOUT_OPT).should('not.exist');

  //   // verify harvester extension added to extensions page
  //   extensionsPo.goTo();
  //   extensionsPo.waitForPage(null, 'installed');
  //   extensionsPo.loading().should('not.exist');
  //   extensionsPo.extensionCard(harvesterTitle).checkVisible();

  //   // verify harvester repo is added to repos list page
  //   appRepoList.goTo(undefined, 'manager');
  //   appRepoList.waitForPage();
  //   appRepoList.sortableTable().rowElementWithName(harvesterGitRepoName).should('be.visible');
  //   appRepoList.list().state(harvesterGitRepoName).contains('Active', LONG_TIMEOUT_OPT);

  //   // begin process of importing harvester cluster
  //   harvesterPo.goTo();
  //   harvesterPo.waitForPage();
  //   // Assert the import button is visible/ready (UI-state proxy for the chart refresh
  //   // having completed) instead of waiting on the refresh network call directly -
  //   // .click() alone only auto-retries with the default timeout, which may not be
  //   // enough while the refresh is still in flight.
  //   harvesterPo.importHarvesterClusterButton(LONG_TIMEOUT_OPT).should('be.visible').click();
  //   harvesterPo.createHarvesterClusterForm().waitForPage(null, 'memberRoles');
  //   harvesterPo.createHarvesterClusterForm().title().should('contain', 'Harvester Cluster:');
  //   harvesterPo.createHarvesterClusterForm().nameNsDescription().name().set(harvesterClusterName);
  //   harvesterPo.createHarvesterClusterForm().nameNsDescription().description().set(`${ harvesterClusterName }-desc`);
  //   harvesterPo.createHarvesterClusterForm().resourceDetail().createEditView().create();
  //   cy.wait('@createHarvesterCluster').then(({ response }) => {
  //     expect(response?.statusCode).to.eq(201);

  //     const harvesterClusterId = response.body.id;
  //     const harvesterDetails = new HarvesterClusterDetailsPo(undefined, undefined, harvesterClusterId);

  //     harvesterDetails.waitForPage(null, 'registration');
  //     harvesterDetails.title().should('contain', harvesterClusterName);

  //     // navigate to harvester list page and verify the logo and tagline do not display after cluster created
  //     HarvesterClusterPagePo.navTo();
  //     harvesterPo.waitForPage();
  //     harvesterPo.list().resourceTable().sortableTable().rowWithName(harvesterClusterName)
  //       .checkVisible();
  //     harvesterPo.harvesterLogo().should('not.exist');
  //     harvesterPo.harvesterTagline().should('not.exist');

  //     // #14285: Should be able to edit cluster here
  //     harvesterPo.list().actionMenu(harvesterClusterName).getMenuItem('Edit Config').should('exist');
  //     // delete cluster
  //     cy.deleteRancherResource('v1', 'provisioning.cattle.io.clusters', `fleet-default/${ harvesterClusterId }`);
  //   });
  // });

  // it('missing repo message should display when repo does NOT exist', () => {
  //   cy.viewport(1280, 800); // Extra height so we see all versions in the drop-down list
  //   cy.intercept('POST', `${ CLUSTER_REPOS_BASE_URL }/${ harvesterGitRepoName }?action=install`).as('installHarvesterExtension');
  //   cy.intercept('PUT', `${ CLUSTER_REPOS_BASE_URL }/${ harvesterGitRepoName }`).as('updateHarvesterChart');

  //   // add harvester repo
  //   cy.createRancherResource('v1', 'catalog.cattle.io.clusterrepos', {
  //     type:     'catalog.cattle.io.clusterrepo',
  //     metadata: { name: harvesterGitRepoName },
  //     spec:     {
  //       clientSecret: null, gitRepo: harvesterGitRepoUrl, gitBranch: branchName
  //     }
  //   });

  //   // Wait for repository to be downloaded and ready
  //   cy.waitForRepositoryDownload('v1', 'catalog.cattle.io.clusterrepos', harvesterGitRepoName);

  //   appRepoList.goTo(undefined, 'manager');
  //   appRepoList.waitForPage();
  //   appRepoList.sortableTable().rowElementWithName(harvesterGitRepoName).should('be.visible');
  //   appRepoList.list().state(harvesterGitRepoName).contains('Active', LONG_TIMEOUT_OPT);

  //   extensionsPo.goTo();
  //   extensionsPo.waitForPage(null, 'available', MEDIUM_TIMEOUT_OPT);
  //   extensionsPo.loading().should('not.exist');

  //   // click on install button on card
  //   extensionsPo.extensionCardInstallClick(harvesterTitle);
  //   extensionsPo.installModal().checkVisible();

  //   // select latest version and click install
  //   extensionsPo.installModal().selectVersionClick(1);
  //   extensionsPo.installModal().installButton().click();
  //   cy.wait('@installHarvesterExtension').its('response.statusCode').should('eq', 201);
  //   extensionsPo.waitForPage(null, 'installed');

  //   extensionsPo.extensionReloadBanner().should('be.visible');
  //   extensionsPo.extensionReloadClick();
  //   extensionsPo.loading().should('not.exist');

  //   harvesterPo.goTo();
  //   harvesterPo.waitForPage();
  //   // Assert on the resulting UI state (the warning clearing) instead of the chart
  //   // refresh network call directly - see the equivalent comment in the first test.
  //   harvesterPo.extensionWarning(LONG_TIMEOUT_OPT).should('not.exist');

  //   // delete harvester repo
  //   cy.deleteRancherResource('v1', 'catalog.cattle.io.clusterrepos', harvesterGitRepoName);

  //   harvesterPo.goTo();
  //   harvesterPo.waitForPage();
  //   // verify missing repo message displays
  //   harvesterPo.extensionWarning().should('have.text', 'The Harvester UI Extension repository is missing');

  //   // uninstall harvester
  //   cy.createRancherResource('v1', 'catalog.cattle.io.apps/cattle-ui-plugin-system/harvester?action=uninstall', {});

  //   // reload extensions
  //   extensionsPo.goTo();
  //   extensionsPo.waitForPage();
  //   extensionsPo.loading().should('not.exist');
  //   extensionsPo.extensionReloadBanner().should('be.visible');
  //   extensionsPo.extensionReloadClick();
  //   extensionsPo.loading().should('not.exist');

  //   // verify install button and message displays
  //   HarvesterClusterPagePo.navTo();
  //   harvesterPo.waitForPage();
  //   harvesterPo.updateOrInstallButton().checkVisible();
  //   harvesterPo.extensionWarning().should('have.text', 'The Harvester UI Extension is not installed');
  // });

  // it('able to update harvester extension version', () => {
  //   cy.viewport(1280, 800);
  //   cy.intercept('POST', `${ CLUSTER_REPOS_BASE_URL }/${ harvesterGitRepoName }?action=install`).as('installHarvesterExtension');
  //   cy.intercept('POST', `${ CLUSTER_REPOS_BASE_URL }/${ harvesterGitRepoName }?action=upgrade`).as('upgradeHarvesterExtension');
  //   cy.intercept('PUT', `${ CLUSTER_REPOS_BASE_URL }/${ harvesterGitRepoName }`).as('updateHarvesterChart');

  //   // add harvester repo
  //   cy.createRancherResource('v1', 'catalog.cattle.io.clusterrepos', {
  //     type:     'catalog.cattle.io.clusterrepo',
  //     metadata: { name: harvesterGitRepoName },
  //     spec:     {
  //       clientSecret: null, gitRepo: harvesterGitRepoUrl, gitBranch: branchName
  //     }
  //   });

  //   // Wait for repository to be downloaded and ready
  //   cy.waitForRepositoryDownload('v1', 'catalog.cattle.io.clusterrepos', harvesterGitRepoName);

  //   appRepoList.goTo(undefined, 'manager');
  //   appRepoList.waitForPage();
  //   appRepoList.sortableTable().rowElementWithName(harvesterGitRepoName).should('be.visible');
  //   appRepoList.list().state(harvesterGitRepoName).contains('Active', LONG_TIMEOUT_OPT);

  //   extensionsPo.goTo();
  //   extensionsPo.waitForPage(null, 'available', MEDIUM_TIMEOUT_OPT);
  //   extensionsPo.loading().should('not.exist');

  //   // click on install button on card
  //   extensionsPo.extensionCardInstallClick(harvesterTitle);
  //   extensionsPo.installModal().checkVisible();

  //   // Note - We can't fetch version from `catalog.cattle.io.clusterrepos/harvester?link=index` given it won't filter out invalid extensions
  //   // for example in rancher 2.12 the harvester 1.7.0 extension is invalid... however still returned... resulting in expected versions that don't exist as valid options

  //   extensionsPo.installModal().versionLabelSelect().toggle();
  //   extensionsPo.installModal().versionLabelSelect().getOptionsAsStrings().then((versions) => {
  //     // select older version and click install
  //     extensionsPo.installModal().selectVersionClick(2, false);
  //     extensionsPo.installModal().installButton().click();
  //     cy.wait('@installHarvesterExtension').its('response.statusCode').should('eq', 201);
  //     extensionsPo.waitForPage(null, 'installed');

  //     extensionsPo.extensionReloadBanner().should('be.visible');
  //     extensionsPo.extensionReloadClick();
  //     extensionsPo.loading().should('not.exist');

  //     // check harvester version on card - should be the latest available version
  //     extensionsPo.extensionCardVersion(harvesterTitle).should('contain', versions[0]);

  //     // hover checkmark - tooltip should have older version
  //     // Longer timeout: the tooltip reflects async UI state that can lag briefly
  //     // behind the install/upgrade action completing.
  //     extensionsPo.extensionCardHeaderStatusTooltip(harvesterTitle, 1).waitForTooltipWithText(`Installed (${ versions[1] })`, MEDIUM_TIMEOUT_OPT);

  //     harvesterPo.goTo();
  //     harvesterPo.waitForPage();

  //     // check for update harvester message - assert on the resulting UI state (the
  //     // "not the latest" message appearing) instead of the chart refresh network
  //     // call directly; give it the refresh network wait's old budget since it now
  //     // has to cover the refresh completing *and* the DOM updating in response.
  //     harvesterPo.extensionWarning(LONG_TIMEOUT_OPT).invoke('text').should('match', /^Your current Harvester UI Extension \((v[\d.]+)\) is not the latest\.$/);
  //     harvesterPo.updateOrInstallButton().click();

  //     // wait for update version update
  //     cy.wait('@upgradeHarvesterExtension', LONG_TIMEOUT_OPT).then(({ request, response }) => {
  //       expect(response?.statusCode).to.eq(201);
  //       expect(request?.body?.charts[0].version).to.eq(versions[0]);
  //     });

  //     // verify update button and message not displayed - assert on the resulting UI
  //     // state instead of the chart refresh network call directly; give it the
  //     // removed network wait's old budget for the same reason as above.
  //     harvesterPo.extensionWarning(LONG_TIMEOUT_OPT).should('not.exist');
  //     harvesterPo.updateOrInstallButton().checkNotExists();

  //     extensionsPo.goTo();
  //     extensionsPo.waitForPage(null, 'installed');
  //     extensionsPo.loading().should('not.exist');
  //     // check harvester version on card after update - should be latest
  //     extensionsPo.extensionCardVersion(harvesterTitle).should('contain', versions[0]);

  //     // hover checkmark - tooltip should have latest version
  //     extensionsPo.extensionCardHeaderStatusTooltip(harvesterTitle, 0).waitForTooltipWithText(`Installed (${ versions[0] })`, MEDIUM_TIMEOUT_OPT);
  //   });
  // });

  afterEach(() => {
    cy.createRancherResource('v1', 'catalog.cattle.io.apps/cattle-ui-plugin-system/harvester?action=uninstall', {}, false);
    cy.deleteRancherResource('v1', 'catalog.cattle.io.clusterrepos', harvesterGitRepoName, false);
  });
});
