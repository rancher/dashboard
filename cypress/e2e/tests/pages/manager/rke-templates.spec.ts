import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerCreateRke1CustomPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke1-custom.po';
import RkeTemplatesPagePo from '@/cypress/e2e/po/pages/cluster-manager/rke-templates.po';
import EmberModalPo from '@/cypress/e2e/po/components/ember/ember-modal.po';

describe('RKE Templates', { testIsolation: 'off', tags: ['@manager', '@adminUser', '@ember'] }, () => {
  const rkeTemplatesPage = new RkeTemplatesPagePo();
  const clusterList = new ClusterManagerListPagePo();
  const promptRemove = new EmberModalPo();

  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.viewport(1440, 900);
    cy.createE2EResourceName('rkeTemplate').as('rkeTemplateName');
    cy.createE2EResourceName('rkeRevision').as('rkeRevisionName');
  });

  it('can create RKE template and should display on RKE1 cluster creation page', function() {
    RkeTemplatesPagePo.navTo();
    rkeTemplatesPage.waitForPage();
    rkeTemplatesPage.addTemplate().click();
    rkeTemplatesPage.form().templateDetails(3).set(this.rkeTemplateName);
    rkeTemplatesPage.form().templateDetails(2).set(this.rkeRevisionName);
    cy.intercept('POST', '/v3/clustertemplate').as('createTemplate');
    rkeTemplatesPage.form().create();
    cy.wait('@createTemplate');
    rkeTemplatesPage.waitForPage();
    rkeTemplatesPage.groupRow().groupRowWithName(this.rkeTemplateName).should('be.visible');
    rkeTemplatesPage.groupRow().rowWithinGroupByName(this.rkeTemplateName, this.rkeRevisionName).should('be.visible');

    // check RKE template displays as an option on the RKE custom cluster create page
    clusterList.goTo();
    clusterList.checkIsCurrentPage();
    clusterList.createCluster();

    const createClusterRKE1Page = new ClusterManagerCreateRke1CustomPagePo();

    createClusterRKE1Page.waitForPage();

    createClusterRKE1Page.rkeToggle().set('RKE1');
    createClusterRKE1Page.selectCustom(0);
    createClusterRKE1Page.clusterTemplateCheckbox().set();
    createClusterRKE1Page.rkeTemplateAndRevisionDropdown().selectMenuItemByOption(this.rkeTemplateName);
    createClusterRKE1Page.selectedOption().checkOptionSelected(this.rkeTemplateName);
    createClusterRKE1Page.selectedOption().checkOptionSelected(this.rkeRevisionName, 1);
  });

  it('can disable RKE template revision', function() {
    RkeTemplatesPagePo.navTo();
    rkeTemplatesPage.waitForPage();
    rkeTemplatesPage.mainRow().rowActionMenuOpen(this.rkeRevisionName);
    cy.intercept('POST', '/v3/clusterTemplateRevisions/*').as('disableTemplateRevision');
    rkeTemplatesPage.actionMenu().selectMenuItemByLabel('Disable');
    cy.wait('@disableTemplateRevision');
    rkeTemplatesPage.mainRow().state(this.rkeRevisionName).contains('Active').should('not.exist');
    rkeTemplatesPage.mainRow().state(this.rkeRevisionName).should('contain.text', 'Disabled');
  });

  it('can enable RKE template revision', function() {
    RkeTemplatesPagePo.navTo();
    rkeTemplatesPage.waitForPage();
    rkeTemplatesPage.mainRow().rowActionMenuOpen(this.rkeRevisionName);
    cy.intercept('POST', '/v3/clusterTemplateRevisions/*').as('enableTemplateRevision');
    rkeTemplatesPage.actionMenu().selectMenuItemByLabel('Enable');
    cy.wait('@enableTemplateRevision');
    rkeTemplatesPage.mainRow().state(this.rkeRevisionName).contains('Disabled').should('not.exist');
    rkeTemplatesPage.mainRow().state(this.rkeRevisionName).should('contain.text', 'Active');
  });

  it('can clone RKE template revision', function() {
    RkeTemplatesPagePo.navTo();
    rkeTemplatesPage.waitForPage();
    rkeTemplatesPage.groupRow().groupRowWithName(this.rkeTemplateName).should('be.visible');
    rkeTemplatesPage.mainRow().rowActionMenuOpen(this.rkeRevisionName);
    rkeTemplatesPage.actionMenu().selectMenuItemByLabel('Clone Revision');
    rkeTemplatesPage.form().templateDetails(2).set(`${ this.rkeRevisionName }-2`);
    cy.intercept('PUT', '/v3/clusterTemplates/*').as('cloneTemplateRevision');
    rkeTemplatesPage.form().save();
    cy.wait('@cloneTemplateRevision');
    rkeTemplatesPage.groupRow().rowWithinGroupByName(this.rkeTemplateName, `${ this.rkeRevisionName }-2`);
  });

  it('can delete RKE template revision', function() {
    RkeTemplatesPagePo.navTo();
    rkeTemplatesPage.waitForPage();
    rkeTemplatesPage.mainRow().rowActionMenuOpen(`${ this.rkeRevisionName }-2`);
    rkeTemplatesPage.actionMenu().selectMenuItemByLabel(`Delete`);
    cy.intercept('DELETE', '/v3/clusterTemplateRevisions/*').as('deleteTemplateRevision');
    promptRemove.delete();
    cy.wait('@deleteTemplateRevision').its('response.statusCode').should('eq', 204);
    rkeTemplatesPage.mainRow().rowWithName(`${ this.rkeRevisionName }-2`).should('not.exist');
  });

  it('can delete RKE template group', function() {
    RkeTemplatesPagePo.navTo();
    rkeTemplatesPage.waitForPage();
    rkeTemplatesPage.groupRow().groupRowActionMenuOpen(this.rkeTemplateName);
    rkeTemplatesPage.actionMenu().selectMenuItemByLabel(`Delete`);
    cy.intercept('DELETE', '/v3/clusterTemplates/*').as('deleteTemplate');
    promptRemove.delete();
    cy.wait('@deleteTemplate').its('response.statusCode').should('eq', 204);
    rkeTemplatesPage.groupRow().groupRowWithName(this.rkeTemplateName).should('not.exist');
  });
});
