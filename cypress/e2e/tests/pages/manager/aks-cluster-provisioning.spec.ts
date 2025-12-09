import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import LoadingPo from '@/cypress/e2e/po/components/loading.po';
import ClusterManagerCreateAKSPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-aks.po';
import * as aksDefaultSettings from '@/cypress/e2e/blueprints/cluster_management/aks-default-settings';
import RadioInputPo from '~/cypress/e2e/po/components/radio-input.po';
import { USERS_BASE_URL } from '@/cypress/support/utils/api-endpoints';

/******
 *  Running this test will delete all Amazon cloud credentials from the target cluster
 ******/

describe('Create AKS cluster', { testIsolation: 'off', tags: ['@manager', '@adminUser', '@jenkins'] }, () => {
  const clusterList = new ClusterManagerListPagePo();
  const loadingPo = new LoadingPo('.loading-indicator');

  let clusterId = '';

  const aksSettings = {
    aksRegion:          'East US',
    nodegroupName:      aksDefaultSettings.defaultNodePool.name,
    vmSize:             aksDefaultSettings.defaultNodePool.vmSize,
    availabilityZones:  aksDefaultSettings.defaultNodePool.availabilityZones,
    osDiskType:         aksDefaultSettings.defaultNodePool.osDiskType,
    osDiskSize:         aksDefaultSettings.defaultNodePool.osDiskSizeGB,
    nodeCount:          aksDefaultSettings.defaultNodePool.count,
    maxPods:            aksDefaultSettings.defaultNodePool.maxPods,
    maxSurge:           aksDefaultSettings.defaultNodePool.maxSurge,
    enableAutoScaling:  aksDefaultSettings.defaultNodePool.enableAutoScaling,
    linuxAdminUsername: aksDefaultSettings.defaultAksConfig.linuxAdminUsername,
    loadBalancerSku:    aksDefaultSettings.defaultAksConfig.loadBalancerSku,
    outboundType:       aksDefaultSettings.defaultAksConfig.outboundType,
    networkPlugin:      aksDefaultSettings.defaultAksConfig.networkPlugin,
    networkPolicy:      'None',
    virtualNetwork:     'None',
    serviceCidr:        aksDefaultSettings.defaultAksConfig.serviceCidr,
    dnsServiceIp:       aksDefaultSettings.defaultAksConfig.dnsServiceIp,
    dockerBridgeCidr:   aksDefaultSettings.defaultAksConfig.dockerBridgeCidr,
    resourceGroup:      'aks-resource-group',
    dnsPrefix:          'dns-test',
    mode:               aksDefaultSettings.defaultNodePool.mode,
    privateCluster:     aksDefaultSettings.defaultAksConfig.privateCluster
  };

  const createAKSClusterPage = new ClusterManagerCreateAKSPagePo();
  const cloudCredForm = createAKSClusterPage.cloudCredentialsForm();

  before( 'add cloud credentials', () => {
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

    // create cluster
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createAKSClusterPage.selectKubeProvider(1);
    loadingPo.checkNotExists();
    createAKSClusterPage.rke2PageTitle().should('include', 'Create Azure AKS');
    createAKSClusterPage.waitForPage('type=aks&rkeType=rke2');

    // create azure cloud credential
    cloudCredForm.saveButton().expectToBeDisabled();
    cy.createE2EResourceName('akscloudcredential').then((aksCloudCredentialName) => {
      cloudCredForm.nameNsDescription().name().set(aksCloudCredentialName);
    });
    cloudCredForm.subscriptionId().set(Cypress.env('azureSubscriptionId'), true);
    cloudCredForm.clientId().set(Cypress.env('azureClientId'), true);
    cloudCredForm.clientSecret().set(Cypress.env('azureClientSecret'), true);
    cloudCredForm.saveButton().expectToBeEnabled();

    cy.intercept('GET', `${ USERS_BASE_URL }?exclude=metadata.managedFields`).as('pageLoad');
    cloudCredForm.saveCreateForm().cruResource().saveAndWaitForRequests('POST', '/v3/cloudcredentials').then((req) => {
      expect(req.response?.statusCode).to.equal(201);
    });

    loadingPo.checkNotExists();
    createAKSClusterPage.waitForPage('type=aks&rkeType=rke2');
  });

  beforeEach( () => {
    cy.viewport(1440, 900);
    cy.createE2EResourceName('akscluster').as('aksClusterName');
    cy.createE2EResourceName('akscluster2').as('aksClusterName2');
  });

  it('can create an Azure AKS cluster by just filling in the mandatory fields', function() {
    // Set the cluster name and description in the Create AKS Page
    createAKSClusterPage.getClusterName().set(this.aksClusterName);
    createAKSClusterPage.getClusterDescription().set(`${ this.aksClusterName }-description`);
    createAKSClusterPage.getClusterResourceGroup().set('aks-resource-group');
    createAKSClusterPage.getInputDNSprefix().set('dns-test');

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
    cy.intercept('GET', '**/meta/aksVersions*').as('getAksVersions');
    createAKSClusterPage.waitForPage('type=aks&rkeType=rke2');

    // Verify that aks-zone-select dropdown is set to the default zone
    createAKSClusterPage.getRegion().checkOptionSelected(aksSettings.aksRegion);

    // Get latest AKS kubernetes version and verify that aks-version-select dropdown is set to the default version as defined in CruAKS.vue

    cy.wait('@getAksVersions').then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      const versionsArray = response?.body as string[];
      const latestAKSversion = createAKSClusterPage.getLatestAKSversion(versionsArray);

      cy.wrap(latestAKSversion).as('latestAKSversion');

      createAKSClusterPage.getKubernetesVersion().checkOptionSelected(latestAKSversion);
    });

    // Check that the node pool value are set to the default values
    createAKSClusterPage.getNodeGroup().shouldHaveValue(aksSettings.nodegroupName);
    createAKSClusterPage.getVMsize().checkContainsOptionSelected(aksSettings.vmSize);

    const avZones = createAKSClusterPage.getAvailabiltyZones();

    avZones.checkContainsOptionSelected(aksSettings.availabilityZones);
    createAKSClusterPage.getOSdiskType().checkOptionSelected(aksSettings.osDiskType);
    createAKSClusterPage.getOSdiskSize().shouldHaveValue(aksSettings.osDiskSize);

    createAKSClusterPage.getNodeCount().shouldHaveValue(aksSettings.nodeCount);
    createAKSClusterPage.getMaxPods().shouldHaveValue(aksSettings.maxPods);
    createAKSClusterPage.getMaxSurge().shouldHaveValue(aksSettings.maxSurge);
    createAKSClusterPage.getAutoScaling().isUnchecked();
    createAKSClusterPage.getLinuxAdmin().shouldHaveValue(aksSettings.linuxAdminUsername);
    createAKSClusterPage.getClusterResourceGroup().getAttributeValue('placeholder').should('equal', aksSettings.resourceGroup);
    createAKSClusterPage.getNodeResourceGroup().getAttributeValue('placeholder').should('equal', 'aks-node-resource-group');
    createAKSClusterPage.getLogResourceGroup().expectToBeDisabled();
    createAKSClusterPage.getLogWorkspaceName().expectToBeDisabled();
    createAKSClusterPage.getContainerMonitoring().isUnchecked();
    createAKSClusterPage.getSSHkey().getAttributeValue('placeholder').should('equal', 'Paste in your SSH public key');
    createAKSClusterPage.getLoadBalancerSKU().isDisabled();
    createAKSClusterPage.getLoadBalancerSKU().checkOptionSelected(aksSettings.loadBalancerSku);
    createAKSClusterPage.getInputDNSprefix().getAttributeValue('placeholder').should('contain', 'aks-dns-x');
    createAKSClusterPage.getOutboundType().checkContainsOptionSelected(aksSettings.outboundType);
    createAKSClusterPage.getNetworkPlugin().checkContainsOptionSelected(aksSettings.networkPlugin);
    createAKSClusterPage.getNetworkPolicy().checkOptionSelected(aksSettings.networkPolicy);
    createAKSClusterPage.getVirtualNetwork().checkOptionSelected(aksSettings.virtualNetwork);
    createAKSClusterPage.getKubernetesSAR().shouldHaveValue(aksSettings.serviceCidr);
    createAKSClusterPage.getKubernetesDNS().shouldHaveValue(aksSettings.dnsServiceIp);
    createAKSClusterPage.getDockerBridge().shouldHaveValue(aksSettings.dockerBridgeCidr);

    // Check that standard role is selected
    const userModebuttom = new RadioInputPo('[aria-label="User"]');

    userModebuttom.isUnchecked();

    const systemModeButton = new RadioInputPo('[aria-label="System"]');

    systemModeButton.isChecked();

    // Check that Service Principal is selected

    const servicePButtom = new RadioInputPo('[aria-label="Service Principal"]');

    servicePButtom.isChecked();

    const managedIdButton = new RadioInputPo('[aria-label="Managed Identity"]');

    managedIdButton.isUnchecked();

    createAKSClusterPage.getProjNetworkIsolation().isDisabled();
    createAKSClusterPage.getProjNetworkIsolation().isUnchecked();
    createAKSClusterPage.getHTTProuting().isUnchecked();
    createAKSClusterPage.getEnablePrivateCluster().isUnchecked();
    createAKSClusterPage.getAuthIPranges().isUnchecked();

    // Set the mandatory fields in the Create AKS Page
    createAKSClusterPage.getClusterName().set(this.aksClusterName2);
    createAKSClusterPage.getClusterDescription().set(`${ this.aksClusterName2 }-description`);
    createAKSClusterPage.getClusterResourceGroup().set(aksSettings.resourceGroup);
    createAKSClusterPage.getInputDNSprefix().set(aksSettings.dnsPrefix);

    // Create AKS Cluster and verify that the properties posted to the server match the expected settings
    cy.intercept('POST', 'v3/clusters').as('createAKSCluster');
    createAKSClusterPage.create();
    cy.wait('@createAKSCluster').then(({ response }) => {
      cy.get('@latestAKSversion').then((latestAKSversion) => {
        expect(response?.body.aksConfig).to.have.property('kubernetesVersion').equals(latestAKSversion);
      });
      expect(response?.statusCode).to.eq(201);
      expect(response?.body).to.have.property('type', 'cluster');
      expect(response?.body).to.have.property('name', this.aksClusterName2);
      expect(response?.body).to.have.property('description', `${ this.aksClusterName2 }-description`);
      expect(response?.body.aksConfig).to.have.property('resourceLocation', aksDefaultSettings.DEFAULT_REGION);
      // extract the availability zone numbers to match with the obejct sent in the request
      const zoneNumbers = aksSettings.availabilityZones.match(/\d+/g);
      const availabilityZones = response?.body.aksConfig.nodePools[0]?.availabilityZones;

      expect(availabilityZones).to.deep.include.members(zoneNumbers);
      const nodeCount = response?.body.aksConfig.nodePools[0]?.count;

      expect(nodeCount.toString()).to.equal(aksSettings.nodeCount);
      expect(response?.body.aksConfig.nodePools[0]).to.have.property('name', aksSettings.nodegroupName);
      expect(response?.body.aksConfig.nodePools[0]).to.have.property('enableAutoScaling', aksSettings.enableAutoScaling);
      expect(response?.body.aksConfig.nodePools[0]).to.have.property('maxSurge', aksSettings.maxSurge);
      expect(response?.body.aksConfig.nodePools[0]).to.have.property('maxPods', Number(aksSettings.maxPods));
      expect(response?.body.aksConfig.nodePools[0]).to.have.property('mode', aksSettings.mode);
      expect(response?.body.aksConfig.nodePools[0]).to.have.property('vmSize', aksSettings.vmSize);
      expect(response?.body.aksConfig.nodePools[0]).to.have.property('osDiskType', aksSettings.osDiskType);
      expect(response?.body.aksConfig.nodePools[0]).to.have.property('osDiskSizeGB', Number(aksSettings.osDiskSize));
      expect(response?.body.aksConfig).to.have.property('linuxAdminUsername', aksSettings.linuxAdminUsername);
      expect(response?.body.aksConfig).to.have.property('resourceGroup', aksSettings.resourceGroup);
      expect(response?.body.aksConfig).to.have.property('loadBalancerSku', aksSettings.loadBalancerSku);
      expect(response?.body.aksConfig).to.have.property('dnsPrefix', aksSettings.dnsPrefix);

      const outboundType = response.body.aksConfig.outboundType;

      expect(outboundType.toLowerCase()).to.equal(aksSettings.outboundType.toLowerCase());

      const networkPlugin = response.body.aksConfig.networkPlugin;

      expect(networkPlugin.toLowerCase()).to.equal(aksSettings.networkPlugin.toLowerCase());
      expect(response?.body.aksConfig).to.not.have.property('networkPolicy');
      expect(response?.body.aksConfig).to.not.have.property('virtualNetwork');
      expect(response?.body.aksConfig).to.have.property('serviceCidr', aksSettings.serviceCidr);
      expect(response?.body.aksConfig).to.have.property('dnsServiceIp', aksSettings.dnsServiceIp);
      expect(response?.body.aksConfig).to.have.property('dockerBridgeCidr', aksSettings.dockerBridgeCidr);
      expect(response?.body.aksConfig).to.have.property('dockerBridgeCidr', aksSettings.dockerBridgeCidr);
      expect(response?.body.aksConfig).to.not.have.property('httpApplicationRouting');
      expect(response?.body.aksConfig).to.not.have.property('managedIdentity');
      expect(response?.body.aksConfig).to.not.have.property('authorizedIpRanges');
      expect(response?.body.aksConfig).to.have.property('privateCluster', aksSettings.privateCluster);
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
