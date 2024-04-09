import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import NodeTemplatesPagePo from '@/cypress/e2e/po/pages/cluster-manager/node-templates.po';
import ClusterManagerCreateRke1Amazonec2PagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke1-amazonec2.po';
import EmberModalPo from '@/cypress/e2e/po/components/ember/ember-modal.po';

// will only run this in jenkins pipeline where cloud credentials are stored
describe('Node Templates', { testIsolation: 'off', tags: ['@manager', '@jenkins', '@adminUser'] }, () => {
  const nodeTemplatesPage = new NodeTemplatesPagePo();
  const clusterList = new ClusterManagerListPagePo();
  let cloudCredentialId = '';

  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.viewport(1440, 900);
    cy.createE2EResourceName('nodeTemplates').as('nodeTemplateName');
    cy.createE2EResourceName('cloudCredential').as('cloudCredentialName');
  });

  let removeCloudCred = false;

  it('can create a node template for Amazon EC2 and should display on RKE1 cluster creation page', function() {
    cy.createAwsCloudCredentials('fleet-default', this.cloudCredentialName, 'us-west-2', Cypress.env('awsAccessKey'), Cypress.env('awsSecretKey')).then((resp: Cypress.Response<any>) => {
      cloudCredentialId = resp.body.id;
      removeCloudCred = true;
    });

    NodeTemplatesPagePo.navTo();
    nodeTemplatesPage.waitForPage();
    nodeTemplatesPage.addTemplate().click();
    nodeTemplatesPage.addNodeTemplateModal().serviceProviderOptions('Amazon EC2').should('have.class', 'active');
    nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Authenticate & configure nodes').click();
    nodeTemplatesPage.addNodeTemplateModal().selectNetwork(2).set();
    nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Select a Security Group').click();
    nodeTemplatesPage.addNodeTemplateModal().selectSecurityGroups(2).set();
    nodeTemplatesPage.addNodeTemplateModal().serviceProviderOptions('Amazon EC2').should('have.class', 'active');
    nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Set Instance options').click();
    nodeTemplatesPage.addNodeTemplateModal().templateName().set(this.nodeTemplateName);
    cy.intercept('POST', '/v3/nodetemplate').as('createTemplate');

    nodeTemplatesPage.addNodeTemplateModal().create();
    cy.wait('@createTemplate');
    nodeTemplatesPage.waitForPage();
    nodeTemplatesPage.list().rowWithName(this.nodeTemplateName).should('be.visible');

    // check RKE template displays as an option on the RKE cluster create page
    clusterList.goTo();
    clusterList.checkIsCurrentPage();
    clusterList.createCluster();

    const createClusterRKE1Page = new ClusterManagerCreateRke1Amazonec2PagePo();

    createClusterRKE1Page.waitForPage();
    createClusterRKE1Page.rkeToggle().set('RKE1');
    createClusterRKE1Page.selectCreate(0);
    createClusterRKE1Page.nodeTemplateDropdown().selectMenuItemByOption(this.nodeTemplateName);
    createClusterRKE1Page.selectedOption().checkOptionSelected(this.nodeTemplateName);
  });

  it('can edit a node template', function() {
    NodeTemplatesPagePo.navTo();
    nodeTemplatesPage.waitForPage();
    nodeTemplatesPage.list().rowWithName(this.nodeTemplateName).should('be.visible');
    nodeTemplatesPage.list().rowActionMenuOpen(this.nodeTemplateName);
    nodeTemplatesPage.list().actionMenu().selectMenuItemByLabel('Edit');
    nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Authenticate & configure nodes').click();
    nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Select a Security Group').click();
    nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Set Instance options').click();
    nodeTemplatesPage.addNodeTemplateModal().templateName().set(`${ this.nodeTemplateName }-edit`);
    cy.intercept('PUT', '/v3/nodeTemplates/**').as('editTemplate');

    nodeTemplatesPage.addNodeTemplateModal().save();
    cy.wait('@editTemplate');
    nodeTemplatesPage.waitForPage();
    nodeTemplatesPage.list().rowWithName(`${ this.nodeTemplateName }-edit`).should('be.visible');
  });

  it('can clone a node template', function() {
    NodeTemplatesPagePo.navTo();
    nodeTemplatesPage.waitForPage();

    nodeTemplatesPage.list().rowWithName(`${ this.nodeTemplateName }-edit`).should('be.visible');
    nodeTemplatesPage.list().rowActionMenuOpen(`${ this.nodeTemplateName }-edit`);
    nodeTemplatesPage.list().actionMenu().selectMenuItemByLabel('Clone');
    nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Authenticate & configure nodes').click();
    nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Select a Security Group').click();
    nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Set Instance options').click();
    nodeTemplatesPage.addNodeTemplateModal().templateName().set(`${ this.nodeTemplateName }-clone`);
    cy.intercept('POST', '/v3/nodetemplate').as('cloneTemplate');

    nodeTemplatesPage.addNodeTemplateModal().save();
    cy.wait('@cloneTemplate');
    nodeTemplatesPage.waitForPage();
    nodeTemplatesPage.list().rowWithName(`${ this.nodeTemplateName }-clone`).should('be.visible');
  });

  it('can delete a node template', function() {
    NodeTemplatesPagePo.navTo();
    nodeTemplatesPage.waitForPage();

    // delete clone node template
    nodeTemplatesPage.list().rowWithName(`${ this.nodeTemplateName }-clone`).should('be.visible');
    nodeTemplatesPage.list().rowActionMenuOpen(`${ this.nodeTemplateName }-clone`);
    nodeTemplatesPage.list().actionMenu().selectMenuItemByLabel('Delete');
    const promptRemove = new EmberModalPo();

    cy.intercept('DELETE', '/v3/nodeTemplates/**').as('deleteNodeTemplate');

    promptRemove.delete();
    cy.wait('@deleteNodeTemplate');
    nodeTemplatesPage.waitForPage();

    // check list details
    cy.contains(`${ this.nodeTemplateName }-clone`).should('not.exist');
  });

  it('can delete a node template via bulk actions', function() {
    NodeTemplatesPagePo.navTo();
    nodeTemplatesPage.waitForPage();

    // delete original node template
    nodeTemplatesPage.list().rowWithName(`${ this.nodeTemplateName }-edit`).click();
    nodeTemplatesPage.list().bulkActions('Delete').click();
    const promptRemove = new EmberModalPo();

    cy.intercept('DELETE', '/v3/nodeTemplates/**').as('deleteNodeTemplate');

    promptRemove.delete();
    cy.wait('@deleteNodeTemplate');
    nodeTemplatesPage.waitForPage();

    // check list details
    cy.contains(`${ this.nodeTemplateName }-edit`).should('not.exist');
  });

  after('clean up', () => {
    if (removeCloudCred) {
      //  delete cloud cred
      cy.deleteRancherResource('v3', 'cloudCredentials', cloudCredentialId);
    }
  });
});
