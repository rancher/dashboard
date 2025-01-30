import { FleetClusterListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.cluster.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import { MenuActions } from '@/cypress/support/types/menu-actions';
import { gitRepoTargetAllClustersRequest } from '@/cypress/e2e/blueprints/fleet/gitrepos';
import { FleetGitRepoListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.gitrepo.po';
import FleetClusterDetailsPo from '@/cypress/e2e/po/detail/fleet/fleet.cattle.io.cluster.po';
import { WorkloadsDeploymentsListPagePo } from '@/cypress/e2e/po/pages/explorer/workloads/workloads-deployments.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import { GitRepoCreatePo } from '@/cypress/e2e/po/pages/fleet/gitrepo-create.po';
import { LONG_TIMEOUT_OPT, MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import { FeatureFlagsPagePo } from '@/cypress/e2e/po/pages/global-settings/feature-flags.po';

describe('Fleet Clusters', { tags: ['@fleet', '@adminUser'] }, () => {
  const fleetClusterListPage = new FleetClusterListPagePo();
  const fleetGitRepoListPage = new FleetGitRepoListPagePo();
  const clusterList = new ClusterManagerListPagePo();
  const featureFlagsPage = new FeatureFlagsPagePo();
  const headerPo = new HeaderPo();
  const gitRepoUrl = 'https://github.com/rancher/fleet-test-data';
  const branch = 'master';
  const paths = 'qa-test-apps/nginx-app';
  const downloadsFolder = Cypress.config('downloadsFolder');

  describe('bundle manifests are deployed from the BundleDeployment into the downstream cluster', { testIsolation: 'off', tags: ['@fleet', '@adminUser', '@jenkins'] }, () => {
    const region = 'us-west-1';
    const namespace = 'fleet-default';
    let removeCluster = false;
    let removeGitRepo = false;
    let removeWorkspace = false;
    let disableFeature = false;
    let clusterId = '';
    let clusterName = '';
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

      cy.createE2EResourceName('rke2cluster').then((name) => {
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
        }).then(() => {
          removeCluster = true;
        });

        // get clusterId
        cy.getRancherResource('v3', 'clusters').then((resp: Cypress.Response<any>) => {
          const body = resp.body;

          body.data.forEach((item: any) => {
            if (item['name'] === name) {
              clusterId = item.id;
            }
          });
        });
      });

      cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
    });

    it('data is populated in fleet cluster list and detail view', () => {
      ClusterManagerListPagePo.navTo();
      clusterList.waitForPage();
      clusterList.list().state(clusterName).contains('Active', { timeout: 700000 });

      // create gitrepo
      cy.createRancherResource('v1', 'fleet.cattle.io.gitrepos', gitRepoTargetAllClustersRequest(namespace, gitRepo, gitRepoUrl, branch, paths)).then(() => {
        removeGitRepo = true;
      });

      // go to fleet gitrepo and wait until git repo is in active state
      fleetGitRepoListPage.navTo();
      fleetGitRepoListPage.waitForPage();
      headerPo.selectWorkspace(namespace);
      fleetGitRepoListPage.repoList().details(gitRepo, 1).contains('Active', LONG_TIMEOUT_OPT);

      // go to fleet clusters
      FleetClusterListPagePo.navTo();
      fleetClusterListPage.waitForPage();
      headerPo.selectWorkspace(namespace);
      fleetClusterListPage.sortableTable().checkLoadingIndicatorNotVisible();

      // check name
      fleetClusterListPage.clusterList().details(clusterName, 2).should('be.visible');
      // check cluster state in fleet
      fleetClusterListPage.clusterList().details(clusterName, 1).contains('Not Ready', MEDIUM_TIMEOUT_OPT);
      fleetClusterListPage.clusterList().details(clusterName, 1).contains('Active', LONG_TIMEOUT_OPT);
      // check bundles ready
      fleetClusterListPage.clusterList().details(clusterName, 3).should('have.text', '4');
      // check repos ready
      fleetClusterListPage.clusterList().details(clusterName, 4).should('have.text', '1');
      // check resources: testing https://github.com/rancher/dashboard/issues/11154
      fleetClusterListPage.clusterList().details(clusterName, 5).contains( ' 1 ', MEDIUM_TIMEOUT_OPT);
      // check cluster labels
      fleetClusterListPage.clusterList().subRows().should('contain.text', 'foo=bar');

      const fleetClusterDetailsPage = new FleetClusterDetailsPo(namespace, clusterName);

      // go to cluster details in fleet
      fleetClusterListPage.clusterList().details(clusterName, 2).find('a').click();
      fleetClusterDetailsPage.waitForPage(null, 'repos');
      fleetClusterDetailsPage.clusterTabs().clickTabWithSelector('[data-testid="btn-repos"]');

      // check state
      fleetClusterDetailsPage.gitReposList().details(gitRepo, 1).contains('Ready');
      // check name
      fleetClusterDetailsPage.gitReposList().details(gitRepo, 2).should('be.visible');
      // check repo
      fleetClusterDetailsPage.gitReposList().details(gitRepo, 3).contains('rancher/fleet-test-data master');
      // check target
      fleetClusterDetailsPage.gitReposList().details(gitRepo, 4).contains('Advanced');
      // check cluster resources
      fleetClusterDetailsPage.gitReposList().details(gitRepo, 5).should('have.text', ' 1 ');
    });

    it('check all tabs are available in the details view', () => {
      // testing https://github.com/rancher/dashboard/issues/11155
      const fleetClusterDetailsPage = new FleetClusterDetailsPo(namespace, clusterName);

      // go to fleet clusters
      FleetClusterListPagePo.navTo();
      fleetClusterListPage.waitForPage();
      headerPo.selectWorkspace(namespace);
      fleetClusterListPage.clusterList().details(clusterName, 2).find('a').click();
      fleetClusterDetailsPage.waitForPage(null, 'repos');
      fleetClusterDetailsPage.clusterTabs().allTabs().should('have.length', 4, { timeout: 10000 });
      const tabs = ['Git Repos', 'Conditions', 'Recent Events', 'Related Resources'];

      fleetClusterDetailsPage.clusterTabs().tabNames().each((el, i) => {
        expect(el).to.eq(tabs[i]);
      });
    });

    it('adding git repo should add bundles on downstream cluster (deployments added)', () => {
      const deploymentsList = new WorkloadsDeploymentsListPagePo(clusterId);
      const deployments = 'nginx-keep';

      deploymentsList.goTo();
      deploymentsList.waitForPage();

      deploymentsList.details(deployments, 1).contains('Active', { timeout: 15000 });
    });

    it('can Pause', () => {
      // go to fleet clusters
      FleetClusterListPagePo.navTo();
      fleetClusterListPage.waitForPage();
      headerPo.selectWorkspace(namespace);

      cy.intercept('PUT', `v1/fleet.cattle.io.clusters/${ namespace }/${ clusterName }`).as('pause');

      // pause
      fleetClusterListPage.clusterList().actionMenu(clusterName).getMenuItem('Pause').click();
      cy.wait('@pause').then(({ response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(response?.body).to.have.property('kind', 'Cluster');
        expect(response?.body.metadata).to.have.property('name', clusterName);
        expect(response?.body.spec).to.have.property('paused', true);
      });

      // check cluster state
      fleetClusterListPage.clusterList().details(clusterName, 1).contains('Paused', LONG_TIMEOUT_OPT);
    });

    it('can Unpause', () => {
      // go to fleet clusters
      FleetClusterListPagePo.navTo();
      fleetClusterListPage.waitForPage();
      headerPo.selectWorkspace(namespace);

      cy.intercept('PUT', `v1/fleet.cattle.io.clusters/${ namespace }/${ clusterName }`).as('unpause');

      // unpause
      fleetClusterListPage.clusterList().actionMenu(clusterName).getMenuItem('Unpause').click();
      cy.wait('@unpause').then(({ response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(response?.body).to.have.property('kind', 'Cluster');
        expect(response?.body.metadata).to.have.property('name', clusterName);
        expect(response?.body.spec).to.have.property('paused', false);
      });

      // check cluster state
      fleetClusterListPage.clusterList().details(clusterName, 1).contains('Active', LONG_TIMEOUT_OPT);
    });

    it('can Edit Config', () => {
      // go to fleet clusters
      FleetClusterListPagePo.navTo();
      fleetClusterListPage.waitForPage();
      headerPo.selectWorkspace(namespace);
      fleetClusterListPage.clusterList().actionMenu(clusterName).getMenuItem('Edit Config').click();

      const editFleetCluster = fleetClusterListPage.editFleetCluster(undefined, clusterName);

      editFleetCluster.waitForPage('mode=edit');
      editFleetCluster.nameNsDescription().description().set(`${ clusterName }-fleet-desc`);
      editFleetCluster.saveCreateForm().cruResource().saveAndWaitForRequests('PUT', `v1/fleet.cattle.io.clusters/${ namespace }/${ clusterName }`)
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
      fleetClusterListPage.clusterList().actionMenu(clusterName).getMenuItem('Download YAML').click();

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

      // go to fleet clusters
      fleetClusterListPage.goTo();
      fleetClusterListPage.waitForPage();
      headerPo.selectWorkspace(namespace);

      cy.intercept('PUT', '/v1/userpreferences/*').as('changeWorkspace');
      fleetClusterListPage.clusterList().actionMenu(clusterName).getMenuItem('Change workspace').click();
      fleetClusterListPage.changeWorkspaceForm().workspaceSelect().toggle();
      fleetClusterListPage.changeWorkspaceForm().workspaceSelect().clickOptionWithLabel(customWorkspace);
      fleetClusterListPage.changeWorkspaceForm().applyAndWait('v3/clusters/*');
      fleetClusterListPage.sortableTable().checkRowCount(true, 1, MEDIUM_TIMEOUT_OPT);

      FleetClusterListPagePo.navTo();
      fleetClusterListPage.waitForPage();
      headerPo.selectWorkspace(customWorkspace);
      cy.wait('@changeWorkspace');
      fleetClusterListPage.clusterList().details(clusterName, 2).isVisible();

      // restore
      fleetClusterListPage.clusterList().actionMenu(clusterName).getMenuItem('Change workspace').click();
      fleetClusterListPage.changeWorkspaceForm().workspaceSelect().toggle();
      fleetClusterListPage.changeWorkspaceForm().workspaceSelect().clickOptionWithLabel(namespace);
      fleetClusterListPage.changeWorkspaceForm().applyAndWait('v3/clusters/*');
      fleetClusterListPage.sortableTable().checkRowCount(true, 1, MEDIUM_TIMEOUT_OPT);

      FleetClusterListPagePo.navTo();
      fleetClusterListPage.waitForPage();
      headerPo.selectWorkspace(namespace);
      cy.wait('@changeWorkspace');
      fleetClusterListPage.clusterList().details(clusterName, 2).isVisible();
    });

    it('removing git repo should remove bundles on downstream cluster (deployments removed)', () => {
      const deploymentsList = new WorkloadsDeploymentsListPagePo(clusterId);

      // delete gitrepo
      cy.deleteRancherResource('v1', `fleet.cattle.io.gitrepos/${ namespace }`, gitRepo).then(() => {
        removeGitRepo = false;
      });

      deploymentsList.goTo();
      deploymentsList.waitForPage();
      deploymentsList.sortableTable().checkLoadingIndicatorNotVisible();
      deploymentsList.sortableTable().checkRowCount(true, 1, MEDIUM_TIMEOUT_OPT);
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
      fleetClusterListPage.sortableTable().checkLoadingIndicatorNotVisible();
      fleetClusterListPage.sortableTable().checkRowCount(true, 1, MEDIUM_TIMEOUT_OPT);
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
    });
  });

  describe('List', { tags: ['@fleet', '@adminUser'] }, () => {
    const fleetClusterListPage = new FleetClusterListPagePo();
    let removeGitRepo = false;
    let gitRepo = '';
    const workspace = 'fleet-local';

    beforeEach(() => {
      cy.login();
      fleetClusterListPage.goTo();
      headerPo.selectWorkspace(workspace);
      cy.createE2EResourceName('git-repo').then((name) => {
        gitRepo = name;
      });
    });

    it('should be able to list clusters in local workspace', () => {
      fleetClusterListPage.checkRowCount(false, 1);
    });

    it('Git Repos Tab Add Repository button takes you to the correct page', () => {
      // testing https://github.com/rancher/dashboard/issues/11198
      const fleetClusterDetailsPage = new FleetClusterDetailsPo(workspace, 'local');
      const gitRepoCreatePage = new GitRepoCreatePo('_');

      fleetClusterListPage.sortableTable().checkLoadingIndicatorNotVisible();
      fleetClusterListPage.clusterList().details('local', 2).find('a').click();
      fleetClusterDetailsPage.waitForPage(null, 'repos');
      fleetClusterDetailsPage.gitReposTab().addRepostoryButton().click();
      gitRepoCreatePage.waitForPage();
      gitRepoCreatePage.title().contains('Git Repo: Create').should('be.visible');
    });

    it('should only display action menu with allowed actions only', () => {
      fleetClusterListPage.goTo();
      headerPo.selectWorkspace(workspace);

      const constActionMenu = fleetClusterListPage.rowActionMenuOpen('local');

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

    it('check table headers are available in list and details view', { tags: ['@vai', '@adminUser'] }, () => {
      const clusterName = 'local';

      // create gitrepo
      cy.createRancherResource('v1', 'fleet.cattle.io.gitrepos', gitRepoTargetAllClustersRequest(workspace, gitRepo, gitRepoUrl, branch, paths)).then(() => {
        removeGitRepo = true;
      });

      // go to fleet gitrepo
      fleetGitRepoListPage.navTo();
      fleetGitRepoListPage.waitForPage();
      headerPo.selectWorkspace(workspace);
      fleetGitRepoListPage.repoList().rowWithName(gitRepo).checkVisible();

      // go to fleet cluster list
      FleetClusterListPagePo.navTo();
      fleetClusterListPage.waitForPage();

      // check table headers
      const expectedHeaders = ['State', 'Name', 'Bundles Ready', 'Repos Ready', 'Resources', 'Last Seen', 'Age'];

      fleetClusterListPage.clusterList().resourceTable().sortableTable().tableHeaderRow()
        .within('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      // go to fleet cluster details
      fleetClusterListPage.clusterList().details(clusterName, 2).find('a').click();

      const fleetClusterDetailsPage = new FleetClusterDetailsPo(workspace, clusterName);

      fleetClusterDetailsPage.waitForPage(null, 'repos');

      // check table headers
      const expectedHeadersDetailsView = ['Cluster State', 'Name', 'Repo', 'Target', 'Cluster Resources', 'Age'];

      fleetClusterDetailsPage.gitReposTab().list().resourceTable().sortableTable()
        .tableHeaderRow()
        .within('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeadersDetailsView[i]);
        });
    });

    after('clean up', () => {
      if (removeGitRepo) {
        // delete gitrepo
        cy.deleteRancherResource('v1', `fleet.cattle.io.gitrepos/${ workspace }`, gitRepo);
      }
    });
  });
});
