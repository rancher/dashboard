import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ClusterManagerCreateRke2AmazonPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-amazon.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerDetailRke2AmazonEc2PagePo from '@/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail-rke2-amazon.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

// will only run this in jenkins pipeline where cloud credentials are stored
describe('Provision Node driver RKE2 cluster', { testIsolation: 'off', tags: ['@manager', '@jenkins'] }, () => {
  const clusterList = new ClusterManagerListPagePo('_');
  let removeCloudCred = false;
  let cloudcredentialId = '';

  before(() => {
    cy.login();
    HomePagePo.goTo();
    cy.createE2EResourceName('rke2ec2cluster').as('rke2Ec2ClusterName');
    cy.createE2EResourceName('ec2cloudcredential').as('ec2CloudCredentialName');
  });

  it('can provision a Amazon EC2 RKE2 cluster with Amazon cloud provider', function() {
    const createRKE2ClusterPage = new ClusterManagerCreateRke2AmazonPagePo();
    const clusterDetails = new ClusterManagerDetailRke2AmazonEc2PagePo('_', this.rke2Ec2ClusterName);

    // create cluster
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createRKE2ClusterPage.rkeToggle().set('RKE2/K3s');
    createRKE2ClusterPage.selectCreate(0);
    createRKE2ClusterPage.title().should('include', 'Create Amazon EC2');

    // create amazon ec2 cloud credential
    createRKE2ClusterPage.cloudCredentialsForm().nameNsDescription().name().set(this.ec2CloudCredentialName);
    createRKE2ClusterPage.cloudCredentialsForm().accessKey().set(Cypress.env('awsAccessKey'));
    createRKE2ClusterPage.cloudCredentialsForm().secretKey().set(Cypress.env('awsSecretKey'), true);
    createRKE2ClusterPage.cloudCredentialsForm().defaultRegion().toggle();
    createRKE2ClusterPage.cloudCredentialsForm().defaultRegion().clickOptionWithLabel('us-west-2');
    createRKE2ClusterPage.cloudCredentialsForm().saveCreateForm().cruResource().saveAndWaitForRequests('POST', '/v3/cloudcredentials')
      .then((req) => {
        cloudcredentialId = req.response?.body.id;
        cy.log(cloudcredentialId);
        removeCloudCred = true;
      });
    cy.log(cloudcredentialId);

    createRKE2ClusterPage.nameNsDescription().name().set(this.rke2Ec2ClusterName);
    createRKE2ClusterPage.nameNsDescription().description().set(`${ this.rke2Ec2ClusterName }-description`);

    // Get kubernetes version options and store them in variables
    createRKE2ClusterPage.basicsTab().kubernetesVersions().toggle();
    createRKE2ClusterPage.basicsTab().kubernetesVersions().getOptions().each((el, index) => {
      cy.wrap(el.text().trim()).as(`k8sVersion${ index }`);
    });
    createRKE2ClusterPage.basicsTab().kubernetesVersions().clickOption(1);

    createRKE2ClusterPage.machinePoolTab().networks().toggle();
    createRKE2ClusterPage.machinePoolTab().networks().clickOption(3);

    cy.intercept('POST', 'v1/provisioning.cattle.io.clusters').as('createRke2Cluster');
    createRKE2ClusterPage.create();
    cy.wait('@createRke2Cluster').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body).to.have.property('kind', 'Cluster');
      expect(response?.body.metadata).to.have.property('name', this.rke2Ec2ClusterName);
      expect(response?.body.spec).to.have.property('kubernetesVersion', this.k8sVersion1);
    });
    clusterList.waitForPage();

    // check states
    clusterList.list().state(this.rke2Ec2ClusterName).should('contain', 'Reconciling');
    clusterList.list().state(this.rke2Ec2ClusterName).should('contain', 'Updating');
    clusterList.list().state(this.rke2Ec2ClusterName).contains('Active', { timeout: 400000 });

    // check k8s version
    clusterList.list().version(this.rke2Ec2ClusterName).then(function(el) {
      expect(el.text().trim()).contains(this.k8sVersion1);
    });

    // check provider
    clusterList.list().provider(this.rke2Ec2ClusterName).should('contain', 'Amazon EC2');

    // check machines
    clusterList.list().machines(this.rke2Ec2ClusterName).should('contain', 1);

    // check cluster details page > machine pools
    clusterList.list().name(this.rke2Ec2ClusterName).click();
    clusterDetails.waitForPage(null, 'machine-pools');
    clusterDetails.mastheadTitle().should('contain', this.rke2Ec2ClusterName);
    clusterDetails.machinePoolsList().details(`${ this.rke2Ec2ClusterName }-pool1-`, 1).should('contain', 'Running');
  });

  it('can delete a Amazon EC2 RKE2 cluster', function() {
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.list().actionMenu(this.rke2Ec2ClusterName).getMenuItem('Delete').click();

    clusterList.sortableTable().rowNames('.cluster-link').then((rows: any) => {
      const promptRemove = new PromptRemove();

      promptRemove.confirm(this.rke2Ec2ClusterName);
      promptRemove.remove();

      clusterList.waitForPage();
      clusterList.list().state(this.rke2Ec2ClusterName).should('contain', 'Removing');
      clusterList.sortableTable().checkRowCount(false, rows.length - 1);
      clusterList.sortableTable().rowNames('.cluster-link').should('not.contain', this.rke2Ec2ClusterName);
    });
  });

  after('clean up', () => {
    if (removeCloudCred) {
      //  delete cloud cred
      cy.deleteRancherResource('v3', 'cloudCredentials', cloudcredentialId);
    }
  });
});
