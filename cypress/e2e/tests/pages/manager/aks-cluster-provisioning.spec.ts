import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import LoadingPo from '@/cypress/e2e/po/components/loading.po';
import ClusterManagerCreateAKSPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-aks.po';
import * as aksDefaultSettings from '@/cypress/e2e/blueprints/cluster_management/aks-default-settings';
import RadioGroupInputPo from '~/cypress/e2e/po/components/radio-group-input.po';
import { USERS_BASE_URL } from '@/cypress/support/utils/api-endpoints';

/******
 *  Running this test will delete all Amazon cloud credentials from the target cluster
 ******/

describe('Create AKS cluster', { testIsolation: 'off', tags: ['@manager', '@adminUser', '@jenkins'] }, () => {
  const clusterList = new ClusterManagerListPagePo();
  const loadingPo = new LoadingPo('.loading-indicator');

  let clusterId = '';

  const aksSettings = {
    aksRegion:          aksDefaultSettings.DEFAULT_REGION,
    nodegroupName:      aksDefaultSettings.defaultNodePool.name,
    vmSize:             aksDefaultSettings.defaultNodePool.vmSize,
    availabilityZones:  aksDefaultSettings.defaultNodePool.availabilityZones,
    osDiskType:         aksDefaultSettings.defaultNodePool.osDiskType,
    osDiskSize:         aksDefaultSettings.defaultNodePool.osDiskSizeGB,
    nodeCount:          aksDefaultSettings.defaultNodePool.count,
    maxPods:            aksDefaultSettings.defaultNodePool.maxPods,
    maxSurge:           aksDefaultSettings.defaultNodePool.maxSurge,
    linuxAdminUsername: aksDefaultSettings.defaultAksConfig.linuxAdminUsername,
    loadBalancerSku:    aksDefaultSettings.defaultAksConfig.loadBalancerSku,
    dnsPrefix:          'Loadbalancer (Default)',
    networkPlugin:      aksDefaultSettings.defaultAksConfig.networkPlugin,
    networkPolicy:      'None',
    virtualNetwork:     'None',
    serviceCidr:        aksDefaultSettings.defaultAksConfig.serviceCidr,
    dnsServiceIp:       aksDefaultSettings.defaultAksConfig.dnsServiceIp,
    dockerBridgeCidr:   aksDefaultSettings.defaultAksConfig.dockerBridgeCidr
  };

  const createAKSClusterPage = new ClusterManagerCreateAKSPagePo();
  const cloudCredForm = createAKSClusterPage.cloudCredentialsForm();

  before( 'add cloud credentials', () => {
    cy.login();
    HomePagePo.goTo();

    // clean up amazon cloud credentials
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

    // create cluster
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createAKSClusterPage.selectKubeProvider(1);
    loadingPo.checkNotExists();
    createAKSClusterPage.rke2PageTitle().should('include', 'Create Azure AKS');
    createAKSClusterPage.waitForPage('type=azureaks&rkeType=rke2');

    // create azure cloud credential
    cloudCredForm.saveButton().expectToBeDisabled();
    cy.createE2EResourceName('akscloudcredential').then((aksCloudCredentialName) => {
      cloudCredForm.nameNsDescription().name().set(aksCloudCredentialName);
    });
    cloudCredForm.subscriptionId().set(Cypress.env('azureSubscriptionId'));
    cloudCredForm.clientId().set(Cypress.env('azureClientId'));
    cloudCredForm.clientSecret().set(Cypress.env('azureClientSecret'));
    cloudCredForm.saveButton().expectToBeEnabled();

    cy.intercept('GET', `${ USERS_BASE_URL }?exclude=metadata.managedFields`).as('pageLoad');
    cloudCredForm.saveCreateForm().cruResource().saveAndWaitForRequests('POST', '/v3/cloudcredentials').then((req) => {
      expect(req.response?.statusCode).to.equal(201);
    });

    cy.wait('@pageLoad').its('response.statusCode').should('eq', 200);
    loadingPo.checkNotExists();

    createAKSClusterPage.waitForPage('type=azureaks&rkeType=rke2');
  });

  beforeEach( () => {
    cy.createE2EResourceName('akscluster').as('aksClusterName');
    cy.createE2EResourceName('akscluster2').as('aksClusterName2');
  });

  it('can create an Azure AKS cluster by just filling in the mandatory fields', function() {
    // Set the cluster name and description in the Create AKS Page
    createAKSClusterPage.getClusterName().set(this.aksClusterName);
    createAKSClusterPage.getClusterDescription().set(`${ this.aksClusterName }-description`);

    // Create AKS Cluster and verify that the properties posted to the server match the expected settings
    cy.intercept('POST', 'v3/clusters').as('createAKSCluster');
    createAKSClusterPage.create();
    cy.wait('@createAKSCluster').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body).to.have.property('type', 'cluster');
      expect(response?.body).to.have.property('name', this.aksClusterName);
      expect(response?.body).to.have.property('description', `${ this.aksClusterName }-description`);
      clusterId = response?.body.id;
    });

    clusterList.waitForPage();
    clusterList.list().state(this.aksClusterName).should('contain.text', 'Provisioning');
  });

  it('can create an Azure AKS cluster with default values', function() {
    // create cluster
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createAKSClusterPage.selectKubeProvider(1);
    loadingPo.checkNotExists();
    createAKSClusterPage.rke2PageTitle().should('include', 'Create Azure AKS');

    createAKSClusterPage.waitForPage('type=azureaks&rkeType=rke2');

    // Verify that aks-zone-select dropdown is set to the default zone
    createAKSClusterPage.getRegion().checkOptionSelected(aksSettings.aksRegion);

    // Get latest AKS kubernetes version and verify that aks-version-select dropdown is set to the default version as defined in CruAKS.vue
    const latestEKSversion = createAKSClusterPage.getLatestAKSversion();

    createAKSClusterPage.getVersion().checkOptionSelected(latestEKSversion);

    // Check that the node pool value are set to the default values
    createAKSClusterPage.getNodeGroup().shouldHaveValue(aksSettings.nodegroupName);
    createAKSClusterPage.getVMsize().checkOptionSelected(aksSettings.vmSize);

    const avZones = createAKSClusterPage.getAvailabiltyZones();

    avZones.checkContainsOptionSelected(aksSettings.availabilityZones[0]);
    avZones.checkContainsOptionSelected(aksSettings.availabilityZones[1]);
    avZones.checkContainsOptionSelected(aksSettings.availabilityZones[2]);
    createAKSClusterPage.getOSdiskType().shouldHaveValue(aksSettings.osDiskType);
    createAKSClusterPage.getOSdiskSize().shouldHaveValue(aksSettings.osDiskSize);

    createAKSClusterPage.getNodeCount().shouldHaveValue(aksSettings.nodeCount);
    createAKSClusterPage.getMaxPods().shouldHaveValue(aksSettings.maxPods);
    createAKSClusterPage.getMaxSurge().shouldHaveValue(aksSettings.maxSurge);
    createAKSClusterPage.getAutoScaling().isUnchecked();
    createAKSClusterPage.getLinuxAdmin().shouldHaveValue(aksSettings.linuxAdminUsername);
    createAKSClusterPage.getClusterResourceGroup().getAttributeValue('placeholder').should('equal', 'aks-resource-group');
    createAKSClusterPage.getNodeResourceGroup().getAttributeValue('placeholder').should('equal', 'aks-node-resource-group');
    createAKSClusterPage.getLogResourceGroup().expectToBeDisabled();
    createAKSClusterPage.getLogWorkspaceName().expectToBeDisabled();
    createAKSClusterPage.getContainerMonitoring().isDisabled();
    createAKSClusterPage.getSSHkey().getAttributeValue('placeholder').should('equal', 'Paste in your SSH public key');
    createAKSClusterPage.getLoadBalancerSKU().isDisabled();
    createAKSClusterPage.getLoadBalancerSKU().checkOptionSelected(aksSettings.loadBalancerSku);
    createAKSClusterPage.getInputDNSprefix().getAttributeValue('placeholder').should('contain', 'aks-dns-x');
    createAKSClusterPage.getDNSprefix().checkOptionSelected(aksSettings.dnsPrefix);
    createAKSClusterPage.getNetworkPlugin().checkOptionSelected(aksSettings.networkPlugin);
    createAKSClusterPage.getNetworkPolicy().checkOptionSelected(aksSettings.networkPolicy);
    createAKSClusterPage.getVirtualNetwork().checkOptionSelected(aksSettings.virtualNetwork);
    createAKSClusterPage.getKubernetesSAR().shouldHaveValue(aksSettings.serviceCidr);
    createAKSClusterPage.getKubernetesDNS().shouldHaveValue(aksSettings.dnsServiceIp);
    createAKSClusterPage.getDockerBridge().shouldHaveValue(aksSettings.dockerBridgeCidr);

    // Check that standard role is selected
    const userModebuttom = new RadioGroupInputPo('[data-testid= "User"]');

    userModebuttom.isUnchecked(0);

    const systemModeButton = new RadioGroupInputPo('[data-testid= "System"]');

    systemModeButton.isChecked(0);

    // Check that Service Principal is selected

    const servicePButtom = new RadioGroupInputPo('[data-testid= "Service Principal"]');

    servicePButtom.isChecked(0);

    const managedIdButton = new RadioGroupInputPo('[data-testid= "Managed Identity"]');

    managedIdButton.isUnchecked(0);

    createAKSClusterPage.getProjNetworkIsolation().isDisabled();
    createAKSClusterPage.getProjNetworkIsolation().isUnchecked();
    createAKSClusterPage.getHTTProuting().isUnchecked();
    createAKSClusterPage.getEnablePrivateCluster().isUnchecked();
    createAKSClusterPage.getAuthIPranges().isUnchecked();

    // Set the cluster name and description in the Create AKS Page
    createAKSClusterPage.getClusterName().set(this.aksClusterName2);
    createAKSClusterPage.getClusterDescription().set(`${ this.aksClusterName2 }-description`);

    // Create AKS Cluster and verify that the properties posted to the server match the expected settings
    cy.intercept('POST', 'v3/clusters').as('createAKSCluster');
    createAKSClusterPage.create();
    cy.wait('@createAKSCluster').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body).to.have.property('type', 'cluster');
      expect(response?.body).to.have.property('name', this.aksClusterName2);
      expect(response?.body).to.have.property('description', `${ this.aksClusterName2 }-description`);
      expect(response?.body.eksConfig).to.have.property('kubernetesVersion').contains(latestEKSversion);
      expect(response?.body.eksConfig).to.have.property('region', aksSettings.aksRegion);
      expect(response?.body.eksConfig).to.have.property('privateAccess', aksSettings.privateAccess);
      expect(response?.body.eksConfig).to.have.property('publicAccess', aksSettings.publicAccess);
      expect(response?.body.eksConfig.nodeGroups[0]).to.have.property('nodegroupName', aksSettings.nodegroupName);
      expect(response?.body.eksConfig.nodeGroups[0]).to.have.property('desiredSize', Number(aksSettings.desiredSize));
      expect(response?.body.eksConfig.nodeGroups[0]).to.have.property('minSize', Number(aksSettings.minSize));
      expect(response?.body.eksConfig.nodeGroups[0]).to.have.property('maxSize', Number(aksSettings.maxSize));
      expect(response?.body.eksConfig.nodeGroups[0]).to.have.property('instanceType', aksSettings.instanceType);
      expect(response?.body.eksConfig.nodeGroups[0]).to.have.property('diskSize', Number(aksSettings.diskSize));
      clusterId = response?.body.id;
    });

    clusterList.waitForPage();
    clusterList.list().state(this.aksClusterName).should('contain.text', 'Provisioning');
  });

  after('clean up', () => {
    // delete cluster
    cy.deleteRancherResource('v1', 'provisioning.cattle.io.clusters', `fleet-default/${ clusterId }`, false);

    // clean up Amazon cloud credentials
    cy.getRancherResource('v3', 'cloudcredentials', null, null).then((resp: Cypress.Response<any>) => {
      const body = resp.body;

      if (body.pagination['total'] > 0) {
        body.data.forEach((item: any) => {
          if (item.azurecredentialConfig) {
            const id = item.id;

            cy.deleteRancherResource('v3', 'cloudcredentials', id);
          } else {
            cy.log('There are no existing Azure cloud credentials to delete');
          }
        });
      }
    });
  });
});
