import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ClusterManagerCreateRke1Amazonec2PagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke1-amazonec2.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerDetailRke1AmazonEc2PagePo from '@/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail-rke1-amazon.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import LoadingPo from '@/cypress/e2e/po/components/loading.po';
import EmberBannersPo from '@/cypress/e2e/po/components/ember/ember-banners.po';
import { LONG_TIMEOUT_OPT, MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

/******
 *  Running this test will delete node templates and cloud credentials resources from the target cluster
 ******/

// will only run this in jenkins pipeline where cloud credentials are stored
describe('Deploy RKE1 cluster using node driver on Amazon EC2', { testIsolation: 'off', tags: ['@manager', '@adminUser', '@standardUser', '@jenkins'] }, () => {
  const clusterList = new ClusterManagerListPagePo();
  const createRKE1ClusterPage = new ClusterManagerCreateRke1Amazonec2PagePo();
  const loadingPo = new LoadingPo('.loading-indicator');

  let removeNodeTemplate = false;
  let cloudcredentialId = '';
  let nodeTemplateId = '';
  let clusterId = '';
  const k8sVersions = [];

  const homePage = new HomePagePo();
  const homeClusterList = homePage.list();

  before(() => {
    cy.login();
    HomePagePo.goTo();

    // clean up amazon node templates and cloud credentials
    cy.getRancherResource('v3', 'nodetemplate', null, null).then((resp: Cypress.Response<any>) => {
      const body = resp.body;

      if (body.pagination['total'] > 0) {
        body.data.forEach((item: any) => {
          if (item.driver === 'amazonec2') {
            const id = item['id'];

            cy.deleteNodeTemplate(id);
          } else {
            cy.log('There are no existing amazonec2 node templates to delete');
          }
        });
      }
    });

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
    cy.viewport(1440, 900);
    cy.createE2EResourceName('rke1ec2cluster').as('rke1Ec2ClusterName');
    cy.createE2EResourceName('rke1ec2clusterdesc').as('rke1Ec2ClusterDescription');
    cy.createE2EResourceName('template').as('templateName');
    cy.createE2EResourceName('node').as('nodeName');
  });

  it('can create an RKE1 cluster using Amazon cloud provider', function() {
    const addNodeTemplateForm = createRKE1ClusterPage.addNodeTemplateForm();

    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createRKE1ClusterPage.rkeToggle().set('RKE1');
    createRKE1ClusterPage.selectCreate(0);
    createRKE1ClusterPage.waitForPage('type=amazonec2&rkeType=rke1');
    loadingPo.checkNotExists();
    createRKE1ClusterPage.rke1PageTitle().should('contain', 'Add Cluster - Amazon EC2');
    createRKE1ClusterPage.addNodeTemplate();

    // create amazon ec2 cloud credential and node template
    addNodeTemplateForm.accessKey().set(Cypress.env('awsAccessKey'));
    addNodeTemplateForm.secretKey().set(Cypress.env('awsSecretKey'), true);
    addNodeTemplateForm.defaultRegion().selectMenuItemByOption('us-west-1');
    addNodeTemplateForm.defaultRegion().checkOptionSelected('us-west-1');
    cy.intercept('POST', '/v3/cloudcredential').as('createCloudCred');
    addNodeTemplateForm.create();
    cy.wait('@createCloudCred').then((req) => {
      expect(req.response?.statusCode).to.equal(201);
      cloudcredentialId = req.response?.body.id;
    });

    addNodeTemplateForm.selectNetwork(2).set();
    addNodeTemplateForm.nextButton('Next: Select a Security Group').click();
    addNodeTemplateForm.nextButton('Next: Set Instance options').click();
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
    createRKE1ClusterPage.waitForPage('type=amazonec2&rkeType=rke1');
    createRKE1ClusterPage.rke1PageTitle().should('contain', 'Add Cluster - Amazon EC2');
    createRKE1ClusterPage.clusterName().set(this.rke1Ec2ClusterName);
    createRKE1ClusterPage.addDescriptionButtonClick();
    createRKE1ClusterPage.clusterDescription().set(this.rke1Ec2ClusterDescription);
    createRKE1ClusterPage.nodePoolTable().name(1).set(this.nodeName);
    createRKE1ClusterPage.nodePoolTable().count(1).set('1');
    createRKE1ClusterPage.nodePoolTable().template(1).checkOptionSelected(this.templateName);
    createRKE1ClusterPage.nodePoolTable().etcd(1).set();
    createRKE1ClusterPage.nodePoolTable().controlPlane(1).set();
    createRKE1ClusterPage.nodePoolTable().worker(1).checkOptionSelected();

    // Get kubernetes version options and store them in variables
    createRKE1ClusterPage.kubernetesOptions().kubernetesVersion().getOptions().each((el) => {
      k8sVersions.push(el.text().trim());
    })
      .then(() => {
        createRKE1ClusterPage.kubernetesOptions().kubernetesVersion().selectMenuItemByOption(k8sVersions[0]);
      });

    cy.intercept('POST', 'v3/cluster?_replace=true').as('createRke1Cluster');
    createRKE1ClusterPage.createRKE1();
    cy.wait('@createRke1Cluster').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body).to.have.property('type', 'cluster');
      expect(response?.body).to.have.property('name', this.rke1Ec2ClusterName);
      expect(response?.body.rancherKubernetesEngineConfig).to.have.property('kubernetesVersion', k8sVersions[0]);
      clusterId = response?.body.id;
    });
    clusterList.waitForPage();
    clusterList.list().state(this.rke1Ec2ClusterName).should('contain.text', 'Provisioning');
  });

  it('can see details of cluster in cluster list', function() {
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();

    // check Architecture
    // testing https://github.com/rancher/dashboard/issues/10831
    clusterList.list().version(this.rke1Ec2ClusterName).should('contain.text', '—').and('not.contain.text', 'Unknown');

    // check states
    clusterList.list().state(this.rke1Ec2ClusterName).contains('Waiting', { timeout: 700000 });
    clusterList.list().state(this.rke1Ec2ClusterName).contains('Active', { timeout: 700000 });

    // check k8s version
    clusterList.sortableTable().rowWithName(this.rke1Ec2ClusterName).column(3).contains('—', { timeout: 15000 })
      .should('not.exist');
    clusterList.list().version(this.rke1Ec2ClusterName).then((el) => {
      const shortVersion = k8sVersions[0].split('-');

      expect(el.text().trim()).contains(shortVersion[0]);
    });

    // check provider
    clusterList.list().provider(this.rke1Ec2ClusterName).should('contain.text', 'Amazon EC2');
    clusterList.list().providerSubType(this.rke1Ec2ClusterName).should('contain.text', 'RKE1');

    // check machines
    clusterList.list().machines(this.rke1Ec2ClusterName).should('contain.text', '1');

    // check cluster details page > machine pools
    const clusterDetails = new ClusterManagerDetailRke1AmazonEc2PagePo(undefined, clusterId);

    clusterList.list().name(this.rke1Ec2ClusterName).click();
    clusterDetails.waitForPage(null, 'node-pools');
    clusterDetails.resourceDetail().title().should('contain', this.rke1Ec2ClusterName);
    clusterDetails.machinePoolsList().resourceTable().sortableTable().groupElementWithName(this.nodeName)
      .next('tr.main-row')
      .should('contain.text', 'Active');

    // https://github.com/rancher/dashboard/issues/10441 - covering RKE1/ember world descriptions
    HomePagePo.navTo();
    const desc = homeClusterList.resourceTable().sortableTable().rowWithName(this.rke1Ec2ClusterName).column(1)
      .get('.cluster-description');

    desc.contains(this.rke1Ec2ClusterDescription);
  });

  it('can add a node to the cluster', function() {
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();

    // cluster details page
    const clusterDetails = new ClusterManagerDetailRke1AmazonEc2PagePo(undefined, clusterId);

    clusterList.list().actionMenu(this.rke1Ec2ClusterName).getMenuItem('Edit Config').click();
    clusterDetails.waitForPage('mode=edit');
    clusterDetails.resourceDetail().title().should('contain', this.rke1Ec2ClusterName);

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
    cy.intercept('POST', `/v3/nodepool`).as('updateCluster');
    createRKE1ClusterPage.saveRKE1();
    cy.wait('@updateCluster').its('response.statusCode').should('eq', 201);
    clusterList.waitForPage();

    // check states on cluster details page > machine pools
    clusterList.list().name(this.rke1Ec2ClusterName).click();
    clusterDetails.waitForPage(null, 'node-pools');
    clusterDetails.resourceDetail().title().should('contain', this.rke1Ec2ClusterName);
    clusterDetails.machinePoolsList().resourceTable().sortableTable().groupElementWithName(`${ this.nodeName }-2`)
      .next('tr.main-row')
      .should('contain.text', 'Provisioning');
    clusterDetails.machinePoolsList().resourceTable().sortableTable().groupElementWithName(`${ this.nodeName }-2`)
      .next('tr.main-row', { timeout: 360000 })
      .should('contain.text', 'Registering');
    clusterDetails.machinePoolsList().resourceTable().sortableTable().groupElementWithName(`${ this.nodeName }-2`)
      .next('tr.main-row', { timeout: 360000 })
      .should('contain.text', 'Active');
  });

  it('can delete an Amazon EC2 RKE1 cluster', function() {
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.list().actionMenu(this.rke1Ec2ClusterName).getMenuItem('Delete').click();

    clusterList.sortableTable().rowNames('.cluster-link').then((rows: any) => {
      const promptRemove = new PromptRemove();

      promptRemove.confirm(this.rke1Ec2ClusterName);
      promptRemove.remove();

      clusterList.waitForPage();
      clusterList.list().state(this.rke1Ec2ClusterName).contains('Removing', LONG_TIMEOUT_OPT);
      clusterList.sortableTable().checkRowCount(false, rows.length - 1, MEDIUM_TIMEOUT_OPT);
      clusterList.sortableTable().rowNames('.cluster-link').should('not.contain', this.rke1Ec2ClusterName);
    });
  });

  after('clean up', () => {
    // delete cluster: needed here in case the delete test fails
    cy.deleteRancherResource('v1', 'provisioning.cattle.io.clusters', `fleet-default/${ clusterId }`, false);
    if (removeNodeTemplate) {
      // delete node template
      cy.deleteNodeTemplate(nodeTemplateId).then(() => {
        // delete cloud cred
        cy.deleteRancherResource('v3', 'cloudCredentials', cloudcredentialId);
      });
    }
  });
});
