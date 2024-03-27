import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ClusterManagerCreateRke1AzurePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke1-azure.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerDetailRke1AzurePagePo from '@/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail-rke1-azure.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import LoadingPo from '@/cypress/e2e/po/components/loading.po';
import EmberBannersPo from '@/cypress/e2e/po/components/ember/ember-banners.po';

// will only run this in jenkins pipeline where cloud credentials are stored
describe('Provision Node driver RKE1 cluster with Azure', { testIsolation: 'off', tags: ['@manager', '@adminUser', '@standardUser', '@jenkins'] }, () => {
  const clusterList = new ClusterManagerListPagePo();
  const createRKE1ClusterPage = new ClusterManagerCreateRke1AzurePagePo();
  let removeNodeTemplate = false;
  let cloudcredentialId = '';
  let nodeTemplateId = '';

  before(() => {
    cy.login();
    HomePagePo.goTo();

    // clean up azure node templates and cloud credentials
    cy.getRancherResource('v3', 'nodetemplate', null, null).then((resp: Cypress.Response<any>) => {
      const body = resp.body;

      if (body.pagination['total'] > 0) {
        body.data.forEach((item: any) => {
          if (item.driver === 'azure') {
            const id = item['id'];

            cy.deleteNodeTemplate(id, 60000);
          } else {
            cy.log('There are no existing azure node templates to delete');
          }
        });
      }
    });

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
    cy.viewport(1440, 900);
    cy.createE2EResourceName('rke1azurecluster').as('rke1AzureClusterName');
    cy.createE2EResourceName('template').as('templateName');
    cy.createE2EResourceName('node').as('nodeName');
    cy.getRancherResource('v3', 'clusters', null, null).then((resp: Cypress.Response<any>) => {
      const data = resp.body.data;

      data.forEach((item: any) => {
        cy.get('@rke1AzureClusterName').then((name) => {
          if (item.name === name) {
            cy.wrap(item['id']).as('clusterId');
          } else {
            cy.log(`${ name } does not exist`);
          }
        });
      });
    });
  });

  it('can provision a azure rke1 cluster with Azure cloud provider', function() {
    const addNodeTemplateForm = createRKE1ClusterPage.addNodeTemplateForm();

    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createRKE1ClusterPage.rkeToggle().set('RKE1');
    createRKE1ClusterPage.selectCreate(1);
    createRKE1ClusterPage.rke2PageTitle().should('include', 'Create Azure');
    createRKE1ClusterPage.waitForPage('type=azure&rkeType=rke1');
    createRKE1ClusterPage.addNodeTemplate();

    // create azure cloud credential and node template
    addNodeTemplateForm.subscriptionId().set(Cypress.env('azureSubscriptionId'));
    addNodeTemplateForm.clientId().set(Cypress.env('azureClientId'), true);
    addNodeTemplateForm.clientSecret().set(Cypress.env('azureClientSecret'), true);
    cy.intercept('POST', '/v3/cloudcredential').as('createCloudCred');
    addNodeTemplateForm.create();
    cy.wait('@createCloudCred').then((req) => {
      expect(req.response?.statusCode).to.equal(201);
      cloudcredentialId = req.response?.body.id;
    });

    addNodeTemplateForm.nextButton('Next: Authenticate & configure nodes').click();
    addNodeTemplateForm.region().checkOptionSelected('West US');
    addNodeTemplateForm.image().set('canonical:0001-com-ubuntu-server-jammy:22_04-lts:latest');
    addNodeTemplateForm.templateName().set(this.templateName);
    cy.intercept('POST', '/v3/nodetemplate').as('createTemplate');
    addNodeTemplateForm.create();
    cy.wait('@createTemplate').then((req) => {
      expect(req.response?.statusCode).to.equal(201);
      nodeTemplateId = req.response?.body.id;
      removeNodeTemplate = true;
    });
    addNodeTemplateForm.checkNotExists();

    // Create cluster
    createRKE1ClusterPage.waitForPage('type=azure&rkeType=rke1');
    createRKE1ClusterPage.rke1PageTitle().should('contain', 'Add Cluster - Azure');
    createRKE1ClusterPage.clusterName().set(this.rke1AzureClusterName);
    createRKE1ClusterPage.nodePoolTable().name(1).set(this.nodeName);
    createRKE1ClusterPage.nodePoolTable().count(1).set('1');
    createRKE1ClusterPage.nodePoolTable().template(1).checkOptionSelected(this.templateName);
    createRKE1ClusterPage.nodePoolTable().etcd(1).set();
    createRKE1ClusterPage.nodePoolTable().controlPlane(1).set();
    createRKE1ClusterPage.nodePoolTable().worker(1).checkOptionSelected();

    // Get kubernetes version options and store them in variables
    createRKE1ClusterPage.kubernetesOptions().kubernetesVersion().getOptions().each((el, index) => {
      cy.wrap(el.text().trim()).as(`k8sVersion${ index }`);
    })
      .then(function() {
        createRKE1ClusterPage.kubernetesOptions().kubernetesVersion().selectMenuItemByOption(this.k8sVersion1);
      });

    cy.intercept('POST', 'v3/cluster?_replace=true').as('createRke1Cluster');
    createRKE1ClusterPage.createRKE1();
    cy.wait('@createRke1Cluster').then(function(req) {
      expect(req.response?.statusCode).to.eq(201);
      expect(req.response?.body).to.have.property('type', 'cluster');
      expect(req.response?.body).to.have.property('name', this.rke1AzureClusterName);
      expect(req.response?.body.rancherKubernetesEngineConfig).to.have.property('kubernetesVersion', this.k8sVersion1);
      cy.wrap(req.response?.body.id).as('clusterId');
    });

    // check states
    clusterList.waitForPage();
    clusterList.list().state(this.rke1AzureClusterName).should('contain', 'Provisioning');
    clusterList.list().state(this.rke1AzureClusterName).contains('Active', { timeout: 700000 });

    // check k8s version
    clusterList.sortableTable().rowWithName(this.rke1AzureClusterName).column(3).contains('—')
      .should('not.exist', { timeout: 5000 });
    clusterList.list().version(this.rke1AzureClusterName).then(function(el) {
      const shortVersion = this.k8sVersion1.split('-');

      expect(el.text().trim()).contains(shortVersion[0]);
    });

    // check provider
    clusterList.list().provider(this.rke1AzureClusterName).should('contain', 'Azure');
    clusterList.list().provider(this.rke1AzureClusterName).should('contain', 'RKE1');

    // check machines
    clusterList.list().machines(this.rke1AzureClusterName).should('contain', 1);

    // check cluster details page > machine pools
    cy.get<string>('@clusterId').then(function(clusterId) {
      const clusterDetails = new ClusterManagerDetailRke1AzurePagePo(undefined, clusterId);

      clusterList.list().name(this.rke1AzureClusterName).click();
      clusterDetails.waitForPage(null, 'node-pools');
      clusterDetails.resourceDetail().title().should('contain', this.rke1AzureClusterName);
      clusterDetails.machinePoolsList().resourceTable().sortableTable().groupElementWithName(this.nodeName)
        .next('tr.main-row')
        .should('contain', 'Active');
    });
  });

  it('can add a node to the cluster', function() {
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();

    // cluster details page
    const clusterDetails = new ClusterManagerDetailRke1AzurePagePo(undefined, this.clusterId);

    clusterList.list().actionMenu(this.rke1AzureClusterName).getMenuItem('Edit Config').click();
    clusterDetails.waitForPage('mode=edit');
    clusterDetails.resourceDetail().title().should('contain', this.rke1AzureClusterName);

    const loadingPo = new LoadingPo('.loading-indicator');

    loadingPo.checkNotExists();
    createRKE1ClusterPage.nodePoolTable().addNodePool();
    createRKE1ClusterPage.nodePoolTable().name(1).set(this.nodeName);

    const emberBanner = new EmberBannersPo('div.banner.bg-error');

    // check error displays when node pool name is not unique
    emberBanner.bannerContent().invoke('text').then((el) => {
      expect(el.trim()).eq('Node pools must have unique name prefixes');
    });

    createRKE1ClusterPage.nodePoolTable().name(1).set(`${ this.nodeName }-2`);
    createRKE1ClusterPage.nodePoolTable().count(1).set('1');
    createRKE1ClusterPage.nodePoolTable().template(1).checkOptionSelected(this.templateName);
    createRKE1ClusterPage.nodePoolTable().controlPlane(1).set();
    createRKE1ClusterPage.nodePoolTable().worker(1).checkOptionSelected();

    // save changes
    cy.intercept('PUT', `v3/clusters/${ this.clusterId }?_replace=true`).as('saveRke1Cluster');
    createRKE1ClusterPage.saveRKE1();
    cy.wait('@saveRke1Cluster').then((req) => {
      expect(req.response?.statusCode).to.eq(200);
    });

    // check states on cluster details page > machine pools
    clusterList.list().name(this.rke1AzureClusterName).click();
    clusterDetails.waitForPage(null, 'node-pools');
    clusterDetails.resourceDetail().title().should('contain', this.rke1AzureClusterName);
    clusterDetails.machinePoolsList().resourceTable().sortableTable().groupElementWithName(`${ this.nodeName }-2`)
      .next('tr.main-row')
      .should('contain', 'Provisioning');
    clusterDetails.machinePoolsList().resourceTable().sortableTable().groupElementWithName(`${ this.nodeName }-2`)
      .next('tr.main-row', { timeout: 360000 })
      .should('contain', 'Registering');
    clusterDetails.machinePoolsList().resourceTable().sortableTable().groupElementWithName(`${ this.nodeName }-2`)
      .next('tr.main-row', { timeout: 360000 })
      .should('contain', 'Active');
  });

  it('can delete a Azure RKE1 cluster', function() {
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.list().state(this.rke1AzureClusterName).contains('Active', { timeout: 60000 });
    clusterList.list().actionMenu(this.rke1AzureClusterName).getMenuItem('Delete').click();

    clusterList.sortableTable().rowNames('.cluster-link').then((rows: any) => {
      const promptRemove = new PromptRemove();

      promptRemove.confirm(this.rke1AzureClusterName);
      promptRemove.remove();

      clusterList.waitForPage();
      clusterList.list().state(this.rke1AzureClusterName).should('contain', 'Removing');
      clusterList.sortableTable().checkRowCount(false, rows.length - 1);
      clusterList.sortableTable().rowNames('.cluster-link').should('not.contain', this.rke1AzureClusterName);
    });
  });

  after('clean up', () => {
    if (removeNodeTemplate) {
      // delete node template
      cy.deleteNodeTemplate(nodeTemplateId, 120000).then(() => {
        // delete cloud cred
        cy.deleteRancherResource('v3', 'cloudCredentials', cloudcredentialId);
      });
    }
  });
});
