import ExtensionsPagePo from '@/cypress/e2e/po/pages/extensions.po';
import { HarvesterClusterDetailsPo, HarvesterClusterPagePo } from '@/cypress/e2e/po/pages/virtualization-mgmt/harvester-clusters.po';
import RepositoriesPagePo from '@/cypress/e2e/po/pages/chart-repositories.po';
import { LONG_TIMEOUT_OPT, MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import { CLUSTER_REPOS_BASE_URL } from '@/cypress/support/utils/api-endpoints';
import { qase } from '~/cypress/support/qase';

const extensionsPo = new ExtensionsPagePo();
const harvesterPo = new HarvesterClusterPagePo();
const appRepoList = new RepositoriesPagePo(undefined, 'manager');

let harvesterClusterName = '';
const harvesterTitle = 'Harvester';

// Cluster chart repository that supplies the Harvester UI extension (repo id, Git URL, branch)—differs for Community vs Prime.
const HARVESTER_EXTENSION_CATALOG = {
  community: {
    repo:      'harvester',
    gitRepo:   'https://github.com/harvester/harvester-ui-extension.git',
    gitBranch: 'gh-pages',
  },
  prime: {
    repo:      'rancher',
    gitRepo:   'https://github.com/rancher/ui-plugin-charts',
    gitBranch: 'main',
  },
};

function harvesterExtensionCatalog(version: Cypress.RancherVersion) {
  return version.RancherPrime === 'true' ? HARVESTER_EXTENSION_CATALOG.prime : HARVESTER_EXTENSION_CATALOG.community;
}

describe('Harvester', { tags: ['@virtualizationMgmt', '@adminUser'] }, () => {
  before(() => {
    cy.login();

    // Clean up stale Harvester extension app and extension source repos to prevent test collisions
    cy.createRancherResource('v1', 'catalog.cattle.io.apps/cattle-ui-plugin-system/harvester?action=uninstall', {}, false);

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
    });
    cy.createE2EResourceName('harvesterclustername').then((name) => {
      harvesterClusterName = name;
    });
  });

  qase(7020, it('can auto install harvester and begin process of importing a harvester cluster', () => {
    cy.get<Cypress.RancherVersion>('@rancherVersion').then((version) => {
      const catalog = harvesterExtensionCatalog(version);
      const chartRepo = catalog.repo;

      cy.intercept('POST', CLUSTER_REPOS_BASE_URL).as('createChart');
      cy.intercept('PUT', `${ CLUSTER_REPOS_BASE_URL }/${ chartRepo }`).as('updateChart');
      cy.intercept('POST', `${ CLUSTER_REPOS_BASE_URL }/${ chartRepo }?action=install`).as('installHarvesterExtension');
      cy.intercept('POST', '/v3/clusters').as('createHarvesterCluster');

      // verify install button and message displays
      harvesterPo.goTo();
      harvesterPo.waitForPage();
      harvesterPo.updateOrInstallButton().checkVisible();
      harvesterPo.extensionWarning().should('have.text', 'The Harvester UI Extension is not installed');

      // install harvester extension
      harvesterPo.updateOrInstallButton().click();
      cy.wait('@createChart', MEDIUM_TIMEOUT_OPT).its('response.statusCode').should('eq', 201);
      cy.wait('@updateChart', MEDIUM_TIMEOUT_OPT).its('response.statusCode').should('eq', 200);
      cy.wait('@installHarvesterExtension', MEDIUM_TIMEOUT_OPT);
      harvesterPo.waitForPage();
      cy.wait('@updateChart', LONG_TIMEOUT_OPT).its('response.statusCode').should('eq', 200);
      harvesterPo.extensionWarning(MEDIUM_TIMEOUT_OPT).should('not.exist');

      // verify harvester extension added to extensions page
      extensionsPo.goTo();
      extensionsPo.waitForTabs();
      extensionsPo.waitForPage(null, 'installed');
      extensionsPo.extensionCard(harvesterTitle).checkVisible();

      // verify harvester repo is added to repos list page
      appRepoList.goTo(undefined, 'manager');
      appRepoList.waitForPage();
      appRepoList.sortableTable().rowElementWithName(chartRepo).should('be.visible');
      appRepoList.list().state(chartRepo).contains('Active', LONG_TIMEOUT_OPT);

      // begin process of importing harvester cluster
      harvesterPo.goTo();
      harvesterPo.waitForPage();
      cy.wait('@updateChart', LONG_TIMEOUT_OPT);
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

        // #14285: Should be able to edit cluster here
        harvesterPo.list().actionMenu(harvesterClusterName).getMenuItem('Edit Config').should('exist');
        // delete cluster
        cy.deleteRancherResource('v1', 'provisioning.cattle.io.clusters', `fleet-default/${ harvesterClusterId }`);
      });
    });
  }));

  qase(7021, it('missing repo message should display when repo does NOT exist', () => {
    cy.get<Cypress.RancherVersion>('@rancherVersion').then((version) => {
      const catalog = harvesterExtensionCatalog(version);
      const chartRepo = catalog.repo;

      cy.intercept('POST', `${ CLUSTER_REPOS_BASE_URL }/${ chartRepo }?action=install`).as('installHarvesterExtension');
      cy.intercept('PUT', `${ CLUSTER_REPOS_BASE_URL }/${ chartRepo }`).as('updateHarvesterChart');

      cy.createRancherResource('v1', 'catalog.cattle.io.clusterrepos', {
        type:     'catalog.cattle.io.clusterrepo',
        metadata: { name: catalog.repo },
        spec:     {
          clientSecret: null, gitRepo: catalog.gitRepo, gitBranch: catalog.gitBranch
        }
      });

      cy.waitForRepositoryDownload('v1', 'catalog.cattle.io.clusterrepos', chartRepo);

      appRepoList.goTo(undefined, 'manager');
      appRepoList.waitForPage();
      appRepoList.sortableTable().rowElementWithName(chartRepo).should('be.visible');
      appRepoList.list().state(chartRepo).contains('Active', LONG_TIMEOUT_OPT);

      extensionsPo.goTo();
      extensionsPo.waitForTabs();
      extensionsPo.waitForPage(null, 'available', MEDIUM_TIMEOUT_OPT);
      extensionsPo.loading().should('not.exist');

      // click on install button on card
      extensionsPo.extensionCardInstallClick(harvesterTitle);
      extensionsPo.installModal().checkVisible();

      // select latest version and click install
      extensionsPo.installModal().selectVersionClick(1);
      extensionsPo.installModal().installButton().click();
      cy.wait('@installHarvesterExtension').its('response.statusCode').should('eq', 201);
      extensionsPo.waitForPage(null, 'installed');

      extensionsPo.extensionReloadBanner().should('be.visible');
      extensionsPo.extensionReloadClick();
      extensionsPo.waitForTabs();
      extensionsPo.loading().should('not.exist');

      harvesterPo.goTo();
      harvesterPo.waitForPage();
      cy.wait('@updateHarvesterChart', LONG_TIMEOUT_OPT);
      harvesterPo.extensionWarning().should('not.exist');

      cy.deleteRancherResource('v1', 'catalog.cattle.io.clusterrepos', chartRepo);

      harvesterPo.goTo();
      harvesterPo.waitForPage();
      // verify missing repo message displays
      harvesterPo.extensionWarning().should('have.text', 'The Harvester UI Extension repository is missing');

      // uninstall harvester
      cy.createRancherResource('v1', 'catalog.cattle.io.apps/cattle-ui-plugin-system/harvester?action=uninstall', {});

      // reload extensions
      extensionsPo.goTo();
      extensionsPo.waitForTabs();
      extensionsPo.waitForPage();
      extensionsPo.loading().should('not.exist');
      extensionsPo.extensionReloadBanner().should('be.visible');
      extensionsPo.extensionReloadClick();
      extensionsPo.waitForTabs();
      extensionsPo.loading().should('not.exist');

      // verify install button and message displays
      HarvesterClusterPagePo.navTo();
      harvesterPo.waitForPage();
      harvesterPo.updateOrInstallButton().checkVisible();
      harvesterPo.extensionWarning().should('have.text', 'The Harvester UI Extension is not installed');
    });
  }));

  qase(7022, it('able to update harvester extension version', () => {
    cy.get<Cypress.RancherVersion>('@rancherVersion').then((version) => {
      const catalog = harvesterExtensionCatalog(version);
      const chartRepo = catalog.repo;

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

      cy.waitForRepositoryDownload('v1', 'catalog.cattle.io.clusterrepos', chartRepo);

      appRepoList.goTo(undefined, 'manager');
      appRepoList.waitForPage();
      appRepoList.sortableTable().rowElementWithName(chartRepo).should('be.visible');
      appRepoList.list().state(chartRepo).contains('Active', LONG_TIMEOUT_OPT);

      extensionsPo.goTo();
      extensionsPo.waitForTabs();
      extensionsPo.waitForPage(null, 'available', MEDIUM_TIMEOUT_OPT);
      extensionsPo.loading().should('not.exist');

      // click on install button on card
      extensionsPo.extensionCardInstallClick(harvesterTitle);
      extensionsPo.installModal().checkVisible();

      // Note - We can't fetch version from `catalog.cattle.io.clusterrepos/harvester?link=index` given it won't filter out invalid extensions
      // for example in rancher 2.12 the harvester 1.7.0 extension is invalid... however still returned... resulting in expected versions that don't exist as valid options

      extensionsPo.installModal().versionLabelSelect().toggle();
      extensionsPo.installModal().versionLabelSelect().getOptionsAsStrings().then((versions) => {
        // select older version and click install
        extensionsPo.installModal().selectVersionClick(2, false);
        extensionsPo.installModal().installButton().click();
        cy.wait('@installHarvesterExtension').its('response.statusCode').should('eq', 201);
        extensionsPo.waitForPage(null, 'installed');

        extensionsPo.extensionReloadBanner().should('be.visible');
        extensionsPo.extensionReloadClick();
        extensionsPo.waitForTabs();
        extensionsPo.loading().should('not.exist');

        // check harvester version on card - should be the latest available version
        extensionsPo.extensionCardVersion(harvesterTitle).should('contain', versions[0]);

        // hover checkmark - tooltip should have older version
        extensionsPo.extensionCardHeaderStatusTooltip(harvesterTitle, 1).waitForTooltipWithText(`Installed (${ versions[1] })`);

        harvesterPo.goTo();
        harvesterPo.waitForPage();
        cy.wait('@updateHarvesterChart', LONG_TIMEOUT_OPT);

        // check for update harvester message
        harvesterPo.extensionWarning().invoke('text').should('match', /^Your current Harvester UI Extension \((v[\d.]+)\) is not the latest\.$/);
        harvesterPo.updateOrInstallButton().click();

        // wait for update version update
        cy.wait('@upgradeHarvesterExtension', LONG_TIMEOUT_OPT).then(({ request, response }) => {
          expect(response?.statusCode).to.eq(201);
          expect(request?.body?.charts[0].version).to.eq(versions[0]);
        });
        cy.wait('@updateHarvesterChart', LONG_TIMEOUT_OPT);

        // verify update button and message not displayed
        harvesterPo.extensionWarning().should('not.exist');
        harvesterPo.updateOrInstallButton().checkNotExists();

        extensionsPo.goTo();
        extensionsPo.waitForTabs();
        extensionsPo.waitForPage(null, 'installed');
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
