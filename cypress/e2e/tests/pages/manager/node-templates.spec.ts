import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import NodeTemplatesPagePo from '@/cypress/e2e/po/pages/cluster-manager/node-templates.po';
import ClusterManagerCreateRke1Amazonec2PagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke1-amazonec2.po';
import EmberPromptRemove from '@/cypress/e2e/po/components/ember/ember-prompt-remove.po';

// will only run this in jenkins pipeline where cloud credentials are stored
describe('Node Templates', { testIsolation: 'off', tags: ['@manager', '@jenkins', '@adminUser'] }, () => {
  const nodeTemplatesPage = new NodeTemplatesPagePo('_');
  const clusterList = new ClusterManagerListPagePo('local');
  const runTimestamp = +new Date();
  const templateName = `e2e-node-template-name-${ runTimestamp }`;
  let cloudCredentialId = '';

  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.viewport(1380, 720);
  });

  let removeCloudCred = false;

  it('can create a node template for Amazon EC2 and should display on RKE1 cluster creation page', () => {
    const cloudCredName = `e2e-cloud-cred-name-${ runTimestamp }`;

    cy.createAwsCloudCredentials('fleet-default', cloudCredName, 'us-west-2', Cypress.env('awsAccessKey'), Cypress.env('awsSecretKey')).then((resp: Cypress.Response<any>) => {
      cloudCredentialId = resp.body.id;
      removeCloudCred = true;
    });

    NodeTemplatesPagePo.navTo();
    nodeTemplatesPage.waitForPage();
    nodeTemplatesPage.addTemplate().click();
    nodeTemplatesPage.addNodeTemplateModal().serviceProviderOptions('Amazon EC2').should('have.class', 'active');

    nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Authenticate & configure nodes').click();
    nodeTemplatesPage.addNodeTemplateModal().accordion().content().find('.radio .acc-label')
      .eq(0)
      .click();
    nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Select a Security Group').should('exist');
    nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Select a Security Group').click();
    nodeTemplatesPage.addNodeTemplateModal().accordion().content().contains('.radio label', 'Choose one or more existing groups')
      .click();
    nodeTemplatesPage.addNodeTemplateModal().serviceProviderOptions('Amazon EC2').should('have.class', 'active');
    nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Set Instance options').click();

    nodeTemplatesPage.addNodeTemplateModal().templateName().set(templateName);
    cy.intercept('POST', '/v3/nodetemplate').as('createTemplate');

    nodeTemplatesPage.addNodeTemplateModal().create();
    cy.wait('@createTemplate');
    nodeTemplatesPage.waitForPage();
    nodeTemplatesPage.list().rowWithName(templateName).should('be.visible');

    // check RKE template displays as an option on the RKE cluster create page
    clusterList.goTo();
    clusterList.checkIsCurrentPage();
    clusterList.createCluster();

    const createClusterRKE1Page = new ClusterManagerCreateRke1Amazonec2PagePo();

    createClusterRKE1Page.waitForPage();
    createClusterRKE1Page.rkeToggle().set('RKE1');
    createClusterRKE1Page.selectCreate(0);
    createClusterRKE1Page.nodeTemplateDropdown().selectMenuItemByOption(templateName);
    createClusterRKE1Page.selectedOption().checkOptionSelected(templateName);
  });

  it('can edit a node template', () => {
    NodeTemplatesPagePo.navTo();
    nodeTemplatesPage.list().rowWithName(templateName).should('be.visible');
    nodeTemplatesPage.list().rowActionMenuOpen(templateName);
    nodeTemplatesPage.actionMenu().selectMenuItemByLabel('Edit');
    nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Authenticate & configure nodes').click();
    nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Select a Security Group').click();
    nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Set Instance options').click();
    nodeTemplatesPage.addNodeTemplateModal().templateName().set(`${ templateName }-edit`);
    cy.intercept('PUT', '/v3/nodeTemplates/**').as('editTemplate');

    nodeTemplatesPage.addNodeTemplateModal().save();
    cy.wait('@editTemplate');
    nodeTemplatesPage.waitForPage();
    nodeTemplatesPage.list().rowWithName(`${ templateName }-edit`).should('be.visible');
  });

  it('can clone a node template', () => {
    NodeTemplatesPagePo.navTo();
    nodeTemplatesPage.list().rowWithName(`${ templateName }-edit`).should('be.visible');
    nodeTemplatesPage.list().rowActionMenuOpen(`${ templateName }-edit`);
    nodeTemplatesPage.actionMenu().selectMenuItemByLabel('Clone');
    nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Authenticate & configure nodes').click();
    nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Select a Security Group').click();
    nodeTemplatesPage.addNodeTemplateModal().nextButton('Next: Set Instance options').click();
    nodeTemplatesPage.addNodeTemplateModal().templateName().set(`${ templateName }-clone`);
    cy.intercept('POST', '/v3/nodetemplate').as('cloneTemplate');

    nodeTemplatesPage.addNodeTemplateModal().save();
    cy.wait('@cloneTemplate');
    nodeTemplatesPage.waitForPage();
    nodeTemplatesPage.list().rowWithName(`${ templateName }-clone`).should('be.visible');
  });

  it('can delete a node template', () => {
    NodeTemplatesPagePo.navTo();

    // delete clone node template
    nodeTemplatesPage.list().rowWithName(`${ templateName }-clone`).should('be.visible');
    nodeTemplatesPage.list().rowActionMenuOpen(`${ templateName }-clone`);
    nodeTemplatesPage.actionMenu().selectMenuItemByLabel('Delete');
    const promptRemove = new EmberPromptRemove();

    cy.intercept('DELETE', '/v3/nodeTemplates/**').as('deleteNodeTemplate');

    promptRemove.delete();
    cy.wait('@deleteNodeTemplate');
    nodeTemplatesPage.waitForPage();

    // check list details
    cy.contains(`${ templateName }-clone`).should('not.exist');
  });

  it('can delete a node template via bulk actions', () => {
    NodeTemplatesPagePo.navTo();

    // delete original node template
    nodeTemplatesPage.list().rowWithName(`${ templateName }-edit`).click();
    nodeTemplatesPage.bulkActions('Delete').click();
    const promptRemove = new EmberPromptRemove();

    cy.intercept('DELETE', '/v3/nodeTemplates/**').as('deleteNodeTemplate');

    promptRemove.delete();
    cy.wait('@deleteNodeTemplate');
    nodeTemplatesPage.waitForPage();

    // check list details
    cy.contains(`${ templateName }-edit`).should('not.exist');
  });

  after('clean up', () => {
    if (removeCloudCred) {
      //  delete cloud cred
      cy.deleteRancherResource('v3', 'cloudCredentials', cloudCredentialId, 204);
    }
  });
});
