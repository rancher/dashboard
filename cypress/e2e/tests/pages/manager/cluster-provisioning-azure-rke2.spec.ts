import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerCreateRke2AzurePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-azure.po';
import ClusterManagerDetailRke2AzurePagePo from '@/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail-rke2-azure.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import LoadingPo from '@/cypress/e2e/po/components/loading.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import { MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

// will only run this in jenkins pipeline where cloud credentials are stored
describe('Deploy RKE2 cluster using node driver on Azure', { testIsolation: 'off', tags: ['@manager', '@adminUser', '@standardUser', '@jenkins'] }, () => {
  const clusterList = new ClusterManagerListPagePo();
  let removeCloudCred = false;
  let cloudcredentialId = '';
  let k8sVersion = '';
  let clusterId = '';

  before(() => {
    cy.login();
    HomePagePo.goTo();

    // clean up azure cloud credentials
    cy.getRancherResource('v3', 'cloudcredentials', null, null).then((resp: Cypress.Response<any>) => {
      const body = resp.body;

      if (body.pagination['total'] > 0) {
        body.data.forEach((item: any) => {
          if (item.azurecredentialConfig) {
            const id = item.id;

            cy.deleteRancherResource('v3', 'cloudcredentials', id);
          } else {
            cy.log('There are no existing azure cloud credentials to delete');
          }
        });
      }
    });
  });

  beforeEach(() => {
    cy.createE2EResourceName('rke2azure').as('rke2AzureClusterName');
    cy.createE2EResourceName('azurecloudcredential').as('azureCloudCredentialName');
  });

  it('can not create an Azure RKE2 cluster if invalid Azure credentials are provided', function() {
    const createRKE2ClusterPage = new ClusterManagerCreateRke2AzurePagePo();
    const cloudCredForm = createRKE2ClusterPage.cloudCredentialsForm();

    cy.intercept('GET', '/v1-rke2-release/releases').as('getRke2Releases');

    // create cluster
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createRKE2ClusterPage.rkeToggle().set('RKE2/K3s');
    createRKE2ClusterPage.selectCreate(1);
    createRKE2ClusterPage.rke2PageTitle().should('include', 'Create Azure');
    createRKE2ClusterPage.waitForPage('type=azure&rkeType=rke2');

    // create Azure cloud credential
    cloudCredForm.saveButton().expectToBeDisabled();
    cloudCredForm.nameNsDescription().name().set(this.azureCloudCredentialName);
    cloudCredForm.environment().toggle();
    cloudCredForm.environment().clickOptionWithLabel('AzurePublicCloud');
    cloudCredForm.subscriptionId().set('bad');
    cloudCredForm.clientId().set('bad', true);
    cloudCredForm.clientSecret().set('bad', true);
    cloudCredForm.saveButton().expectToBeEnabled();

    // wait for the api call to test credentials
    // verify it returns an error
    cloudCredForm.saveCreateForm().cruResource().saveAndWaitForRequests('POST', '/meta/aksCheckCredentials').then((req) => {
      expect(req.response?.statusCode).to.equal(400);
    });

    // verify that the error is shown
    createRKE2ClusterPage.errorsBanner().checkExists();

    // verify that the rke2 provisioning form is not shown
    createRKE2ClusterPage.nameNsDescription().description().checkNotVisible();
  });

  it('can create a RKE2 cluster using Azure cloud provider', function() {
    const createRKE2ClusterPage = new ClusterManagerCreateRke2AzurePagePo();
    const cloudCredForm = createRKE2ClusterPage.cloudCredentialsForm();

    cy.intercept('GET', '/v1-rke2-release/releases').as('getRke2Releases');

    // create cluster
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createRKE2ClusterPage.rkeToggle().set('RKE2/K3s');
    createRKE2ClusterPage.selectCreate(1);
    createRKE2ClusterPage.rke2PageTitle().should('include', 'Create Azure');
    createRKE2ClusterPage.waitForPage('type=azure&rkeType=rke2');

    // create Azure cloud credential
    cloudCredForm.saveButton().expectToBeDisabled();
    cloudCredForm.nameNsDescription().name().set(this.azureCloudCredentialName);
    cloudCredForm.environment().toggle();
    cloudCredForm.environment().clickOptionWithLabel('AzurePublicCloud');
    cloudCredForm.subscriptionId().set(Cypress.env('azureSubscriptionId'));
    cloudCredForm.clientId().set(Cypress.env('azureClientId'), true);
    cloudCredForm.clientSecret().set(Cypress.env('azureClientSecret'), true);
    cloudCredForm.saveButton().expectToBeEnabled();
    cloudCredForm.saveCreateForm().cruResource().saveAndWaitForRequests('POST', '/v3/cloudcredentials').then((req) => {
      expect(req.response?.statusCode).to.equal(201);
      cloudcredentialId = req.response?.body.id;
      removeCloudCred = true;
    });

    const loadingPo = new LoadingPo('.loading-indicator');

    loadingPo.checkNotExists();
    createRKE2ClusterPage.waitForPage('type=azure&rkeType=rke2', 'basic');
    createRKE2ClusterPage.nameNsDescription().name().set(this.rke2AzureClusterName);
    createRKE2ClusterPage.nameNsDescription().description().set(`${ this.rke2AzureClusterName }-description`);

    // Get latest kubernetes version
    cy.wait('@getRke2Releases').then(({ response }) => {
      expect(response.statusCode).to.eq(200);
      const length = response.body.data.length - 1;

      k8sVersion = response.body.data[length].id;
      cy.wrap(k8sVersion).as('k8sVersion');
    });

    cy.get<string>('@k8sVersion').then((version) => {
      createRKE2ClusterPage.basicsTab().kubernetesVersions().toggle();
      createRKE2ClusterPage.basicsTab().kubernetesVersions().clickOptionWithLabel(version);

      cy.intercept('POST', 'v1/provisioning.cattle.io.clusters').as('createRke2Cluster');
      createRKE2ClusterPage.create();
      cy.wait('@createRke2Cluster').then(function({ response }) {
        expect(response?.statusCode).to.eq(201);
        expect(response?.body).to.have.property('kind', 'Cluster');
        expect(response?.body.metadata).to.have.property('name', this.rke2AzureClusterName);
        expect(response?.body.spec).to.have.property('kubernetesVersion', version);
        clusterId = response?.body.id;
      });
      clusterList.waitForPage();
      clusterList.list().state(this.rke2AzureClusterName).should('contain', 'Reconciling');
    });
  });

  it('can see details of cluster in cluster list', function() {
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();

    // check states
    clusterList.list().state(this.rke2AzureClusterName).should('contain.text', 'Updating');
    clusterList.list().state(this.rke2AzureClusterName).contains('Active', { timeout: 700000 });

    // check k8s version
    clusterList.list().version(this.rke2AzureClusterName).then((el) => {
      expect(el.text().trim()).contains(k8sVersion);
    });

    // check provider
    clusterList.list().provider(this.rke2AzureClusterName).should('contain.text', 'Azure');
    clusterList.list().providerSubType(this.rke2AzureClusterName).should('contain.text', 'RKE2');

    // check machines
    clusterList.list().machines(this.rke2AzureClusterName).should('contain.text', '1');
  });

  it('cluster details page', function() {
    const clusterDetails = new ClusterManagerDetailRke2AzurePagePo(undefined, this.rke2AzureClusterName);
    const tabbedPo = new TabbedPo('[data-testid="tabbed-block"]');

    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();

    // check cluster details page > machine pools
    clusterList.list().name(this.rke2AzureClusterName).click();
    clusterDetails.waitForPage(null, 'machine-pools');
    clusterDetails.resourceDetail().title().should('contain', this.rke2AzureClusterName);
    clusterDetails.machinePoolsList().details(`${ this.rke2AzureClusterName }-pool1-`, 1).should('contain', 'Running');

    // check cluster details page > recent events
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.clickOnClusterName(this.rke2AzureClusterName);
    clusterDetails.selectTab(tabbedPo, '[data-testid="btn-events"]');
    clusterDetails.recentEventsList().checkTableIsEmpty();
  });

  it('can create snapshot', function() {
    const clusterDetails = new ClusterManagerDetailRke2AzurePagePo(undefined, this.rke2AzureClusterName);
    const tabbedPo = new TabbedPo('[data-testid="tabbed-block"]');

    // check cluster details page > snapshots
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.clickOnClusterName(this.rke2AzureClusterName);
    clusterDetails.selectTab(tabbedPo, '[data-testid="btn-snapshots"]');
    clusterDetails.snapshotsList().checkTableIsEmpty();

    // create on demand snapshot
    clusterDetails.snapshotsList().clickOnSnapshotNow();

    // wait for cluster to be active
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.list().state(this.rke2AzureClusterName).should('contain.text', 'Updating');
    clusterList.list().state(this.rke2AzureClusterName).contains('Active', { timeout: 700000 });

    // check snapshot exist
    clusterList.clickOnClusterName(this.rke2AzureClusterName);
    clusterDetails.selectTab(tabbedPo, '[data-testid="btn-snapshots"]');
    clusterDetails.snapshotsList().checkSnapshotExist(`on-demand-${ this.rke2AzureClusterName }`);
  });

  it('can delete an Azure RKE2 cluster', function() {
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.list().actionMenu(this.rke2AzureClusterName).getMenuItem('Delete').click();

    clusterList.sortableTable().rowNames('.cluster-link').then((rows: any) => {
      const promptRemove = new PromptRemove();

      promptRemove.confirm(this.rke2AzureClusterName);
      promptRemove.remove();

      clusterList.waitForPage();
      clusterList.list().state(this.rke2AzureClusterName).should('contain.text', 'Removing');
      clusterList.list().state(this.rke2AzureClusterName).contains('Removing', { timeout: 200000 }).should('not.exist');
      clusterList.sortableTable().checkRowCount(false, rows.length - 1, MEDIUM_TIMEOUT_OPT);
      clusterList.sortableTable().rowNames('.cluster-link').should('not.contain', this.rke2AzureClusterName);
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
