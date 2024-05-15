import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerCreateRke2AzurePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-azure.po';
import ClusterManagerDetailRke2AzurePagePo from '@/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail-rke2-azure.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import LoadingPo from '@/cypress/e2e/po/components/loading.po';

// will only run this in jenkins pipeline where cloud credentials are stored
describe('Provision Node driver RKE2 cluster with Azure', { testIsolation: 'off', tags: ['@manager', '@adminUser', '@standardUser', '@jenkins'] }, () => {
  const clusterList = new ClusterManagerListPagePo();
  let removeCloudCred = false;
  let cloudcredentialId = '';

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

  it('can provision a RKE2 cluster with Azure cloud provider', function() {
    const createRKE2ClusterPage = new ClusterManagerCreateRke2AzurePagePo();
    const cloudCredForm = createRKE2ClusterPage.cloudCredentialsForm();
    const clusterDetails = new ClusterManagerDetailRke2AzurePagePo(undefined, this.rke2AzureClusterName);

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

    // Get kubernetes version options and store them in variables
    createRKE2ClusterPage.basicsTab().kubernetesVersions().toggle();
    createRKE2ClusterPage.basicsTab().kubernetesVersions().getOptions().each((el, index) => {
      cy.wrap(el.text().trim()).as(`k8sVersion${ index }`);
    })
      .then(function() {
        createRKE2ClusterPage.basicsTab().kubernetesVersions().clickOptionWithLabel(this.k8sVersion1);
      });

    cy.intercept('POST', 'v1/provisioning.cattle.io.clusters').as('createRke2Cluster');
    createRKE2ClusterPage.create();
    cy.wait('@createRke2Cluster').then(function({ response }) {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body).to.have.property('kind', 'Cluster');
      expect(response?.body.metadata).to.have.property('name', this.rke2AzureClusterName);
      expect(response?.body.spec).to.have.property('kubernetesVersion', this.k8sVersion1);
    });
    clusterList.waitForPage();

    // check states
    clusterList.list().state(this.rke2AzureClusterName).should('contain', 'Reconciling');
    clusterList.list().state(this.rke2AzureClusterName).should('contain', 'Updating');
    clusterList.list().state(this.rke2AzureClusterName).contains('Active', { timeout: 700000 });

    // check k8s version
    clusterList.list().version(this.rke2AzureClusterName).then(function(el) {
      expect(el.text().trim()).contains(this.k8sVersion1);
    });

    // check provider
    clusterList.list().provider(this.rke2AzureClusterName).should('contain', 'Azure');

    // check machines
    clusterList.list().machines(this.rke2AzureClusterName).should('contain', 1);

    // check cluster details page > machine pools
    clusterList.list().name(this.rke2AzureClusterName).click();
    clusterDetails.waitForPage(null, 'machine-pools');
    clusterDetails.resourceDetail().title().should('contain', this.rke2AzureClusterName);
    clusterDetails.machinePoolsList().details(`${ this.rke2AzureClusterName }-pool1-`, 1).should('contain', 'Running');
  });

  it('can delete a Azure  RKE2 cluster', function() {
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.list().actionMenu(this.rke2AzureClusterName).getMenuItem('Delete').click();

    clusterList.sortableTable().rowNames('.cluster-link').then((rows: any) => {
      const promptRemove = new PromptRemove();

      promptRemove.confirm(this.rke2AzureClusterName);
      promptRemove.remove();

      clusterList.waitForPage();
      clusterList.list().state(this.rke2AzureClusterName).should('contain', 'Removing');
      clusterList.list().state(this.rke2AzureClusterName).contains('Removing', { timeout: 200000 }).should('not.exist');
      clusterList.sortableTable().checkRowCount(false, rows.length - 1);
      clusterList.sortableTable().rowNames('.cluster-link').should('not.contain', this.rke2AzureClusterName);
    });
  });

  after('clean up', () => {
    if (removeCloudCred) {
      //  delete cloud cred
      cy.deleteRancherResource('v3', 'cloudCredentials', cloudcredentialId);
    }
  });
});
