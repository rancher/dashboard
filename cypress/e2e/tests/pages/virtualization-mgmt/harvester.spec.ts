import ExtensionsPagePo from '@/cypress/e2e/po/pages/extensions.po';
import { HarvesterClusterDetailsPo, HarvesterClusterPagePo } from '@/cypress/e2e/po/pages/virtualization-mgmt/harvester-clusters.po';
import RepositoriesPagePo from '@/cypress/e2e/po/pages/chart-repositories.po';
import { EXTRA_LONG_TIMEOUT_OPT, LONG_TIMEOUT_OPT, MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import { CLUSTER_REPOS_BASE_URL } from '@/cypress/support/utils/api-endpoints';

const extensionsPo = new ExtensionsPagePo();
const harvesterPo = new HarvesterClusterPagePo();
let harvesterClusterName = '';
const harvesterGitRepoName = 'harvester';
const branchName = 'gh-pages';
const harvesterGitRepoUrl = 'https://github.com/harvester/harvester-ui-extension.git';

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
  it('can auto install harvester and begin process of importing a harvester cluster', () => {
    cy.intercept('POST', CLUSTER_REPOS_BASE_URL).as('createHarvesterChart');
    cy.intercept('PUT', `${ CLUSTER_REPOS_BASE_URL }/${ harvesterGitRepoName }`).as('updateHarvesterChart');
    cy.intercept('POST', `${ CLUSTER_REPOS_BASE_URL }/${ harvesterGitRepoName }?action=install`).as('installHarvesterExtension');
    cy.intercept('POST', '/v3/clusters').as('createHarvesterCluster');

    // verify install button and message displays
    harvesterPo.goTo();
    harvesterPo.waitForPage();
    harvesterPo.updateOrInstallButton().checkVisible();
    harvesterPo.extensionWarning().should('have.text', 'The Harvester UI Extension is not installed');

    // install harvester extension
    harvesterPo.updateOrInstallButton().click();
    cy.wait('@createHarvesterChart', MEDIUM_TIMEOUT_OPT).its('response.statusCode').should('eq', 201);
    cy.wait('@updateHarvesterChart', MEDIUM_TIMEOUT_OPT).its('response.statusCode').should('eq', 200);
    cy.wait('@installHarvesterExtension', MEDIUM_TIMEOUT_OPT).its('response.statusCode').should('eq', 201);
    harvesterPo.waitForPage();
    cy.wait('@updateHarvesterChart', LONG_TIMEOUT_OPT).its('response.statusCode').should('eq', 200);
    harvesterPo.extensionWarning().should('not.exist');

    // verify harvester extension added to extensions page
    extensionsPo.goTo();
    extensionsPo.waitForPage(null, 'installed');
    extensionsPo.loading().should('not.exist');
    extensionsPo.extensionCard(harvesterGitRepoName).should('be.visible');

    // verify harvester repo is added to repos list page
    const appRepoList = new RepositoriesPagePo(undefined, 'manager');

    appRepoList.goTo();
    appRepoList.waitForPage();
    appRepoList.sortableTable().rowElementWithName(harvesterGitRepoName).should('be.visible');

    // begin process of importing harvester cluster
    harvesterPo.goTo();
    harvesterPo.waitForPage();
    cy.wait('@updateHarvesterChart', LONG_TIMEOUT_OPT);
    harvesterPo.importHarvesterClusterButton().click();
    harvesterPo.createHarvesterClusterForm().waitForPage(null, 'memberRoles');
    harvesterPo.createHarvesterClusterForm().title().should('contain', 'Harvester Cluster:');
    harvesterPo.createHarvesterClusterForm().nameNsDescription().name().set(harvesterClusterName);
    harvesterPo.createHarvesterClusterForm().nameNsDescription().description().set(`${ harvesterClusterName }-desc`);
    harvesterPo.createHarvesterClusterForm().resourceDetail().createEditView().create();
    cy.wait('@createHarvesterCluster').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);

      const harvesterClusterId = response.body.id;
      const harvesterDetails = new HarvesterClusterDetailsPo(undefined, undefined, harvesterClusterId);

      harvesterDetails.waitForPage(null, 'registration');
      harvesterDetails.title().should('contain', harvesterClusterName);

      // navigate to harvester list page and verify the logo and tagline do not display after cluster created
      HarvesterClusterPagePo.navTo();
      harvesterPo.waitForPage();
      harvesterPo.list().resourceTable().sortableTable().rowWithName(harvesterClusterName)
        .checkVisible();
      harvesterPo.harvesterLogo().should('not.exist');
      harvesterPo.harvesterTagline().should('not.exist');

      // delete cluster
      cy.deleteRancherResource('v1', 'provisioning.cattle.io.clusters', `fleet-default/${ harvesterClusterId }`);
    });
  });

  it('missing repo message should display when repo does NOT exist', () => {
    cy.intercept('POST', `${ CLUSTER_REPOS_BASE_URL }/${ harvesterGitRepoName }?action=install`).as('installHarvesterExtension');
    cy.intercept('PUT', `${ CLUSTER_REPOS_BASE_URL }/${ harvesterGitRepoName }`).as('updateHarvesterChart');

    // add harvester repo
    cy.createRancherResource('v1', 'catalog.cattle.io.clusterrepos', {
      type:     'catalog.cattle.io.clusterrepo',
      metadata: { name: harvesterGitRepoName },
      spec:     {
        clientSecret: null, gitRepo: harvesterGitRepoUrl, gitBranch: branchName
      }
    });

    extensionsPo.goTo();
    extensionsPo.waitForPage(null, 'available');
    extensionsPo.loading().should('not.exist');

    // click on install button on card
    extensionsPo.extensionCardInstallClick(harvesterGitRepoName);
    extensionsPo.extensionInstallModal().should('be.visible');

    // select latest version and click install
    extensionsPo.installModalSelectVersionClick(1);
    extensionsPo.installModalInstallClick();
    cy.wait('@installHarvesterExtension').its('response.statusCode').should('eq', 201);
    extensionsPo.waitForPage(null, 'installed');

    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();
    extensionsPo.loading().should('not.exist');

    harvesterPo.goTo();
    harvesterPo.waitForPage();
    cy.wait('@updateHarvesterChart', LONG_TIMEOUT_OPT);
    harvesterPo.extensionWarning().should('not.exist');

    // delete harvester repo
    cy.deleteRancherResource('v1', 'catalog.cattle.io.clusterrepos', harvesterGitRepoName);

    harvesterPo.goTo();
    harvesterPo.waitForPage();
    // verify missing repo message displays
    harvesterPo.extensionWarning().should('have.text', 'The Harvester UI Extension repository is missing');

    // uninstall harvester
    cy.createRancherResource('v1', 'catalog.cattle.io.apps/cattle-ui-plugin-system/harvester?action=uninstall', {});

    // reload extensions
    extensionsPo.goTo();
    extensionsPo.waitForPage();
    extensionsPo.loading().should('not.exist');
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();
    extensionsPo.loading().should('not.exist');

    // verify install button and message displays
    HarvesterClusterPagePo.navTo();
    harvesterPo.waitForPage();
    harvesterPo.updateOrInstallButton().checkVisible();
    harvesterPo.extensionWarning().should('have.text', 'The Harvester UI Extension is not installed');
  });

  it('able to update harvester extension version', () => {
    cy.intercept('POST', `${ CLUSTER_REPOS_BASE_URL }/${ harvesterGitRepoName }?action=install`).as('installHarvesterExtension');
    cy.intercept('POST', `${ CLUSTER_REPOS_BASE_URL }/${ harvesterGitRepoName }?action=upgrade`).as('upgradeHarvesterExtension');
    cy.intercept('PUT', `${ CLUSTER_REPOS_BASE_URL }/${ harvesterGitRepoName }`).as('updateHarvesterChart');
    cy.intercept('GET', `${ CLUSTER_REPOS_BASE_URL }/${ harvesterGitRepoName }?link=index`).as('getHarvesterVersions');

    // add harvester repo
    cy.createRancherResource('v1', 'catalog.cattle.io.clusterrepos', {
      type:     'catalog.cattle.io.clusterrepo',
      metadata: { name: harvesterGitRepoName },
      spec:     {
        clientSecret: null, gitRepo: harvesterGitRepoUrl, gitBranch: branchName
      }
    });

    extensionsPo.goTo();
    extensionsPo.waitForPage(null, 'available');
    extensionsPo.loading().should('not.exist');

    // get harvester extension versions
    cy.wait('@getHarvesterVersions').then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      const fetchedVersions = response?.body.entries.harvester.map((item: any) => item.version);

      cy.wrap(fetchedVersions).as('harvesterVersions');
    });

    // click on install button on card
    extensionsPo.extensionCardInstallClick(harvesterGitRepoName);
    extensionsPo.extensionInstallModal().should('be.visible');

    cy.get('@harvesterVersions').then((versions) => {
      // select older version and click install
      extensionsPo.installModalSelectVersionClick(2);
      extensionsPo.installModalInstallClick();
      cy.wait('@installHarvesterExtension').its('response.statusCode').should('eq', 201);
      extensionsPo.waitForPage(null, 'installed');

      extensionsPo.extensionReloadBanner().should('be.visible');
      extensionsPo.extensionReloadClick();
      extensionsPo.loading().should('not.exist');

      // check harvester version on card - should not be older version
      extensionsPo.extensionCardVersion(harvesterGitRepoName).should('contain', versions[1]);

      harvesterPo.goTo();
      harvesterPo.waitForPage();
      cy.wait('@updateHarvesterChart', EXTRA_LONG_TIMEOUT_OPT);

      // check for update harvester message
      harvesterPo.extensionWarning().should('have.text', 'The Harvester UI Extension is not updated');
      harvesterPo.updateOrInstallButton().click();

      // wait for update version update
      cy.wait('@upgradeHarvesterExtension', EXTRA_LONG_TIMEOUT_OPT).then(({ request, response }) => {
        expect(response?.statusCode).to.eq(201);
        expect(request?.body?.charts[0].version).to.eq(versions[0]);
      });
      cy.wait('@updateHarvesterChart', EXTRA_LONG_TIMEOUT_OPT);

      // verify update button and message not displayed
      harvesterPo.extensionWarning().should('not.exist');
      harvesterPo.updateOrInstallButton().checkNotExists();

      extensionsPo.goTo();
      extensionsPo.waitForPage(null, 'installed');
      extensionsPo.loading().should('not.exist');
      // check harvester version on card after update - should be latest
      extensionsPo.extensionCardVersion(harvesterGitRepoName).should('contain', versions[0]);
    });
  });

  afterEach(() => {
    cy.createRancherResource('v1', 'catalog.cattle.io.apps/cattle-ui-plugin-system/harvester?action=uninstall', {}, false);
    cy.deleteRancherResource('v1', 'catalog.cattle.io.clusterrepos', harvesterGitRepoName, false);
  });
});
