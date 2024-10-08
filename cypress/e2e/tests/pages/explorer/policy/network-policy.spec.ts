import { NetworkPolicyPagePo } from '@/cypress/e2e/po/pages/explorer/network-policy.po';
import NetworkPolicyPo from '@/cypress/e2e/po/components/policy/network-policy.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

const networkPolicyPage = new NetworkPolicyPagePo('local');
const networkPolicyName = 'custom-network-policy';
const networkPolicyDescription = 'Custom Network Policy Description';

describe('NetworkPolicies', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  it('creates a network policy and displays it in the list', () => {
    // Visit the main menu and select the 'local' cluster
    // Navigate to Policy => Network Policies
    NetworkPolicyPagePo.navTo();
    // Go to Create Page
    networkPolicyPage.clickCreate();
    const networkPolicyPo = new NetworkPolicyPo();

    // Enter name & description
    networkPolicyPo.nameInput().set(networkPolicyName);
    networkPolicyPo.descriptionInput().set(networkPolicyDescription);
    // Enable ingress checkbox
    networkPolicyPo.enableIngressCheckbox().set();
    // Add a new rule without a key to match all the namespaces
    networkPolicyPo.newNetworkPolicyRuleAddBtn().click();
    networkPolicyPo.addAllowedTrafficSourceButton().click();
    networkPolicyPo.policyRuleTargetSelect(0).toggle();
    networkPolicyPo.policyRuleTargetSelect(0).clickOptionWithLabel('Namespace Selector');

    cy.getRancherResource('v1', 'namespaces').then((resp: Cypress.Response<any>) => {
      cy.wrap(resp.body.count).as('namespaceCount');
    });

    cy.get('@namespaceCount').then((count) => {
      networkPolicyPo.matchingNamespacesMessage(0).should('contain.text', `Matches ${ count } of ${ count }`);
      // Add a second rule a key to match none of the namespaces
      networkPolicyPo.addAllowedTrafficSourceButton().click();
      networkPolicyPo.policyRuleTargetSelect(1).toggle();
      networkPolicyPo.policyRuleTargetSelect(1).clickOptionWithLabel('Namespace Selector');
      networkPolicyPo.policyRuleKeyInput(1).focus().type('something-with-no-matching-namespaces');
      networkPolicyPo.matchingNamespacesMessage(1).should('contain.text', `Matches 0 of ${ count }`);
      // Click on Create
      networkPolicyPo.saveCreateForm().click();
      // Check if the NetworkPolicy is created successfully
      networkPolicyPage.waitForPage();
      networkPolicyPage.searchForNetworkPolicy(networkPolicyName);
      networkPolicyPage.waitForPage(`q=${ networkPolicyName }`);
      networkPolicyPage.listElementWithName(networkPolicyName).should('exist').and('be.visible');
      // Navigate back to the edit page and check if the matching message is still correct
      networkPolicyPage.list().actionMenu(networkPolicyName).getMenuItem('Edit Config').click();
      networkPolicyPo.matchingNamespacesMessage(0).should('contain.text', `Matches ${ count } of ${ count }`);
      networkPolicyPo.matchingNamespacesMessage(1).should('contain.text', `Matches 0 of ${ count }`);
    });
  });

  it('can open "Edit as YAML"', () => {
    NetworkPolicyPagePo.navTo();
    networkPolicyPage.clickCreate();
    const networkPolicyPo = new NetworkPolicyPo();

    networkPolicyPo.editAsYaml().click();
    networkPolicyPo.yamlEditor().checkExists();
  });

  it('can delete a network policy', () => {
    NetworkPolicyPagePo.navTo();
    networkPolicyPage.waitForPage();
    networkPolicyPage.list().actionMenu(networkPolicyName).getMenuItem('Delete').click();
    const promptRemove = new PromptRemove();

    cy.intercept('DELETE', 'v1/networking.k8s.io.networkpolicies/**').as('deleteNetworkPolicy');
    promptRemove.remove();
    cy.wait('@deleteNetworkPolicy');
    networkPolicyPage.waitForPage();
    cy.contains(networkPolicyName).should('not.exist');
  });
});
