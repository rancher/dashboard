import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import LoadingPo from '@/cypress/e2e/po/components/loading.po';
import ClusterManagerCreateEKSPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-eks.po';
import * as eksDefaultSettings from '@/cypress/e2e/blueprints/cluster_management/eks-default-settings';

/******
 *  Running this test will delete all Amazon cloud credentials from the target cluster
 ******/

describe('Create EKS cluster', { testIsolation: 'off', tags: ['@manager', '@adminUser', '@jenkins'] }, () => {
  const clusterList = new ClusterManagerListPagePo();
  const loadingPo = new LoadingPo('.loading-indicator');

  let cloudcredentialId = '';
  let clusterId = '';

  let eksSettings = {
    eksRegion:     eksDefaultSettings.DEFAULT_REGION,
    nodegroupName: eksDefaultSettings.DEFAULT_NODE_GROUP_CONFIG.nodegroupName,
    nodeRole:      eksDefaultSettings.DEFAULT_NODE_GROUP_CONFIG.nodeRole,
    desiredSize:   eksDefaultSettings.DEFAULT_NODE_GROUP_CONFIG.desiredSize,
    maxSize:       eksDefaultSettings.DEFAULT_NODE_GROUP_CONFIG.maxSize,
    minSize:       eksDefaultSettings.DEFAULT_NODE_GROUP_CONFIG.minSize,
    diskSize:      eksDefaultSettings.DEFAULT_NODE_GROUP_CONFIG.diskSize,
    instanceType:  eksDefaultSettings.DEFAULT_NODE_GROUP_CONFIG.instanceType,
    publicAccess:  eksDefaultSettings.DEFAULT_EKS_CONFIG.publicAccess,
    privateAccess: eksDefaultSettings.DEFAULT_EKS_CONFIG.privateAccess
  }

  const createEKSClusterPage = new ClusterManagerCreateEKSPagePo();
  const cloudCredForm = createEKSClusterPage.cloudCredentialsForm();

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
    cy.createE2EResourceName('ekscluster').as('eksClusterName');

    // create cluster
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createEKSClusterPage.selectKubeProvider(0);
    loadingPo.checkNotExists();
    createEKSClusterPage.rke2PageTitle().should('include', 'Create Amazon EKS');
    createEKSClusterPage.waitForPage('type=amazoneks&rkeType=rke2');

    // create amazon cloud credential
    cloudCredForm.saveButton().expectToBeDisabled();
    cy.createE2EResourceName('ekscloudcredential').then((eksCloudCredentialName) => {
      cloudCredForm.nameNsDescription().name().set(eksCloudCredentialName);
    });
    cloudCredForm.accessKey().set(Cypress.env('awsAccessKey'));
    cloudCredForm.secretKey().set(Cypress.env('awsSecretKey'));
    cloudCredForm.secretKey().set(Cypress.env('awsSecretKey'));
    cloudCredForm.saveButton().expectToBeEnabled();

    cy.intercept('GET', '/v1/management.cattle.io.users?exclude=metadata.managedFields').as('pageLoad');
    cloudCredForm.saveCreateForm().cruResource().saveAndWaitForRequests('POST', '/v3/cloudcredentials').then((req) => {
      expect(req.response?.statusCode).to.equal(201);
      cloudcredentialId = req.response?.body.id.replace(':', '%3A');
    });

    cy.wait('@pageLoad').its('response.statusCode').should('eq', 200);
    loadingPo.checkNotExists();
    createEKSClusterPage.waitForPage('type=amazoneks&rkeType=rke2#group1%200');
  });

  it('can create an Amazon EKS cluster by just filling in the mandatory fields', function() {
    // Set the cluster name and description in the Create EKS Page
    createEKSClusterPage.getClusterName().set(this.eksClusterName);
    createEKSClusterPage.getClusterDescription().set(`${ this.eksClusterName }-description`);

    // Create EKS Cluster and verify that the properties posted to the server match the expected settings
    cy.intercept('POST', 'v3/clusters').as('createEKSCluster');
    createEKSClusterPage.create();
    cy.wait('@createEKSCluster').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body).to.have.property('type', 'cluster');
      expect(response?.body).to.have.property('name', this.eksClusterName);
      expect(response?.body).to.have.property('description', `${ this.eksClusterName }-description`);
      clusterId = response?.body.id;
    });

    clusterList.waitForPage();
    clusterList.list().state(this.eksClusterName).should('contain.text', 'Provisioning');
  });

  it('can create an Amazon EKS cluster with default values', function() {
    // Verify that eks-zone-select dropdown is set to the default zone
    createEKSClusterPage.getEKSzoneSelect().checkOptionSelected(eksSettings.eksRegion);

    // Get latest EKS kubernetes version and verify that eks-version-select dropdown is set to the default version as defined in CruEKS.vue
    const latestEKSversion = createEKSClusterPage.getLatestEKSversion();

    createEKSClusterPage.getEKSversionSelect().checkOptionSelected(latestEKSversion);

    // Check the node group name is set to the default name
    createEKSClusterPage.getEKSnodeGroup().checkOptionSelected(eksSettings.nodegroupName);

    // Set the cluster name and description in the Create EKS Page
    createEKSClusterPage.getClusterName().set(this.eksClusterName);
    createEKSClusterPage.getClusterDescription().set(`${ this.eksClusterName }-description`);

    // Create EKS Cluster and verify that the properties posted to the server match the expected settings
    cy.intercept('POST', 'v3/clusters').as('createEKSCluster');
    createEKSClusterPage.create();
    cy.wait('@createEKSCluster').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body).to.have.property('type', 'cluster');
      expect(response?.body).to.have.property('name', this.eksClusterName);
      expect(response?.body).to.have.property('description', `${ this.eksClusterName }-description`);
      expect(response?.body.spec).to.have.property('kubernetesVersion').contains(latestEKSversion);
      clusterId = response?.body.id;
    });

    clusterList.waitForPage();
    clusterList.list().state(this.eksClusterName).should('contain.text', 'Provisioning');
  });

  afterEach('clean up', () => {
    // delete cluster
    cy.deleteRancherResource('v1', 'provisioning.cattle.io.clusters', `fleet-default/${ clusterId }`, false);

    // clean up Amazon cloud credentials
    cy.getRancherResource('v3', 'cloudcredentials', null, null).then((resp: Cypress.Response<any>) => {
      const body = resp.body;

      if (body.pagination['total'] > 0) {
        body.data.forEach((item: any) => {
          if (item.amazonec2credentialConfig) {
            const id = item.id;

            cy.deleteRancherResource('v3', 'cloudcredentials', id);
          } else {
            cy.log('There are no existing Amazon cloud credentials to delete');
          }
        });
      }
    });
  });
});
