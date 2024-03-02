import PodSecurityPoliciesTemplatesPagePo from '@/cypress/e2e/po/pages/cluster-manager/pod-security-policy-templates.po';
import EmberModalPo from '@/cypress/e2e/po/components/ember/ember-modal.po';

describe.skip('Pod Security Policy Templates', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  // Note: this test fails due to https://github.com/rancher/dashboard/issues/10187
  // skipping these tests until issue is resolved
  const podSecurityTemplatesPage = new PodSecurityPoliciesTemplatesPagePo();

  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.viewport(1380, 720);
    cy.createE2EResourceName('podsecuritytemplate').as('podSecurityTemplateName');
  });

  it('can create a policy template', function() {
    PodSecurityPoliciesTemplatesPagePo.navTo();
    podSecurityTemplatesPage.waitForPage();
    podSecurityTemplatesPage.addPolicyTemplate().click();
    podSecurityTemplatesPage.addPodSecurityTemplateForm().templateName().set(this.podSecurityTemplateName);
    cy.intercept('POST', '/v3/podsecuritypolicytemplate').as('createPolicyTemplate');
    podSecurityTemplatesPage.addPodSecurityTemplateForm().create();
    cy.wait('@createPolicyTemplate');

    // check list details
    podSecurityTemplatesPage.list().rowWithName(this.podSecurityTemplateName).should('be.visible');
  });

  it('can edit a policy template', function() {
    PodSecurityPoliciesTemplatesPagePo.navTo();
    podSecurityTemplatesPage.list().rowActionMenuOpen(this.podSecurityTemplateName);
    podSecurityTemplatesPage.actionMenu().selectMenuItemByLabel('Edit');

    // update template by adding a description
    podSecurityTemplatesPage.addPodSecurityTemplateForm().addDescription();
    podSecurityTemplatesPage.addPodSecurityTemplateForm().templateDescription().set(`${ this.podSecurityTemplateName }-description`);
    cy.intercept('PUT', '/v3/podSecurityPolicyTemplates/**').as('updatePolicyTemplate');
    podSecurityTemplatesPage.addPodSecurityTemplateForm().save();
    cy.wait('@updatePolicyTemplate');

    podSecurityTemplatesPage.list().rowWithName(this.podSecurityTemplateName).find('a').click();

    podSecurityTemplatesPage.templateDescription(`${ this.podSecurityTemplateName }-description`).should('be.visible');
  });

  it('can delete a policy template', function() {
    PodSecurityPoliciesTemplatesPagePo.navTo();
    podSecurityTemplatesPage.list().rowActionMenuOpen(this.podSecurityTemplateName);
    podSecurityTemplatesPage.actionMenu().selectMenuItemByLabel('Delete');

    const promptRemove = new EmberModalPo();

    cy.intercept('DELETE', '/v3/podSecurityPolicyTemplates/**').as('deletePolicyTemplate');
    promptRemove.delete();
    cy.wait('@deletePolicyTemplate');
    podSecurityTemplatesPage.waitForPage();

    // check list details
    cy.contains(this.podSecurityTemplateName).should('not.exist');
  });
});
