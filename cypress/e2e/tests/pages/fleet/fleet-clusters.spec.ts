import { FleetClusterListPagePo, FleetClusterDetailsPo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.cluster.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import { MenuActions } from '@/cypress/support/types/menu-actions';
import { gitRepoTargetAllClustersRequest } from '@/cypress/e2e/blueprints/fleet/gitrepos';
import { FleetApplicationListPagePo, FleetGitRepoCreateEditPo, FleetApplicationCreatePo } from '~/cypress/e2e/po/pages/fleet/fleet.cattle.io.application.po';
import { WorkloadsDeploymentsListPagePo } from '@/cypress/e2e/po/pages/explorer/workloads/workloads-deployments.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import { LONG_TIMEOUT_OPT, MEDIUM_TIMEOUT_OPT, VERY_LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import { FeatureFlagsPagePo } from '@/cypress/e2e/po/pages/global-settings/feature-flags.po';
import LoadingPo from '@/cypress/e2e/po/components/loading.po';

const fleetClusterListPage = new FleetClusterListPagePo();
const fleetAppBundlesListPage = new FleetApplicationListPagePo();
const appBundleCreatePage = new FleetApplicationCreatePo();
const clusterList = new ClusterManagerListPagePo();
const featureFlagsPage = new FeatureFlagsPagePo();
const headerPo = new HeaderPo();
const gitRepoUrl = 'https://github.com/rancher/fleet-test-data';
const branch = 'master';
const paths = 'qa-test-apps/nginx-app';
const downloadsFolder = Cypress.config('downloadsFolder');

describe('Fleet Clusters - bundle manifests are deployed from the BundleDeployment into the downstream cluster', { testIsolation: 'off', tags: ['@fleet', '@adminUser', '@jenkins'] }, () => {
  const region = 'us-west-1';
  const namespace = 'fleet-default';
  let removeCluster = false;
  let removeGitRepo = false;
  let removeWorkspace = false;
  let disableFeature = false;
  let clusterName = '';
  let cloudcredentialId = '';
  let gitRepo = '';
  let customWorkspace = '';
  const feature = 'provisioningv2-fleet-workspace-back-population';

  before(() => {
    cy.login();
    cy.createE2EResourceName('fleet-workspace').then((name) => {
      customWorkspace = name;
    });

    cy.createE2EResourceName('git-repo').then((name) => {
      gitRepo = name;
    });

    cy.createE2EResourceName('fleetrke2cluster').then((name) => {
      clusterName = name;

      // create real cluster
      cy.createAmazonRke2Cluster({
        machineConfig: {
          instanceType: 't3a.medium',
          region,
          vpcId:        'vpc-081cec85dbe35e9bd',
          zone:         'a',
          type:         'rke-machine-config.cattle.io.amazonec2config',
          clusterName:  name,
          namespace
        },
        cloudCredentialsAmazon: {
          workspace: namespace,
          name,
          region,
          accessKey: Cypress.env('awsAccessKey'),
          secretKey: Cypress.env('awsSecretKey')
        },
        rke2ClusterAmazon: {
          clusterName: name,
          namespace,
        },
        metadata: { labels: { foo: 'bar' } }
      }).then((req) => {
        cloudcredentialId = req.body.spec.cloudCredentialSecretName;

        removeCluster = true;
      });
    });

    cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
  });

  it('data is populated in fleet cluster list and detail view', () => {
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.list().state(clusterName).contains('Active', VERY_LONG_TIMEOUT_OPT);

    // create gitrepo
    cy.createRancherResource('v1', 'fleet.cattle.io.gitrepos', gitRepoTargetAllClustersRequest(namespace, gitRepo, gitRepoUrl, branch, paths)).then(() => {
      removeGitRepo = true;
    });

    // go to fleet gitrepo and wait until git repo is in active state
    fleetAppBundlesListPage.navTo();
    fleetAppBundlesListPage.waitForPage();
    headerPo.selectWorkspace(namespace);
    fleetAppBundlesListPage.resourceTableDetails(gitRepo, 1).contains('Active', LONG_TIMEOUT_OPT);

    // go to fleet clusters
    FleetClusterListPagePo.navTo();
    fleetClusterListPage.waitForPage();
    headerPo.selectWorkspace(namespace);
    fleetClusterListPage.list().resourceTable().sortableTable()
      .checkLoadingIndicatorNotVisible();

    // check name
    fleetClusterListPage.resourceTableDetails(clusterName, 2).should('be.visible');
    // check cluster state in fleet
    fleetClusterListPage.resourceTableDetails(clusterName, 1).contains('Not Ready', MEDIUM_TIMEOUT_OPT);
    fleetClusterListPage.resourceTableDetails(clusterName, 1).contains('Active', LONG_TIMEOUT_OPT);
    // check Git Repos ready
    fleetClusterListPage.resourceTableDetails(clusterName, 3).should('have.text', '1');
    // check Helm Ops ready
    fleetClusterListPage.resourceTableDetails(clusterName, 4).should('have.text', '0');
    // check Bundles ready
    fleetClusterListPage.resourceTableDetails(clusterName, 5).should('have.text', '2');
    // check resources: testing https://github.com/rancher/dashboard/issues/11154
    fleetClusterListPage.resourceTableDetails(clusterName, 6).contains( ' 7 ', MEDIUM_TIMEOUT_OPT);
    // check cluster labels
    fleetClusterListPage.list().resourceTable().sortableTable()
      .subRows()
      .should('contain.text', 'foo=bar');

    const fleetClusterDetailsPage = new FleetClusterDetailsPo(namespace, clusterName);

    // go to cluster details in fleet
    fleetClusterListPage.goToDetailsPage(clusterName);
    fleetClusterDetailsPage.waitForPage(null, 'applications');
    fleetClusterDetailsPage.clusterTabs().clickTabWithSelector('[data-testid="btn-applications"]');

    // check state
    fleetClusterDetailsPage.appBundlesList().resourceTableDetails(gitRepo, 1).contains('Active');
    // check name
    fleetClusterDetailsPage.appBundlesList().resourceTableDetails(gitRepo, 2).should('be.visible');
    // check type
    fleetClusterDetailsPage.appBundlesList().resourceTableDetails(gitRepo, 3).contains('GitRepo');
    // check source
    fleetClusterDetailsPage.appBundlesList().resourceTableDetails(gitRepo, 4).contains('rancher/fleet-test-data');
    // check target
    fleetClusterDetailsPage.appBundlesList().resourceTableDetails(gitRepo, 5).contains('All');
    // check cluster resources
    fleetClusterDetailsPage.appBundlesList().resourceTableDetails(gitRepo, 7).should('have.text', ' 1 ');
  });

  it('check all tabs are available in the details view', () => {
    // testing https://github.com/rancher/dashboard/issues/11155
    const fleetClusterDetailsPage = new FleetClusterDetailsPo(namespace, clusterName);

    // go to fleet clusters
    FleetClusterListPagePo.navTo();
    fleetClusterListPage.waitForPage();
    headerPo.selectWorkspace(namespace);
    fleetClusterListPage.goToDetailsPage(clusterName);
    fleetClusterDetailsPage.waitForPage(null, 'applications');
    fleetClusterDetailsPage.clusterTabs().allTabs().should('have.length', 4, { timeout: 10000 });
    const tabs = ['App Bundles', 'Conditions', 'Recent Events', 'Related Resources'];

    fleetClusterDetailsPage.clusterTabs().tabNames().each((el, i) => {
      expect(el).to.include(tabs[i]);
    });
  });

  it('adding git repo should add bundles on downstream cluster (deployments added)', () => {
    cy.getClusterIdByName(clusterName).then((clusterId) => {
      const deploymentsList = new WorkloadsDeploymentsListPagePo(clusterId);
      const deployments = 'nginx-keep';

      deploymentsList.goTo();
      deploymentsList.waitForPage();

      deploymentsList.details(deployments, 1).contains('Active', { timeout: 15000 });
    });
  });

  it('can Pause', () => {
    // go to fleet clusters
    FleetClusterListPagePo.navTo();
    fleetClusterListPage.waitForPage();
    headerPo.selectWorkspace(namespace);

    cy.intercept('PUT', `v1/fleet.cattle.io.clusters/${ namespace }/${ clusterName }`).as('pause');

    // pause
    fleetClusterListPage.list().actionMenu(clusterName).getMenuItem('Pause')
      .click();
    cy.wait('@pause').then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(response?.body).to.have.property('kind', 'Cluster');
      expect(response?.body.metadata).to.have.property('name', clusterName);
      expect(response?.body.spec).to.have.property('paused', true);
    });

    // check cluster state
    fleetClusterListPage.resourceTableDetails(clusterName, 1).contains('Paused', LONG_TIMEOUT_OPT);
  });

  it('can Unpause', () => {
    // go to fleet clusters
    FleetClusterListPagePo.navTo();
    fleetClusterListPage.waitForPage();
    headerPo.selectWorkspace(namespace);

    cy.intercept('PUT', `v1/fleet.cattle.io.clusters/${ namespace }/${ clusterName }`).as('unpause');

    // unpause
    fleetClusterListPage.list().actionMenu(clusterName).getMenuItem('Unpause')
      .click();
    cy.wait('@unpause').then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(response?.body).to.have.property('kind', 'Cluster');
      expect(response?.body.metadata).to.have.property('name', clusterName);
      expect(response?.body.spec).to.have.property('paused', false);
    });

    // check cluster state
    fleetClusterListPage.resourceTableDetails(clusterName, 1).contains('Active', LONG_TIMEOUT_OPT);
  });

  it('can Edit Config', () => {
    // go to fleet clusters
    FleetClusterListPagePo.navTo();
    fleetClusterListPage.waitForPage();
    headerPo.selectWorkspace(namespace);
    fleetClusterListPage.list().actionMenu(clusterName).getMenuItem('Edit Config')
      .click();

    const editFleetCluster = fleetClusterListPage.editFleetCluster(undefined, clusterName);

    editFleetCluster.waitForPage('mode=edit');
    editFleetCluster.resourceDetail().createEditView().nameNsDescription()
      .description()
      .set(`${ clusterName }-fleet-desc`);
    editFleetCluster.resourceDetail().cruResource().saveAndWaitForRequests('PUT', `v1/fleet.cattle.io.clusters/${ namespace }/${ clusterName }`)
      .then(({ response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(response?.body.metadata).to.have.property('name', clusterName);
        expect(response?.body.metadata.annotations).to.have.property('field.cattle.io/description', `${ clusterName }-fleet-desc`);
      });
    fleetClusterListPage.waitForPage();
  });

  it('can Download YAML', () => {
    cy.deleteDownloadsFolder();

    FleetClusterListPagePo.navTo();
    fleetClusterListPage.waitForPage();
    headerPo.selectWorkspace(namespace);
    fleetClusterListPage.list().actionMenu(clusterName).getMenuItem('Download YAML')
      .click();

    const downloadedFilename = path.join(downloadsFolder, `${ clusterName }.yaml`);

    cy.readFile(downloadedFilename).then((buffer) => {
      const obj: any = jsyaml.load(buffer);

      // Basic checks on the downloaded YAML
      expect(obj.kind).to.equal('Cluster');
      expect(obj.metadata.annotations['objectset.rio.cattle.io/id']).to.equal('fleet-cluster');
      expect(obj.metadata.annotations['objectset.rio.cattle.io/owner-name']).to.equal(clusterName);
      expect(obj.metadata.annotations['objectset.rio.cattle.io/owner-namespace']).to.equal(namespace);
    });
  });

  it('can assign cluster to different fleet workspaces', () => {
    // create workspace
    cy.createRancherResource('v3', 'fleetworkspaces', `{"type":"fleetworkspace","name":"${ customWorkspace }","annotations":{},"labels":{}}`).then(() => {
      removeWorkspace = true;
    });

    // enable feature: provisioningv2-fleet-workspace-back-population
    FeatureFlagsPagePo.navTo();
    featureFlagsPage.waitForPage();
    featureFlagsPage.list().details(feature, 0).should('include.text', 'Disabled');
    featureFlagsPage.list().clickRowActionMenuItem(feature, 'Activate');
    featureFlagsPage.clickCardActionButtonAndWait('Activate', feature, true, { waitForModal: true, waitForRequest: true });
    featureFlagsPage.list().details(feature, 0).should('include.text', 'Active').then(() => {
      disableFeature = true;
    });

    const loadingPo = new LoadingPo('.loading-indicator');

    // go to fleet clusters
    FleetClusterListPagePo.navTo();
    fleetClusterListPage.waitForPage();
    loadingPo.checkNotExists(MEDIUM_TIMEOUT_OPT);
    headerPo.selectWorkspace(namespace);

    cy.intercept('GET', '/v3/clusters').as('getClusters');
    cy.intercept('PUT', '/v1/userpreferences/*').as('changeWorkspace');
    cy.getClusterIdByName(clusterName).then((clusterId) => {
      fleetClusterListPage.list().actionMenu(clusterName).getMenuItem('Change workspace')
        .should('exist')
        .click();
      cy.wait('@getClusters');
      fleetClusterListPage.changeWorkspaceForm().workspaceSelect().toggle();
      fleetClusterListPage.changeWorkspaceForm().workspaceSelect().clickOptionWithLabel(customWorkspace);
      fleetClusterListPage.changeWorkspaceForm().applyAndWait(`v3/clusters/${ clusterId }`);
      fleetClusterListPage.list().resourceTable().sortableTable()
        .checkRowCount(true, 1, MEDIUM_TIMEOUT_OPT);

      FleetClusterListPagePo.navTo();
      fleetClusterListPage.waitForPage();
      headerPo.selectWorkspace(customWorkspace);
      cy.wait('@changeWorkspace');
      fleetClusterListPage.resourceTableDetails(clusterName, 2).isVisible();

      // restore
      fleetClusterListPage.list().actionMenu(clusterName).getMenuItem('Change workspace')
        .should('exist')
        .click();
      fleetClusterListPage.changeWorkspaceForm().workspaceSelect().toggle();
      fleetClusterListPage.changeWorkspaceForm().workspaceSelect().clickOptionWithLabel(namespace);
      fleetClusterListPage.changeWorkspaceForm().applyAndWait(`v3/clusters/${ clusterId }`);
    });
    fleetClusterListPage.list().resourceTable().sortableTable()
      .checkRowCount(true, 1, MEDIUM_TIMEOUT_OPT);

    FleetClusterListPagePo.navTo();
    fleetClusterListPage.waitForPage();
    headerPo.selectWorkspace(namespace);
    cy.wait('@changeWorkspace');
    fleetClusterListPage.resourceTableDetails(clusterName, 2).isVisible();
  });

  it('removing git repo should remove bundles on downstream cluster (deployments removed)', () => {
    cy.getClusterIdByName(clusterName).then((clusterId) => {
      const deploymentsList = new WorkloadsDeploymentsListPagePo(clusterId);

      // delete gitrepo
      cy.deleteRancherResource('v1', `fleet.cattle.io.gitrepos/${ namespace }`, gitRepo).then(() => {
        removeGitRepo = false;
      });

      deploymentsList.goTo();
      deploymentsList.waitForPage();
      deploymentsList.sortableTable().checkLoadingIndicatorNotVisible();
      deploymentsList.sortableTable().checkRowCount(true, 1, LONG_TIMEOUT_OPT);
    });
  });

  it('cluster should be removed from fleet cluster list once deleted', () => {
    if (removeCluster) {
      //  delete cluster
      cy.deleteRancherResource('v1', `provisioning.cattle.io.clusters/${ namespace }`, clusterName);
      removeCluster = false;
    }

    FleetClusterListPagePo.navTo();
    fleetClusterListPage.waitForPage();
    headerPo.selectWorkspace(namespace);
    fleetClusterListPage.list().resourceTable().sortableTable()
      .checkLoadingIndicatorNotVisible();
    fleetClusterListPage.list().resourceTable().sortableTable()
      .checkRowCount(true, 1, MEDIUM_TIMEOUT_OPT);
  });

  after('clean up', () => {
    if (removeCluster) {
      // delete cluster
      cy.deleteRancherResource('v1', `provisioning.cattle.io.clusters/${ namespace }`, clusterName, false);
    }
    if (removeGitRepo) {
      // delete gitrepo
      cy.deleteRancherResource('v1', `fleet.cattle.io.gitrepos/${ namespace }`, gitRepo, false);
    }
    if (removeWorkspace) {
      // delete workspace
      cy.deleteRancherResource('v3', 'fleetWorkspaces', customWorkspace, false);
    }

    if (disableFeature) {
      // disable feature: provisioningv2-fleet-workspace-back-population
      FeatureFlagsPagePo.navTo();
      featureFlagsPage.waitForPage();
      featureFlagsPage.list().details(feature, 0).should('include.text', 'Active');
      featureFlagsPage.list().clickRowActionMenuItem(feature, 'Deactivate');
      featureFlagsPage.clickCardActionButtonAndWait('Deactivate', feature, false, { waitForModal: true, waitForRequest: true });
      featureFlagsPage.list().details(feature, 0).should('include.text', 'Disabled');
    }

    if (cloudcredentialId) {
      // delete cloud credential
      cy.deleteRancherResource('v3', 'cloudCredentials', cloudcredentialId, false);
    }
  });
});

