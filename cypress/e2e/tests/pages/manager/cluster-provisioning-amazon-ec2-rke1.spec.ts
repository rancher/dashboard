import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import ClusterManagerCreateRke1Amazonec2PagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke1-amazonec2.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerDetailRke1AmazonEc2PagePo from '@/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail-rke1-amazon.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

// will only run this in jenkins pipeline where cloud credentials are stored
describe('Provision Node driver RKE1 cluster with AWS', { testIsolation: 'off', tags: ['@manager', '@adminUser', '@standardUser', '@jenkins'] }, () => {
  const clusterList = new ClusterManagerListPagePo();
  let removeNodeTemplate = false;
  let cloudcredentialId = '';
  let nodeTemplateId = '';

  before(() => {
    cy.login();
    HomePagePo.goTo();

    // clean up node templates and cloud credentials
    cy.getRancherResource('v3', 'nodetemplate', null, null).then((resp: Cypress.Response<any>) => {
      const body = resp.body;

      if (body.pagination['total'] > 0) {
        for (const i in body.data) {
          const id = body.data[i]['id'];

          cy.deleteNodeTemplate(id);
        }
      } else {
        cy.log('There are no existing node templates to delete');
      }
    });

    cy.getRancherResource('v3', 'cloudcredentials', null, null).then((resp: Cypress.Response<any>) => {
      const body = resp.body;

      if (body.pagination['total'] > 0) {
        for (const i in body.data) {
          const id = body.data[i]['id'];

          cy.deleteRancherResource('v3', 'cloudcredentials', id);
        }
      } else {
        cy.log('There are no existing cloud credentials to delete');
      }
    });
  });

  beforeEach(() => {
    cy.viewport(1440, 900);
    cy.createE2EResourceName('rke1ec2cluster').as('rke1Ec2ClusterName');
    cy.createE2EResourceName('template').as('templateName');
    cy.createE2EResourceName('node').as('nodeName');
  });

  it('can provision a Amazon EC2 rke1 cluster with Amazon cloud provider', function() {
    const createRKE1ClusterPage = new ClusterManagerCreateRke1Amazonec2PagePo();
    const addNodeTemplateForm = createRKE1ClusterPage.addNodeTemplateForm();

    // create cluster
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.createCluster();
    createRKE1ClusterPage.rkeToggle().set('RKE1');
    createRKE1ClusterPage.selectCreate(0);
    createRKE1ClusterPage.rke2PageTitle().should('include', 'Create Amazon EC2');
    createRKE1ClusterPage.waitForPage('type=amazonec2&rkeType=rke1');
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
      expect(req.response?.body).to.have.property('name', this.rke1Ec2ClusterName);
      expect(req.response?.body.rancherKubernetesEngineConfig).to.have.property('kubernetesVersion', this.k8sVersion1);
      cy.wrap(req.response?.body.id).as('clusterId');
    });

    // check states
    clusterList.waitForPage();
    clusterList.list().state(this.rke1Ec2ClusterName).should('contain', 'Provisioning');
    clusterList.list().state(this.rke1Ec2ClusterName).contains('Active', { timeout: 700000 });

    // check k8s version
    clusterList.sortableTable().rowWithName(this.rke1Ec2ClusterName).column(3).contains('—')
      .should('not.exist', { timeout: 5000 });
    clusterList.list().version(this.rke1Ec2ClusterName).then(function(el) {
      const shortVersion = this.k8sVersion1.split('-');

      expect(el.text().trim()).contains(shortVersion[0]);
    });

    // check provider
    clusterList.list().provider(this.rke1Ec2ClusterName).should('contain', 'Amazon EC2');
    clusterList.list().provider(this.rke1Ec2ClusterName).should('contain', 'RKE1');

    // check machines
    clusterList.list().machines(this.rke1Ec2ClusterName).should('contain', 1);

    // check cluster details page > machine pools
    cy.get<string>('@clusterId').then(function(clusterId) {
      const clusterDetails = new ClusterManagerDetailRke1AmazonEc2PagePo(undefined, clusterId);

      clusterList.list().name(this.rke1Ec2ClusterName).click();
      clusterDetails.waitForPage(null, 'node-pools');
      clusterDetails.resourceDetail().title().should('contain', this.rke1Ec2ClusterName);
      clusterDetails.machinePoolsList().resourceTable().sortableTable().groupElementWithName(this.nodeName)
        .next('tr.main-row')
        .should('contain', 'Active');
    });
  });

  it('can delete a Amazon EC2 RKE2 cluster', function() {
    ClusterManagerListPagePo.navTo();
    clusterList.waitForPage();
    clusterList.list().actionMenu(this.rke1Ec2ClusterName).getMenuItem('Delete').click();

    clusterList.sortableTable().rowNames('.cluster-link').then((rows: any) => {
      const promptRemove = new PromptRemove();

      promptRemove.confirm(this.rke1Ec2ClusterName);
      promptRemove.remove();

      clusterList.waitForPage();
      clusterList.list().state(this.rke1Ec2ClusterName).should('contain', 'Removing');
      clusterList.sortableTable().checkRowCount(false, rows.length - 1);
      clusterList.sortableTable().rowNames('.cluster-link').should('not.contain', this.rke1Ec2ClusterName);
    });
  });

  after('clean up', () => {
    if (removeNodeTemplate) {
      // delete node template
      cy.deleteNodeTemplate(nodeTemplateId).then(() => {
        // delete cloud cred
        cy.deleteRancherResource('v3', 'cloudCredentials', cloudcredentialId);
      });
    }
  });
});
