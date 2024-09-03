import { NetworkPolicyPagePo } from '@/cypress/e2e/po/pages/explorer/network-policy.po';
import NetworkPolicyPo from '@/cypress/e2e/po/components/policy/network-policy.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

const networkPolicyPage = new NetworkPolicyPagePo('local');
const networkPolicyName = 'custom-network-policy';
const networkPolicyDescription = 'Custom Network Policy Description';
let namespacesCount;

describe('NetworkPolicies', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.intercept('GET', '/v1/namespaces?exclude=metadata.managedFields').as('getNamespaces');
    cy.login();

    cy.wait('@getNamespaces', { requestTimeout: 4000 }).then((req) => {
      namespacesCount = req.response.body.data.length;
    });
  });

  afterEach(() => {
    // Deleting the created network policy
    networkPolicyPage.goTo();
    networkPolicyPage.waitForPage();
    networkPolicyPage.list().actionMenu(networkPolicyName).getMenuItem('Delete').click();
    const promptRemove = new PromptRemove();

    cy.intercept('DELETE', 'v1/networking.k8s.io.networkpolicies/**').as('deleteNetworkPolicy');
    promptRemove.remove();
    cy.wait('@deleteNetworkPolicy');
    networkPolicyPage.waitForPage();
    cy.contains(networkPolicyName).should('not.exist');
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
    networkPolicyPo.matchingNamespacesMessage(0).contains(`Matches ${ namespacesCount } of ${ namespacesCount }`);
    // Add a second rule a key to match none of the namespaces
    networkPolicyPo.addAllowedTrafficSourceButton().click();
    networkPolicyPo.policyRuleTargetSelect(1).toggle();
    networkPolicyPo.policyRuleTargetSelect(1).clickOptionWithLabel('Namespace Selector');
    networkPolicyPo.policyRuleKeyInput(1).focus().type('something-with-no-matching-namespaces');
    networkPolicyPo.matchingNamespacesMessage(1).contains(`Matches 0 of ${ namespacesCount }`);
    // Click on Create
    networkPolicyPo.saveCreateForm().click();
    // Check if the NetworkPolicy is created successfully
    networkPolicyPage.waitForPage();
    networkPolicyPage.searchForNetworkPolicy(networkPolicyName);
    networkPolicyPage.listElementWithName(networkPolicyName).should('exist').and('be.visible');
    // Navigate back to the edit page and check if the matching message is still correct
    networkPolicyPage.list().actionMenu(networkPolicyName).getMenuItem('Edit Config').click();
    networkPolicyPo.matchingNamespacesMessage(0).contains(`Matches ${ namespacesCount } of ${ namespacesCount }`);
    networkPolicyPo.matchingNamespacesMessage(1).contains(`Matches 0 of ${ namespacesCount }`);
  });
  it('can open "Edit as YAML"', function() {
    NetworkPolicyPagePo.navTo();
    networkPolicyPage.clickCreate();
    const networkPolicyPo = new NetworkPolicyPo();
    networkPolicyPo.editAsYaml().click();
    networkPolicyPo.yamlEditor().checkExists();
});
});