describe('Fleet CLuster List - resources', { tags: ['@fleet', '@adminUser'] }, () => {
  let toRemove = '';
  const workspace = 'fleet-local';

  beforeEach(() => {
    cy.login();
    fleetClusterListPage.goTo();
    headerPo.selectWorkspace(workspace);
  });

  it('should be able to list clusters in local workspace', () => {
    fleetClusterListPage.list().resourceTable().sortableTable()
      .checkRowCount(false, 1);
  });

  it('Git Repos Tab Add Repository button takes you to the correct page', () => {
    // testing https://github.com/rancher/dashboard/issues/11198
    const fleetClusterDetailsPage = new FleetClusterDetailsPo(workspace, 'local');
    const gitRepoCreatePage = new FleetGitRepoCreateEditPo();

    fleetClusterListPage.list().resourceTable().sortableTable()
      .checkLoadingIndicatorNotVisible();
    fleetClusterListPage.goToDetailsPage('local');
    fleetClusterDetailsPage.waitForPage(null, 'applications');
    fleetClusterDetailsPage.addAppButton().click();
    appBundleCreatePage.waitForPage();

    appBundleCreatePage.createGitRepo();
    gitRepoCreatePage.waitForPage();
    gitRepoCreatePage.mastheadTitle().then((title) => {
      expect(title.replace(/\s+/g, ' ')).to.contain('App Bundle: Create');
    });
  });

  it('should only display action menu with allowed actions only', () => {
    const constActionMenu = fleetClusterListPage.list().resourceTable().sortableTable()
      .rowActionMenuOpen('local');

    const allowedActions: MenuActions[] = [
      MenuActions.Pause,
      MenuActions.ForceUpdate,
      MenuActions.EditYaml,
      MenuActions.EditConfig,
      // MenuActions.ViewInApi, // TODO: #10095: Review API menu case
    ];

    const disabledActions: MenuActions[] = [MenuActions.ChangeWorkspace];

    allowedActions.forEach((action) => {
      constActionMenu.getMenuItem(action).should('exist');
    });

    // Disabled actions should not exist
    disabledActions.forEach((action) => {
      constActionMenu.getMenuItem(action).should('not.exist');
    });
  });

  it('check table headers are available in list and details view', { tags: ['@noVai', '@adminUser'] }, () => {
    const clusterName = 'local';

    // create gitrepo
    cy.createRancherResource('v1', 'fleet.cattle.io.gitrepos', gitRepoTargetAllClustersRequest(workspace, '', gitRepoUrl, branch, paths)).then((res) => {
      toRemove = res.body.id.replaceAll(`${ workspace }/`, '');
    });

    // go to fleet applications
    fleetAppBundlesListPage.goTo();
    fleetAppBundlesListPage.waitForPage();
    headerPo.selectWorkspace(workspace);
    fleetAppBundlesListPage.list().rowWithName(toRemove).checkVisible();

    // go to fleet cluster list
    FleetClusterListPagePo.navTo();
    fleetClusterListPage.waitForPage();

    // check table headers
    const expectedHeaders = ['State', 'Name', 'Git Repos Ready', 'Helm Ops Ready', 'Bundles Ready', 'Resources', 'Last Seen', 'Age'];

    headerPo.selectWorkspace(workspace);
    fleetClusterListPage.list().resourceTable().sortableTable()
      .tableHeaderRow()
      .within('.table-header-container .content')
      .each((el, i) => {
        expect(el.text().trim()).to.eq(expectedHeaders[i]);
      });

    const fleetClusterDetailsPage = new FleetClusterDetailsPo(workspace, clusterName);

    fleetClusterListPage.goToDetailsPage(clusterName);
    fleetClusterDetailsPage.waitForPage(null, 'applications');

    // check table headers
    const expectedHeadersDetailsView = ['State', 'Name', 'Type', 'Source', 'Target', 'Clusters Ready', 'Resources', 'Age'];

    headerPo.selectWorkspace(workspace);

    // Select flat list
    fleetClusterDetailsPage.appBundlesList().sortableTable().groupByButtons(0).click();

    fleetClusterDetailsPage.appBundlesList().sortableTable()
      .tableHeaderRow()
      .within('.table-header-container .content')
      .each((el, i) => {
        expect(el.text().trim()).to.eq(expectedHeadersDetailsView[i]);
      });
  });

  after('clean up', () => {
    if (toRemove) {
      // delete gitrepo
      cy.deleteRancherResource('v1', `fleet.cattle.io.gitrepos/${ workspace }`, toRemove);
    }
  });
});
