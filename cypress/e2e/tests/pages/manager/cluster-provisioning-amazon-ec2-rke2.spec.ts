import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ClusterManagerCreateRke2AmazonPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-amazon.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerDetailRke2AmazonEc2PagePo from '@/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail-rke2-amazon.po';
import ClusterManagerEditGenericPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/edit/cluster-edit-generic.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import LoadingPo from '@/cypress/e2e/po/components/loading.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import { MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import { USERS_BASE_URL } from '@/cypress/support/utils/api-endpoints';

// will only run this in jenkins pipeline where cloud credentials are stored
describe('Deploy RKE2 cluster using node driver on Amazon EC2', { testIsolation: 'off', tags: ['@manager', '@adminUser', '@standardUser', '@jenkins'] }, () => {
  const clusterList = new ClusterManagerListPagePo();
  const loadingPo = new LoadingPo('.loading-indicator');

  let removeCloudCred = false;
  let cloudcredentialId = '';
  let k8sVersion = '';
  let olderK8sVersion = '';
  let clusterId = '';

  before(() => {
    cy.login();
    HomePagePo.goTo();

    // clean up amazon cloud credentials
    cy.getRancherResource('v3', 'cloudcredentials', null, null).then((resp: Cypress.Response<any>) => {
      const body = resp.body;

      if (body.pagination['total'] > 0) {
        body.data.forEach((item: any) => {
          if (item.amazonec2credentialConfig) {
            const id = item.id;

            cy.deleteRancherResource('v3', 'cloudcredentials', id);
          } else {
            cy.log('There are no existing amazon cloud credentials to delete');
          }
        });
      }
    });
  });

  beforeEach(() => {
    cy.createE2EResourceName('rke2ec2cluster').as('rke2Ec2ClusterName');
    cy.createE2EResourceName('ec2cloudcredential').as('ec2CloudCredentialName');
  });

  it('can create an RKE2 cluster using Amazon cloud provider', function() {
    const createRKE2ClusterPage = new ClusterManagerCreateRke2AmazonPagePo();
    const cloudCredForm = createRKE2ClusterPage.cloudCredentialsForm();

    cy.intercept('GET', '/v1-rke2-release/releases').as('getRke2Releases');

    // create cluster
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createRKE2ClusterPage.selectCreate(0);
    loadingPo.checkNotExists();
    createRKE2ClusterPage.rke2PageTitle().should('include', 'Create Amazon EC2');
    createRKE2ClusterPage.waitForPage('type=amazonec2&rkeType=rke2');

    // create amazon ec2 cloud credential
    cloudCredForm.saveButton().expectToBeDisabled();
    cloudCredForm.nameNsDescription().name().set(this.ec2CloudCredentialName);
    cloudCredForm.accessKey().set(Cypress.env('awsAccessKey'));
    cloudCredForm.secretKey().set(Cypress.env('awsSecretKey'), true);
    cloudCredForm.defaultRegion().toggle();
    cloudCredForm.defaultRegion().clickOptionWithLabel('us-west-1');
    cloudCredForm.saveButton().expectToBeEnabled();

    cy.intercept('GET', `${ USERS_BASE_URL }?*`).as('pageLoad');

    cloudCredForm.saveCreateForm().cruResource().saveAndWaitForRequests('POST', '/v3/cloudcredentials').then((req) => {
      expect(req.response?.statusCode).to.equal(201);
      cloudcredentialId = req.response?.body.id;
      removeCloudCred = true;
    });

    cy.wait('@pageLoad').its('response.statusCode').should('eq', 200);
    loadingPo.checkNotExists();
    createRKE2ClusterPage.waitForPage('type=amazonec2&rkeType=rke2', 'basic');
    createRKE2ClusterPage.nameNsDescription().name().set(this.rke2Ec2ClusterName);
    createRKE2ClusterPage.nameNsDescription().description().set(`${ this.rke2Ec2ClusterName }-description`);

    // Get kubernetes versions - use an older version for initial creation, then upgrade later
    cy.wait('@getRke2Releases').then(({ response }) => {
      expect(response.statusCode).to.eq(200);
      const index1 = response.body.data.length - 1;

      // Store the latest version for upgrade test
      k8sVersion = response.body.data[index1].id;
      cy.wrap(k8sVersion).as('k8sVersion');

      // Use the older version for cluster creation
      // This allows us to test the upgrade scenario
      const index2 = index1 - 1;

      olderK8sVersion = response.body.data[index2].id;
      cy.wrap(olderK8sVersion).as('olderK8sVersion');
    });

    cy.get<string>('@olderK8sVersion').then((version) => {
      createRKE2ClusterPage.basicsTab().kubernetesVersions().toggle();
      createRKE2ClusterPage.basicsTab().kubernetesVersions().clickOptionWithLabel(version);

      createRKE2ClusterPage.machinePoolTab().networks().toggle();
      createRKE2ClusterPage.machinePoolTab().networks().clickOptionWithLabel('default');

      cy.intercept('POST', 'v1/provisioning.cattle.io.clusters').as('createRke2Cluster');
      createRKE2ClusterPage.create();
      cy.wait('@createRke2Cluster').then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
        expect(response?.body).to.have.property('kind', 'Cluster');
        expect(response?.body.metadata).to.have.property('name', this.rke2Ec2ClusterName);
        expect(response?.body.spec).to.have.property('kubernetesVersion').contains(version);
        clusterId = response?.body.id;
      });
      clusterList.waitForPage();
      clusterList.list().state(this.rke2Ec2ClusterName).should('be.visible')
        .and(($el) => {
          const status = $el.text().trim();

          expect(['Reconciling', 'Updating']).to.include(status);
        });
    });
  });

  it('can see details of cluster in cluster list', function() {
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();

    // check Architecture
    // testing https://github.com/rancher/dashboard/issues/10831
    clusterList.list().version(this.rke2Ec2ClusterName).should('contain.text', '—').and('not.contain.text', 'Mixed');

    // check states
    clusterList.list().state(this.rke2Ec2ClusterName).should('contain.text', 'Updating');
    clusterList.list().state(this.rke2Ec2ClusterName).contains('Active', { timeout: 700000 });

    // check k8s version
    clusterList.list().version(this.rke2Ec2ClusterName).then((el) => {
      expect(el.text().trim()).contains(olderK8sVersion);
    });

    // check provider
    clusterList.list().provider(this.rke2Ec2ClusterName).should('contain.text', 'Amazon EC2');
    clusterList.list().providerSubType(this.rke2Ec2ClusterName).should('contain.text', 'RKE2');

    // check machines
    clusterList.list().machines(this.rke2Ec2ClusterName).should('contain.text', '1');
  });

  it('cluster details page', function() {
    const clusterDetails = new ClusterManagerDetailRke2AmazonEc2PagePo(undefined, this.rke2Ec2ClusterName);
    const tabbedPo = new TabbedPo('[data-testid="tabbed-block"]');

    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();

    // check cluster details page > machine pools
    clusterList.list().name(this.rke2Ec2ClusterName).click();
    clusterDetails.waitForPage(null, 'machine-pools');
    clusterDetails.resourceDetail().title().should('contain', this.rke2Ec2ClusterName);
    clusterDetails.machinePoolsList().details(`${ this.rke2Ec2ClusterName }-pool1-`, 1).should('contain', 'Running');

    // check cluster details page > recent events
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.goToDetailsPage(this.rke2Ec2ClusterName, '.cluster-link a');
    clusterDetails.waitForPage(null, 'machine-pools');
    clusterDetails.selectTab(tabbedPo, '[data-testid="btn-events"]');
    clusterDetails.waitForPage(null, 'events');
    clusterDetails.recentEventsList().checkTableIsEmpty();
  });

  it('can upgrade Kubernetes version', function() {
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();

    // Navigate to edit page
    clusterList.list().actionMenu(this.rke2Ec2ClusterName).getMenuItem('Edit Config').click();

    const editClusterPage = new ClusterManagerEditGenericPagePo('_', this.rke2Ec2ClusterName);

    editClusterPage.waitForPage('mode=edit', 'basic');

    // Verify we're starting with the older version
    editClusterPage.basicsTab().kubernetesVersions().checkContainsOptionSelected(olderK8sVersion);

    // Select the latest version for upgrade
    editClusterPage.basicsTab().kubernetesVersions().toggle();
    editClusterPage.basicsTab().kubernetesVersions().clickOptionWithLabel(k8sVersion);

    cy.intercept('PUT', `/v1/provisioning.cattle.io.clusters/fleet-default/${ this.rke2Ec2ClusterName }`).as('clusterUpdate');
    // Save the cluster to upgrade the Kubernetes version
    editClusterPage.save().click();

    // Wait for the cluster update to complete
    cy.wait('@clusterUpdate').then((interception) => {
      // If 409 conflict, wait for retry
      if (interception.response?.statusCode === 409) {
        cy.log('Cluster update failed with 409 error, waiting for retry...');

        return cy.wait('@clusterUpdate', MEDIUM_TIMEOUT_OPT);
      }

      return cy.wrap(interception);
    }).then(({ response }: any) => {
      expect(response?.statusCode).to.equal(200);
      expect(response?.body).to.have.property('kind', 'Cluster');
      expect(response?.body.metadata).to.have.property('name', this.rke2Ec2ClusterName);
      expect(response?.body.spec).to.have.property('kubernetesVersion').contains(k8sVersion);
    });

    clusterList.waitForPage();
    clusterList.list().state(this.rke2Ec2ClusterName).should('contain.text', 'Updating');
    clusterList.list().state(this.rke2Ec2ClusterName).contains('Active', { timeout: 700000 });

    // check k8s version
    clusterList.list().version(this.rke2Ec2ClusterName).then((el) => {
      expect(el.text().trim()).contains(k8sVersion);
    });

    // Navigate back to edit page to verify older version is disabled in dropdown
    clusterList.list().actionMenu(this.rke2Ec2ClusterName).getMenuItem('Edit Config').click();
    editClusterPage.waitForPage('mode=edit', 'basic');

    // Verify current version is selected
    editClusterPage.basicsTab().kubernetesVersions().checkContainsOptionSelected(k8sVersion);

    // Open dropdown and verify older version is disabled
    editClusterPage.basicsTab().kubernetesVersions().toggle();
    editClusterPage.basicsTab().kubernetesVersions().getOptions()
      .contains('li', olderK8sVersion)
      .should('have.class', 'vs__dropdown-option--disabled');
  });

  it('can create snapshot', function() {
    const clusterDetails = new ClusterManagerDetailRke2AmazonEc2PagePo(undefined, this.rke2Ec2ClusterName);
    const tabbedPo = new TabbedPo('[data-testid="tabbed-block"]');

    // check cluster details page > snapshots
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.goToDetailsPage(this.rke2Ec2ClusterName, '.cluster-link a');
    clusterDetails.waitForPage(null, 'machine-pools');
    clusterDetails.selectTab(tabbedPo, '[data-testid="btn-snapshots"]');
    clusterDetails.waitForPage(null, 'snapshots');
    clusterDetails.snapshotsList().checkTableIsEmpty();

    // create on demand snapshot
    clusterDetails.snapshotsList().clickOnSnapshotNow();

    // wait for cluster to be active
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.list().state(this.rke2Ec2ClusterName).should('contain.text', 'Updating');
    clusterList.list().state(this.rke2Ec2ClusterName).contains('Active', { timeout: 700000 });

    // check snapshot exist
    clusterList.goToDetailsPage(this.rke2Ec2ClusterName, '.cluster-link a');
    clusterDetails.waitForPage(null, 'machine-pools');
    clusterDetails.selectTab(tabbedPo, '[data-testid="btn-snapshots"]');
    clusterDetails.waitForPage(null, 'snapshots');
    clusterDetails.snapshotsList().checkSnapshotExist(`on-demand-${ this.rke2Ec2ClusterName }`);
  });

  it('can delete an Amazon EC2 RKE2 cluster', function() {
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.list().actionMenu(this.rke2Ec2ClusterName).getMenuItem('Delete').click();

    clusterList.sortableTable().rowNames('.cluster-link').then((rows: any) => {
      const promptRemove = new PromptRemove();

      promptRemove.confirm(this.rke2Ec2ClusterName);
      promptRemove.remove();

      clusterList.waitForPage();
      clusterList.list().state(this.rke2Ec2ClusterName).should('contain', 'Removing');
      clusterList.sortableTable().checkRowCount(false, rows.length - 1, MEDIUM_TIMEOUT_OPT);
      clusterList.sortableTable().rowNames('.cluster-link').should('not.contain', this.rke2Ec2ClusterName);
    });
  });

  after('clean up', () => {
    // delete cluster: needed here in case the delete test fails
    cy.deleteRancherResource('v1', 'provisioning.cattle.io.clusters', clusterId, false);
    if (removeCloudCred) {
      //  delete cloud cred
      cy.deleteRancherResource('v3', 'cloudCredentials', cloudcredentialId);
    }
  });
});
