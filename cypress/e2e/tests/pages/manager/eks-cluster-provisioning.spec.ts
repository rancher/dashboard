import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import LoadingPo from '@/cypress/e2e/po/components/loading.po';
import ClusterManagerCreateEKSPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-eks.po';
import * as eksDefaultSettings from '@/cypress/e2e/blueprints/cluster_management/eks-default-settings';
import RadioGroupInputPo from '~/cypress/e2e/po/components/radio-group-input.po';

/******
 *  Running this test will delete all Amazon cloud credentials from the target cluster
 ******/

describe('Create EKS cluster', { testIsolation: 'off', tags: ['@manager', '@adminUser', '@jenkins'] }, () => {
  const clusterList = new ClusterManagerListPagePo();
  const loadingPo = new LoadingPo('.loading-indicator');

  let clusterId = '';

  const eksSettings = {
    eksRegion:      eksDefaultSettings.DEFAULT_REGION,
    nodegroupName:  eksDefaultSettings.DEFAULT_NODE_GROUP_CONFIG.nodegroupName,
    nodeRole:       eksDefaultSettings.DEFAULT_NODE_GROUP_CONFIG.nodeRole,
    desiredSize:    eksDefaultSettings.DEFAULT_NODE_GROUP_CONFIG.desiredSize,
    maxSize:        eksDefaultSettings.DEFAULT_NODE_GROUP_CONFIG.maxSize,
    minSize:        eksDefaultSettings.DEFAULT_NODE_GROUP_CONFIG.minSize,
    diskSize:       eksDefaultSettings.DEFAULT_NODE_GROUP_CONFIG.diskSize,
    instanceType:   eksDefaultSettings.DEFAULT_NODE_GROUP_CONFIG.instanceType,
    publicAccess:   eksDefaultSettings.DEFAULT_EKS_CONFIG.publicAccess,
    privateAccess:  eksDefaultSettings.DEFAULT_EKS_CONFIG.privateAccess,
    launchTemplate: 'Default (One will be created automatically)'
  };

  const createEKSClusterPage = new ClusterManagerCreateEKSPagePo();
  const cloudCredForm = createEKSClusterPage.cloudCredentialsForm();

  before( 'add cloud credentials', () => {
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
    cloudCredForm.saveButton().expectToBeEnabled();

    cy.intercept('GET', `/v1/management.cattle.io.users?*`).as('pageLoad');

    cloudCredForm.saveCreateForm().cruResource().saveAndWaitForRequests('POST', '/v3/cloudcredentials').then((req) => {
      expect(req.response?.statusCode).to.equal(201);
    });

    cy.wait('@pageLoad').its('response.statusCode').should('eq', 200);
    loadingPo.checkNotExists();
    createEKSClusterPage.waitForPage('type=amazoneks&rkeType=rke2');
  });

  beforeEach( () => {
    cy.createE2EResourceName('ekscluster').as('eksClusterName');
    cy.createE2EResourceName('ekscluster2').as('eksClusterName2');
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
    // create cluster
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createEKSClusterPage.selectKubeProvider(0);
    loadingPo.checkNotExists();
    createEKSClusterPage.rke2PageTitle().should('include', 'Create Amazon EKS');
    createEKSClusterPage.waitForPage('type=amazoneks&rkeType=rke2');

    // Verify that eks-zone-select dropdown is set to the default zone
    createEKSClusterPage.getRegion().checkOptionSelected(eksSettings.eksRegion);

    // Get latest EKS kubernetes version and verify that eks-version-select dropdown is set to the default version as defined in CruEKS.vue
    const latestEKSversion = createEKSClusterPage.getLatestEKSversion();

    createEKSClusterPage.getVersion().checkOptionSelected(latestEKSversion);

    // Check the node group name is set to the default name
    createEKSClusterPage.getNodeGroup().shouldHaveValue(eksSettings.nodegroupName);

    // Check the node role is set to the default role
    createEKSClusterPage.getNodeRole().checkOptionSelected(eksSettings.nodeRole);

    // Check the default ASG Sizes
    createEKSClusterPage.getDesiredASGSize().shouldHaveValue(eksSettings.desiredSize);
    createEKSClusterPage.getMinASGSize().shouldHaveValue(eksSettings.minSize);
    createEKSClusterPage.getMaxASGSize().shouldHaveValue(eksSettings.maxSize);

    // Check the default Launch template
    createEKSClusterPage.getLauchTemplate().checkOptionSelected(eksSettings.launchTemplate);

    // Check the default instance type
    createEKSClusterPage.getInstanceType().checkContainsOptionSelected(eksSettings.instanceType);

    // Check the default volume Size
    createEKSClusterPage.getDiskSize().shouldHaveValue(eksSettings.diskSize);

    // Check that standard role is selected
    const serviceRolebuttonGroup = new RadioGroupInputPo('[data-testid= "eks-service-role-radio"]');

    serviceRolebuttonGroup.isChecked(0);

    // Check that standard Networking access
    createEKSClusterPage.getPublicAccess().isChecked();
    createEKSClusterPage.getPrivateAccess().isUnchecked();

    // Check that default VPC and subnets are set
    const vpcButtonGroup = new RadioGroupInputPo('[aria-label="VPCs and Subnets"]');

    vpcButtonGroup.isChecked(0);

    // Set the cluster name and description in the Create EKS Page
    createEKSClusterPage.getClusterName().set(this.eksClusterName2);
    createEKSClusterPage.getClusterDescription().set(`${ this.eksClusterName2 }-description`);

    // Create EKS Cluster and verify that the properties posted to the server match the expected settings
    cy.intercept('POST', 'v3/clusters').as('createEKSCluster');
    createEKSClusterPage.create();
    cy.wait('@createEKSCluster').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body).to.have.property('type', 'cluster');
      expect(response?.body).to.have.property('name', this.eksClusterName2);
      expect(response?.body).to.have.property('description', `${ this.eksClusterName2 }-description`);
      expect(response?.body.eksConfig).to.have.property('kubernetesVersion').contains(latestEKSversion);
      expect(response?.body.eksConfig).to.have.property('region', eksSettings.eksRegion);
      expect(response?.body.eksConfig).to.have.property('privateAccess', eksSettings.privateAccess);
      expect(response?.body.eksConfig).to.have.property('publicAccess', eksSettings.publicAccess);
      expect(response?.body.eksConfig.nodeGroups[0]).to.have.property('nodegroupName', eksSettings.nodegroupName);
      expect(response?.body.eksConfig.nodeGroups[0]).to.have.property('desiredSize', Number(eksSettings.desiredSize));
      expect(response?.body.eksConfig.nodeGroups[0]).to.have.property('minSize', Number(eksSettings.minSize));
      expect(response?.body.eksConfig.nodeGroups[0]).to.have.property('maxSize', Number(eksSettings.maxSize));
      expect(response?.body.eksConfig.nodeGroups[0]).to.have.property('instanceType', eksSettings.instanceType);
      expect(response?.body.eksConfig.nodeGroups[0]).to.have.property('diskSize', Number(eksSettings.diskSize));
      clusterId = response?.body.id;
    });

    clusterList.waitForPage();
    clusterList.list().state(this.eksClusterName).should('contain.text', 'Provisioning');
  });

  after('clean up', () => {
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
