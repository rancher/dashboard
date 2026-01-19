import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ClusterManagerCreateRke2AmazonPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-amazon.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerDetailRke2AmazonEc2PagePo from '@/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail-rke2-amazon.po';
import ClusterManagerEditGenericPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/edit/cluster-edit-generic.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import LoadingPo from '@/cypress/e2e/po/components/loading.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import { LONG_TIMEOUT_OPT, MEDIUM_TIMEOUT_OPT, VERY_LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import { USERS_BASE_URL } from '@/cypress/support/utils/api-endpoints';
import { promptModal } from '@/cypress/e2e/po/prompts/shared/modalInstances.po';

// will only run this in jenkins pipeline where cloud credentials are stored
describe('Deploy RKE2 cluster using node driver on Amazon EC2', { tags: ['@manager', '@adminUser', '@standardUser', '@jenkins'] }, () => {
  const clusterList = new ClusterManagerListPagePo();
  const loadingPo = new LoadingPo('.loading-indicator');

  let removeCloudCred = false;
  let cloudcredentialId = '';
  let latestK8sVersion = '';
  let olderK8sVersion = '';
  let clusterId = '';

  before(() => {
    cy.login();

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
    cy.login();
    HomePagePo.goTo();
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

    // Get kubernetes versions from the UI dropdown
    // Index 0 is the "RKE2" header, so actual versions start at index 1
    cy.wait('@getRke2Releases').its('response.statusCode').should('eq', 200);
    createRKE2ClusterPage.basicsTab().kubernetesVersions().toggle();
    createRKE2ClusterPage.basicsTab().kubernetesVersions().getOptions().then(($options) => {
      // Ensure we have at least 3 options
      expect($options.length).to.be.gt(2);

      // First RKE2 version (index 1) is the latest version
      latestK8sVersion = Cypress.$($options[1]).text().trim();
      cy.wrap(latestK8sVersion).as('latestK8sVersion');

      // Second RKE2 version (index 2) is the older version for cluster creation
      olderK8sVersion = Cypress.$($options[2]).text().trim();
      cy.wrap(olderK8sVersion).as('olderK8sVersion');

      cy.log(`latestK8sVersion: ${ latestK8sVersion }`);
      cy.log(`olderK8sVersion: ${ olderK8sVersion }`);

      // Set the k8s version
      createRKE2ClusterPage.basicsTab().kubernetesVersions().clickOptionWithLabel(olderK8sVersion);
    });

    // Set the network
    createRKE2ClusterPage.machinePoolTab().networks().toggle();
    createRKE2ClusterPage.machinePoolTab().networks().clickOptionWithLabel('default');

    // Create the cluster
    cy.intercept('POST', 'v1/provisioning.cattle.io.clusters').as('createRke2Cluster');
    createRKE2ClusterPage.create();
    cy.wait('@createRke2Cluster').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body).to.have.property('kind', 'Cluster');
      expect(response?.body.metadata).to.have.property('name', this.rke2Ec2ClusterName);
      expect(response?.body.spec).to.have.property('kubernetesVersion').contains(olderK8sVersion);
      clusterId = response?.body.id;
    });

    clusterList.waitForPage();
    clusterList.list().state(this.rke2Ec2ClusterName).should('be.visible')
      .and(($el) => {
        const status = $el.text().trim();

        expect(['Reconciling', 'Updating']).to.include(status);
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
    clusterList.list().state(this.rke2Ec2ClusterName).contains('Active', VERY_LONG_TIMEOUT_OPT);

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

    // check cluster details page > recent events
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
    editClusterPage.basicsTab().kubernetesVersions().clickOptionWithLabel(latestK8sVersion);

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
      expect(response?.body.spec).to.have.property('kubernetesVersion').contains(latestK8sVersion);
    });

    clusterList.waitForPage();
    clusterList.list().state(this.rke2Ec2ClusterName).should('contain.text', 'Updating');
    clusterList.list().state(this.rke2Ec2ClusterName).contains('Active', VERY_LONG_TIMEOUT_OPT);

    // check k8s version
    clusterList.list().version(this.rke2Ec2ClusterName).then((el) => {
      expect(el.text().trim()).contains(latestK8sVersion);
    });

    // Navigate back to edit page to verify older version is disabled in dropdown
    clusterList.list().actionMenu(this.rke2Ec2ClusterName).getMenuItem('Edit Config').click();
    editClusterPage.waitForPage('mode=edit', 'basic');

    // Verify current version is selected
    editClusterPage.basicsTab().kubernetesVersions().checkContainsOptionSelected(latestK8sVersion);

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
    clusterList.list().state(this.rke2Ec2ClusterName).contains('Active', VERY_LONG_TIMEOUT_OPT);

    // check snapshot exist
    clusterList.goToDetailsPage(this.rke2Ec2ClusterName, '.cluster-link a');
    clusterDetails.waitForPage(null, 'machine-pools');
    clusterDetails.selectTab(tabbedPo, '[data-testid="btn-snapshots"]');
    clusterDetails.waitForPage(null, 'snapshots');
    clusterDetails.snapshotsList().checkSnapshotExist(`on-demand-${ this.rke2Ec2ClusterName }`);
  });

  it('can scale up a machine pool', function() {
    // testing https://github.com/rancher/dashboard/issues/13285
    const clusterDetails = new ClusterManagerDetailRke2AmazonEc2PagePo(undefined, this.rke2Ec2ClusterName);

    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();

    // Navigate to cluster details page > machine pools
    clusterList.list().name(this.rke2Ec2ClusterName).click();
    clusterDetails.waitForPage(null, 'machine-pools');
    clusterDetails.resourceDetail().title().should('contain', this.rke2Ec2ClusterName);

    // Verify scaling buttons are present in the machine pools section
    clusterDetails.poolsList('machine').resourceTable().sortableTable().groupByButtons(1)
      .click();

    // Check for scale up button (it should be enabled)
    clusterDetails.poolsList('machine').scaleUpButton(`${ this.rke2Ec2ClusterName }-pool1`)
      .should('be.visible')
      .and('be.enabled');

    // Hover scale up button - tooltip should read "Scale Pool Up"
    clusterDetails.poolsList('machine').scaleButtonTooltip(`${ this.rke2Ec2ClusterName }-pool1`, 'plus')
      .waitForTooltipWithText('Scale Pool Up');
    clusterDetails.poolsList('machine').scaleButtonTooltip(`${ this.rke2Ec2ClusterName }-pool1`, 'plus')
      .hideTooltip();

    // Check for scale down button (it should be disabled initially)
    clusterDetails.poolsList('machine').scaleDownButton(`${ this.rke2Ec2ClusterName }-pool1`)
      .should('be.visible')
      .and('be.disabled');

    // Hover scale down button - tooltip should read "Scale Pool Down"
    clusterDetails.poolsList('machine').scaleButtonTooltip(`${ this.rke2Ec2ClusterName }-pool1`, 'minus')
      .waitForTooltipWithText('Scale Pool Down');
    clusterDetails.poolsList('machine').scaleButtonTooltip(`${ this.rke2Ec2ClusterName }-pool1`, 'minus')
      .hideTooltip();

    cy.intercept('PUT', ` /v1/provisioning.cattle.io.clusters/fleet-default/${ this.rke2Ec2ClusterName }`).as('scaleUpMachineDeployment');
    // Scale up the machine pool
    clusterDetails.poolsList('machine').scaleUpButton(`${ this.rke2Ec2ClusterName }-pool1`)
      .click();

    cy.wait('@scaleUpMachineDeployment').its('response.statusCode').should('eq', 200);

    // Verify the machine pool is scaled up to 2
    clusterDetails.poolsList('machine').machinePoolCount(`${ this.rke2Ec2ClusterName }-pool1`, /^2$/, VERY_LONG_TIMEOUT_OPT);
    clusterDetails.poolsList('machine').resourceTable().sortableTable().checkRowCount(false, 2, LONG_TIMEOUT_OPT);

    // Verify the scale down button is now enabled (since we have 2 nodes)
    clusterDetails.poolsList('machine').scaleDownButton(`${ this.rke2Ec2ClusterName }-pool1`)
      .should('be.enabled');

    // Verify the cluster is active
    clusterDetails.resourceDetail().masthead().resourceStatus().contains('Active', VERY_LONG_TIMEOUT_OPT);
    clusterDetails.poolsList('machine').resourceTable().sortableTable().checkRowCount(false, 2, MEDIUM_TIMEOUT_OPT);
  });

  it('can scale down a machine pool', function() {
    // testing https://github.com/rancher/dashboard/issues/13285
    // Set user preference to ensure the scale down confirmation modal always appears
    cy.setUserPreference({ 'scale-pool-prompt': false });

    const clusterDetails = new ClusterManagerDetailRke2AmazonEc2PagePo(undefined, this.rke2Ec2ClusterName);

    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();

    // Navigate to cluster details page > machine pools
    clusterList.list().name(this.rke2Ec2ClusterName).click();
    clusterDetails.waitForPage(null, 'machine-pools');
    clusterDetails.resourceDetail().title().should('contain', this.rke2Ec2ClusterName);

    // Verify we have 2 nodes to start with (from the previous scale up test)
    clusterDetails.poolsList('machine').resourceTable().sortableTable().groupByButtons(1)
      .click();

    clusterDetails.poolsList('machine').machinePoolCount(`${ this.rke2Ec2ClusterName }-pool1`, 2, MEDIUM_TIMEOUT_OPT);

    // Verify the scale down button is enabled
    clusterDetails.poolsList('machine').scaleDownButton(`${ this.rke2Ec2ClusterName }-pool1`)
      .should('be.visible')
      .and('be.enabled');

    cy.intercept('PUT', `/v1/provisioning.cattle.io.clusters/fleet-default/${ this.rke2Ec2ClusterName }`).as('scaleDownMachineDeployment');

    // Scale down the machine pool
    clusterDetails.poolsList('machine').scaleDownButton(`${ this.rke2Ec2ClusterName }-pool1`)
      .click();

    // Handle the scale down confirmation dialog
    promptModal().getBody().should('contain', 'You are attempting to delete the MachineDeployment');
    promptModal().getBody().should('contain', `${ this.rke2Ec2ClusterName }-pool1`);
    promptModal().clickActionButton('Confirm');

    cy.wait('@scaleDownMachineDeployment').its('response.statusCode').should('eq', 200);

    // Verify the machine pool is scaled down to 1
    clusterDetails.poolsList('machine').machinePoolCount(`${ this.rke2Ec2ClusterName }-pool1`, /^1$/, MEDIUM_TIMEOUT_OPT);

    // Verify the cluster is updating -> active
    clusterDetails.resourceDetail().masthead().resourceStatus().contains('Updating');
    clusterDetails.resourceDetail().masthead().resourceStatus().contains('Active', VERY_LONG_TIMEOUT_OPT);
    clusterDetails.poolsList('machine').resourceTable().sortableTable().checkRowCount(false, 1, VERY_LONG_TIMEOUT_OPT);

    // Verify the scale down button is now disabled (can't scale below 1)
    clusterDetails.poolsList('machine').scaleDownButton(`${ this.rke2Ec2ClusterName }-pool1`)
      .should('be.disabled');
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

    cy.setUserPreference({ 'scale-pool-prompt': null });
  });
});
