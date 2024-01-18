import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerCreateRke1CustomPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke1-custom.po';
import RkeTemplatesPagePo from '@/cypress/e2e/po/pages/cluster-manager/rke-templates.po';
import EmberModalPo from '@/cypress/e2e/po/components/ember/ember-modal.po';

describe('RKE Templates', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const rkeTemplatesPage = new RkeTemplatesPagePo('_');
  const clusterList = new ClusterManagerListPagePo('local');
  const promptRemove = new EmberModalPo();
  const runTimestamp = +new Date();
  const templateName = `e2e-template-name-${ runTimestamp }`;
  const revisionName = `e2e-revision-name-${ runTimestamp }`;
  const revisionName2 = `e2e-revision-name2-${ runTimestamp }`;

  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.viewport(1380, 720);
  });

  it('can create RKE template and should display on RKE1 cluster creation page', () => {
    RkeTemplatesPagePo.navTo();
    rkeTemplatesPage.waitForPage();
    rkeTemplatesPage.addTemplate().click();
    rkeTemplatesPage.form().templateDetails().set(templateName);
    rkeTemplatesPage.form().templateDetails().set(revisionName, 1);
    cy.intercept('POST', '/v3/clustertemplate').as('createTemplate');
    rkeTemplatesPage.form().create();
    cy.wait('@createTemplate');
    rkeTemplatesPage.waitForPage();
    rkeTemplatesPage.groupRow().groupRowWithName(templateName).should('be.visible');
    rkeTemplatesPage.groupRow().rowWithinGroupByName(templateName, revisionName).should('be.visible');

    // check RKE template displays as an option on the RKE custom cluster create page
    clusterList.goTo();
    clusterList.checkIsCurrentPage();
    clusterList.createCluster();

    const createClusterRKE1Page = new ClusterManagerCreateRke1CustomPagePo();

    createClusterRKE1Page.waitForPage();

    createClusterRKE1Page.rkeToggle().set('RKE1');
    createClusterRKE1Page.selectCustom(0);
    createClusterRKE1Page.clusterTemplateCheckbox().set();
    createClusterRKE1Page.rkeTemplateAndRevisionDropdown().selectMenuItemByOption(templateName);
    createClusterRKE1Page.selectedOption().checkOptionSelected(templateName);
    createClusterRKE1Page.selectedOption().checkOptionSelected(revisionName, 1);
  });

  it('can disable RKE template revision', () => {
    RkeTemplatesPagePo.navTo();
    rkeTemplatesPage.mainRow().rowActionMenuOpen(revisionName);
    cy.intercept('POST', '/v3/clusterTemplateRevisions/*').as('disableTemplateRevision');
    rkeTemplatesPage.actionMenu().selectMenuItemByLabel('Disable');
    cy.wait('@disableTemplateRevision');
    rkeTemplatesPage.mainRow().state(revisionName).contains('Active').should('not.exist');
    rkeTemplatesPage.mainRow().state(revisionName).should('contain.text', 'Disabled');
  });

  it('can enable RKE template revision', () => {
    RkeTemplatesPagePo.navTo();
    rkeTemplatesPage.mainRow().rowActionMenuOpen(revisionName);
    cy.intercept('POST', '/v3/clusterTemplateRevisions/*').as('enableTemplateRevision');
    rkeTemplatesPage.actionMenu().selectMenuItemByLabel('Enable');
    cy.wait('@enableTemplateRevision');
    rkeTemplatesPage.mainRow().state(revisionName).contains('Disabled').should('not.exist');
    rkeTemplatesPage.mainRow().state(revisionName).should('contain.text', 'Active');
  });

  it('can clone RKE template revision', () => {
    RkeTemplatesPagePo.navTo();
    rkeTemplatesPage.groupRow().groupRowWithName(templateName).should('be.visible');
    rkeTemplatesPage.mainRow().rowActionMenuOpen(revisionName);
    rkeTemplatesPage.actionMenu().selectMenuItemByLabel('Clone Revision');
    rkeTemplatesPage.form().templateDetails().set(revisionName2);
    cy.intercept('PUT', '/v3/clusterTemplates/*').as('cloneTemplateRevision');
    rkeTemplatesPage.form().save();
    cy.wait('@cloneTemplateRevision');
    rkeTemplatesPage.groupRow().rowWithinGroupByName(templateName, revisionName2);
  });

  it('can delete RKE template revision', () => {
    RkeTemplatesPagePo.navTo();
    rkeTemplatesPage.mainRow().rowActionMenuOpen(revisionName2);
    rkeTemplatesPage.actionMenu().selectMenuItemByLabel(`Delete`);
    cy.intercept('DELETE', '/v3/clusterTemplateRevisions/*').as('deleteTemplateRevision');
    promptRemove.delete();
    cy.wait('@deleteTemplateRevision').its('response.statusCode').should('eq', 204);
    rkeTemplatesPage.mainRow().rowWithName(revisionName2).should('not.exist');
  });

  it('can delete RKE template group', () => {
    RkeTemplatesPagePo.navTo();
    rkeTemplatesPage.groupRow().groupRowActionMenuOpen(templateName);
    rkeTemplatesPage.actionMenu().selectMenuItemByLabel(`Delete`);
    cy.intercept('DELETE', '/v3/clusterTemplates/*').as('deleteTemplate');
    promptRemove.delete();
    cy.wait('@deleteTemplate').its('response.statusCode').should('eq', 204);
    rkeTemplatesPage.groupRow().groupRowWithName(templateName).should('not.exist');
  });
});
