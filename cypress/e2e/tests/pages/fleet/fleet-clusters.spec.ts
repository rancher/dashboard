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

describe('Fleet Clusters', { tags: ['@fleet', '@adminUser'] }, () => {
  const fleetClusterListPage = new FleetClusterListPagePo();
  const fleetGitRepoListPage = new FleetGitRepoListPagePo();
  const clusterList = new ClusterManagerListPagePo();
  const headerPo = new HeaderPo();
  const gitRepoUrl = 'https://github.com/rancher/fleet-examples.git';
  const branch = 'master';
  const paths = 'simple';
  const downloadsFolder = Cypress.config('downloadsFolder');

  describe('bundle manifests are deployed from the BundleDeployment into the downstream cluster', { testIsolation: 'off', tags: ['@fleet', '@adminUser', '@jenkins'] }, () => {
    const region = 'us-west-1';
    const namespace = 'fleet-default';
    let removeCluster = false;
    let removeGitRepo = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('rke2cluster').as('rke2Ec2ClusterName');
      cy.createE2EResourceName('git-repo').as('gitRepo');

      cy.get<string>('@rke2Ec2ClusterName').then((name) => {
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
          }
        }).then(() => {
          removeCluster = true;
        });
      });
    });

    beforeEach(() => {
      // get clusterId
      cy.createE2EResourceName('rke2cluster').as('rke2Ec2ClusterName');
      cy.get<string>('@rke2Ec2ClusterName').then((name) => {
        cy.getRancherResource('v3', 'clusters').then((resp: Cypress.Response<any>) => {
          const body = resp.body;

          body.data.forEach((item: any) => {
            if (item['name'] === name) {
              cy.wrap(item.id).as('clusterId');
            }
          });
        });
      });
    });

    it('data is populated in fleet cluster list and detail view', function() {
      ClusterManagerListPagePo.navTo();
      clusterList.waitForPage();
      clusterList.list().state(this.rke2Ec2ClusterName).contains('Active', { timeout: 700000 });

      // create gitrepo
      cy.createRancherResource('v1', 'fleet.cattle.io.gitrepos', gitRepoTargetAllClustersRequest(namespace, this.gitRepo, gitRepoUrl, branch, paths)).then(() => {
        removeGitRepo = true;
      });

      // go to fleet gitrepo and wait until git repo is in active state
      fleetGitRepoListPage.navTo();
      fleetGitRepoListPage.waitForPage();
      headerPo.selectWorkspace(namespace);
      fleetGitRepoListPage.repoList().details(this.gitRepo, 1).contains('Active', { timeout: 600000 });

      // go to fleet clusters
      FleetClusterListPagePo.navTo();
      fleetClusterListPage.waitForPage();
      headerPo.selectWorkspace(namespace);
      fleetClusterListPage.sortableTable().checkLoadingIndicatorNotVisible();

      // get cluster state
      fleetClusterListPage.clusterList().details(this.rke2Ec2ClusterName, 1).invoke('text').then((clusterState) => {
        const states = ['Wait Check-In', 'Not Ready', 'Err Applied'];

        for (const i in states) {
          if (clusterState.trim() === states[i]) {
            // In reality these states resolve themselved after some time, using force update here to quickly get Active state
            cy.intercept('PUT', `v1/fleet.cattle.io.clusters/${ namespace }/${ this.rke2Ec2ClusterName }`).as('forceUpdate');
            fleetClusterListPage.clusterList().actionMenu(this.rke2Ec2ClusterName).getMenuItem('Force Update').click();
            cy.wait('@forceUpdate').its('response.statusCode').should('eq', 200);
          }
        }
      });

      // check name
      fleetClusterListPage.clusterList().details(this.rke2Ec2ClusterName, 2).should('be.visible');
      // check cluster state in fleet
      fleetClusterListPage.clusterList().details(this.rke2Ec2ClusterName, 1).contains('Active', { timeout: 180000 });
      // check bundles ready
      fleetClusterListPage.clusterList().details(this.rke2Ec2ClusterName, 3).should('have.text', '4');
      // check repos ready
      fleetClusterListPage.clusterList().details(this.rke2Ec2ClusterName, 4).should('have.text', '1');
      // check resources: testing https://github.com/rancher/dashboard/issues/11154
      fleetClusterListPage.clusterList().details(this.rke2Ec2ClusterName, 5).should('have.text', ' 6 ');

      const fleetClusterDetailsPage = new FleetClusterDetailsPo(namespace, this.rke2Ec2ClusterName);

      // go to cluster details in fleet
      fleetClusterListPage.clusterList().details(this.rke2Ec2ClusterName, 2).find('a').click();
      fleetClusterDetailsPage.waitForPage(null, 'repos');
      fleetClusterDetailsPage.clusterTabs().clickTabWithSelector('[data-testid="btn-repos"]');

      // check state
      fleetClusterDetailsPage.gitReposList().details(this.gitRepo, 1).contains('Ready');
      // check name
      fleetClusterDetailsPage.gitReposList().details(this.gitRepo, 2).should('be.visible');
      // check repo
      fleetClusterDetailsPage.gitReposList().details(this.gitRepo, 3).contains('rancher/fleet-examples master');
      // check target
      fleetClusterDetailsPage.gitReposList().details(this.gitRepo, 4).contains('Advanced');
      // check cluster resources
      fleetClusterDetailsPage.gitReposList().details(this.gitRepo, 5).should('have.text', ' 6 ');
    });

    it('check all tabs are available in the details view', function() {
      // testing https://github.com/rancher/dashboard/issues/11155
      const fleetClusterDetailsPage = new FleetClusterDetailsPo(namespace, this.rke2Ec2ClusterName);

      // go to fleet clusters
      FleetClusterListPagePo.navTo();
      fleetClusterListPage.waitForPage();
      headerPo.selectWorkspace(namespace);
      fleetClusterListPage.clusterList().details(this.rke2Ec2ClusterName, 2).find('a').click();
      fleetClusterDetailsPage.waitForPage(null, 'repos');
      fleetClusterDetailsPage.clusterTabs().allTabs().should('have.length', 4, { timeout: 10000 });
      const tabs = ['Git Repos', 'Conditions', 'Recent Events', 'Related Resources'];

      fleetClusterDetailsPage.clusterTabs().tabNames().each((el, i) => {
        expect(el).to.eq(tabs[i]);
      });
    });

    it('Git Repos Tab Add Repository button takes you to the correct page', function() {
      const fleetClusterDetailsPage = new FleetClusterDetailsPo(namespace, this.rke2Ec2ClusterName);

      fleetClusterDetailsPage.waitForPage(null, 'repos');
      fleetClusterDetailsPage.gitReposTab().addRepostoryButton().click();

      cy.url().should('include', `${ Cypress.config().baseUrl }/c/_/fleet/fleet.cattle.io.gitrepo/create`);
    });

    it('adding git repo should add bundles on downstream cluster (deployments added)', function() {
      const deploymentsList = new WorkloadsDeploymentsListPagePo(this.clusterId);

      deploymentsList.goTo();
      deploymentsList.waitForPage();

      const deployments = ['frontend', 'redis-master', 'redis-slave'];

      for (const i in deployments) {
        deploymentsList.details(deployments[i], 1).contains('Active', { timeout: 15000 });
      }
    });

    it('can Pause/Unpause', function() {
      // go to fleet clusters
      FleetClusterListPagePo.navTo();
      fleetClusterListPage.waitForPage();
      headerPo.selectWorkspace(namespace);

      cy.intercept('PUT', `v1/fleet.cattle.io.clusters/${ namespace }/${ this.rke2Ec2ClusterName }`).as('pauseAndUnpause');

      // pause
      fleetClusterListPage.clusterList().actionMenu(this.rke2Ec2ClusterName).getMenuItem('Pause').click();
      cy.wait('@pauseAndUnpause').then(({ response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(response?.body).to.have.property('kind', 'Cluster');
        expect(response?.body.metadata).to.have.property('name', this.rke2Ec2ClusterName);
        expect(response?.body.spec).to.have.property('paused', true);
      });

      // check cluster state
      fleetClusterListPage.clusterList().details(this.rke2Ec2ClusterName, 1).contains('Paused', { timeout: 60000 });

      // unpause
      fleetClusterListPage.clusterList().actionMenu(this.rke2Ec2ClusterName).getMenuItem('Unpause').click();
      cy.wait('@pauseAndUnpause').then(({ response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(response?.body).to.have.property('kind', 'Cluster');
        expect(response?.body.metadata).to.have.property('name', this.rke2Ec2ClusterName);
        expect(response?.body.spec).to.have.property('paused', false);
      });

      // check cluster state
      fleetClusterListPage.clusterList().details(this.rke2Ec2ClusterName, 1).contains('Active', { timeout: 120000 });
    });

    it('can Edit Config', function() {
      // go to fleet clusters
      FleetClusterListPagePo.navTo();
      fleetClusterListPage.waitForPage();
      headerPo.selectWorkspace(namespace);
      fleetClusterListPage.clusterList().actionMenu(this.rke2Ec2ClusterName).getMenuItem('Edit Config').click();

      const editFleetCluster = fleetClusterListPage.editFleetCluster(undefined, this.rke2Ec2ClusterName);

      editFleetCluster.waitForPage('mode=edit');
      editFleetCluster.nameNsDescription().description().set(`${ this.rke2Ec2ClusterName }-fleet-desc`);
      editFleetCluster.saveCreateForm().cruResource().saveAndWaitForRequests('PUT', `v1/fleet.cattle.io.clusters/${ namespace }/${ this.rke2Ec2ClusterName }`)
        .then(({ response }) => {
          expect(response?.statusCode).to.eq(200);
          expect(response?.body.metadata).to.have.property('name', this.rke2Ec2ClusterName);
          expect(response?.body.metadata.annotations).to.have.property('field.cattle.io/description', `${ this.rke2Ec2ClusterName }-fleet-desc`);
        });
      fleetClusterListPage.waitForPage();
    });

    it('can Download YAML', function() {
      cy.deleteDownloadsFolder();

      FleetClusterListPagePo.navTo();
      fleetClusterListPage.waitForPage();
      headerPo.selectWorkspace(namespace);
      fleetClusterListPage.clusterList().actionMenu(this.rke2Ec2ClusterName).getMenuItem('Download YAML').click();

      const downloadedFilename = path.join(downloadsFolder, `${ this.rke2Ec2ClusterName }.yaml`);

      cy.readFile(downloadedFilename).then((buffer) => {
        const obj: any = jsyaml.load(buffer);

        // Basic checks on the downloaded YAML
        expect(obj.kind).to.equal('Cluster');
        expect(obj.metadata.annotations['objectset.rio.cattle.io/id']).to.equal('fleet-cluster');
        expect(obj.metadata.annotations['objectset.rio.cattle.io/owner-name']).to.equal(this.rke2Ec2ClusterName);
        expect(obj.metadata.annotations['objectset.rio.cattle.io/owner-namespace']).to.equal(namespace);
      });
    });

    it('removing git repo should remove bundles on downstream cluster (deployments removed)', function() {
      const deploymentsList = new WorkloadsDeploymentsListPagePo(this.clusterId);

      // delete gitrepo
      cy.deleteRancherResource('v1', `fleet.cattle.io.gitrepos/${ namespace }`, this.gitRepo).then(() => {
        removeGitRepo = false;
      });

      deploymentsList.goTo();
      deploymentsList.waitForPage();
      deploymentsList.sortableTable().checkLoadingIndicatorNotVisible();
      deploymentsList.sortableTable().checkRowCount(true, 1);
    });

    it('cluster should be removed from fleet cluster list once deleted', () => {
      if (removeCluster) {
        //  delete cluster
        cy.get<string>('@rke2Ec2ClusterName').then((name) => {
          cy.deleteRancherResource('v1', `provisioning.cattle.io.clusters/${ namespace }`, name);
          removeCluster = false;
        });
      }

      FleetClusterListPagePo.navTo();
      fleetClusterListPage.waitForPage();
      headerPo.selectWorkspace(namespace);
      fleetClusterListPage.sortableTable().checkLoadingIndicatorNotVisible();
      fleetClusterListPage.sortableTable().checkRowCount(true, 1);
    });

    after('clean up', () => {
      if (removeCluster) {
        //  delete cluster
        cy.get<string>('@rke2Ec2ClusterName').then((name) => {
          cy.deleteRancherResource('v1', `provisioning.cattle.io.clusters/${ namespace }`, name);
        });
      }
      if (removeGitRepo) {
        // delete gitrepo
        cy.get<string>('@gitRepo').then((name) => {
          cy.deleteRancherResource('v1', `fleet.cattle.io.gitrepos/${ namespace }`, name);
        });
      }
    });
  });

  describe('List', { tags: ['@fleet', '@adminUser'] }, () => {
    const fleetClusterListPage = new FleetClusterListPagePo();
    let removeGitRepo = false;
    const workspace = 'fleet-local';

    beforeEach(() => {
      cy.login();
      fleetClusterListPage.goTo();

      // NB: No additional clusters are provisioned
      // Look only at the local clusters
      headerPo.selectWorkspace(workspace);
    });

    it('should be able to list clusters in local workspace', () => {
      fleetClusterListPage.checkRowCount(false, 1);
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
      cy.createE2EResourceName('git-repo').as('gitRepo');

      cy.get<string>('@gitRepo').then((repoName) => {
        cy.createRancherResource('v1', 'fleet.cattle.io.gitrepos', gitRepoTargetAllClustersRequest(workspace, repoName, gitRepoUrl, branch, paths)).then(() => {
          removeGitRepo = true;
        });

        // go to fleet gitrepo and wait until git repo is in active state
        fleetGitRepoListPage.navTo();
        fleetGitRepoListPage.waitForPage();
        headerPo.selectWorkspace(workspace);
        fleetGitRepoListPage.repoList().rowWithName(repoName).checkVisible();

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
    });

    after('clean up', () => {
      if (removeGitRepo) {
        // delete gitrepo
        cy.get<string>('@gitRepo').then((name) => {
          cy.deleteRancherResource('v1', `fleet.cattle.io.gitrepos/${ workspace }`, name);
        });
      }
    });
  });
});
