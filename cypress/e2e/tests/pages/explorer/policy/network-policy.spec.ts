import { NetworkPolicyPagePo } from '@/cypress/e2e/po/pages/explorer/network-policy.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

const networkPolicyPage = new NetworkPolicyPagePo('local');
const customNetworkPolicyName = 'custom-network-policy';
const networkPolicyDescription = 'Custom Network Policy Description';
const namespace = 'default';
let networkPolicyName = '';
let removeNetworkPolicy = false;
const networkPolicyToDelete = [];

describe('NetworkPolicies', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
    cy.createE2EResourceName('networkpolicy').then((name) => {
      networkPolicyName = name;
    });
  });

  it('creates a network policy and displays it in the list', () => {
    // Visit the main menu and select the 'local' cluster
    // Navigate to Policy => Network Policies
    NetworkPolicyPagePo.navTo();
    networkPolicyPage.waitForPage();
    // Go to Create Page
    networkPolicyPage.clickCreate();

    // Enter name & description
    networkPolicyPage.createEditNetworkPolicyForm().nameInput().set(customNetworkPolicyName);
    networkPolicyPage.createEditNetworkPolicyForm().descriptionInput().set(networkPolicyDescription);
    // Enable ingress checkbox
    networkPolicyPage.createEditNetworkPolicyForm().enableIngressCheckbox().set();
    // Add a new rule without a key to match all the namespaces
    networkPolicyPage.createEditNetworkPolicyForm().newNetworkPolicyRuleAddBtn().click();
    networkPolicyPage.createEditNetworkPolicyForm().addAllowedTrafficSourceButton().click();
    networkPolicyPage.createEditNetworkPolicyForm().policyRuleTargetSelect(0).toggle();
    networkPolicyPage.createEditNetworkPolicyForm().policyRuleTargetSelect(0).clickOptionWithLabel('Namespace Selector');

    cy.getRancherResource('v1', 'namespaces').then((resp: Cypress.Response<any>) => {
      cy.wrap(resp.body.count).as('namespaceCount');
    });

    cy.get('@namespaceCount').then((count) => {
      networkPolicyPage.createEditNetworkPolicyForm().matchingNamespacesMessage(0).should('contain.text', `Matches ${ count } of ${ count }`);
      // Add a second rule a key to match none of the namespaces
      networkPolicyPage.createEditNetworkPolicyForm().addAllowedTrafficSourceButton().click();
      networkPolicyPage.createEditNetworkPolicyForm().policyRuleTargetSelect(1).toggle();
      networkPolicyPage.createEditNetworkPolicyForm().policyRuleTargetSelect(1).clickOptionWithLabel('Namespace Selector');
      networkPolicyPage.createEditNetworkPolicyForm().policyRuleKeyInput(1).focus().type('something-with-no-matching-namespaces');
      networkPolicyPage.createEditNetworkPolicyForm().matchingNamespacesMessage(1).should('contain.text', `Matches 0 of ${ count }`);
      // Click on Create
      networkPolicyPage.createEditNetworkPolicyForm().saveCreateForm().click();
      // Check if the NetworkPolicy is created successfully
      networkPolicyPage.waitForPage();
      networkPolicyPage.searchForNetworkPolicy(customNetworkPolicyName);
      networkPolicyPage.waitForPage(`q=${ customNetworkPolicyName }`);
      networkPolicyPage.listElementWithName(customNetworkPolicyName).should('exist').and('be.visible');
      // Navigate back to the edit page and check if the matching message is still correct
      networkPolicyPage.list().actionMenu(customNetworkPolicyName).getMenuItem('Edit Config').click();
      networkPolicyPage.createEditNetworkPolicyForm().matchingNamespacesMessage(0).should('contain.text', `Matches ${ count } of ${ count }`);
      networkPolicyPage.createEditNetworkPolicyForm().matchingNamespacesMessage(1).should('contain.text', `Matches 0 of ${ count }`);
    });
  });

  it('can open "Edit as YAML"', () => {
    NetworkPolicyPagePo.navTo();
    networkPolicyPage.waitForPage();
    networkPolicyPage.clickCreate();

    networkPolicyPage.createEditNetworkPolicyForm().editAsYaml().click();
    networkPolicyPage.createEditNetworkPolicyForm().yamlEditor().checkExists();
  });

  // testing https://github.com/rancher/dashboard/issues/11856
  it('port value is sent correctly in request payload', () => {
    cy.intercept('POST', 'v1/networking.k8s.io.networkpolicies').as('createNetworkPolicy');

    NetworkPolicyPagePo.navTo();
    networkPolicyPage.waitForPage();
    networkPolicyPage.clickCreate();
    networkPolicyPage.createEditNetworkPolicyForm().waitForPage(null, 'ingress');

    networkPolicyPage.createEditNetworkPolicyForm().nameInput().set(networkPolicyName);
    networkPolicyPage.createEditNetworkPolicyForm().descriptionInput().set(networkPolicyDescription);
    networkPolicyPage.createEditNetworkPolicyForm().enableIngressCheckbox().set();
    networkPolicyPage.createEditNetworkPolicyForm().newNetworkPolicyRuleAddBtn().click();
    networkPolicyPage.createEditNetworkPolicyForm().addAllowedPortButton().click();
    networkPolicyPage.createEditNetworkPolicyForm().ingressRuleItem(0).find('.col:nth-of-type(1) input').type('8080');
    networkPolicyPage.createEditNetworkPolicyForm().saveCreateForm().click();

    // check request payload
    cy.wait('@createNetworkPolicy').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(201);
      removeNetworkPolicy = true;
      networkPolicyToDelete.push(`${ namespace }/${ networkPolicyName }`);
      expect(request?.body.spec.ingress).to.deep.include({ ports: [{ port: 8080 }] });
    });
    networkPolicyPage.waitForPage();
    networkPolicyPage.searchForNetworkPolicy(networkPolicyName);
    networkPolicyPage.waitForPage(`q=${ networkPolicyName }`);
    networkPolicyPage.list().actionMenu(networkPolicyName).getMenuItem('Edit Config').click();
    networkPolicyPage.createEditNetworkPolicyForm(namespace, networkPolicyName).waitForPage(`mode=edit#rule-ingress0`);
    // check elements value property
    networkPolicyPage.createEditNetworkPolicyForm().ingressRuleItem(0).find('.col:nth-of-type(1) input').should('have.value', '8080');
  });

  it('can delete a network policy', () => {
    NetworkPolicyPagePo.navTo();
    networkPolicyPage.waitForPage();
    networkPolicyPage.list().actionMenu(customNetworkPolicyName).getMenuItem('Delete').click();
    const promptRemove = new PromptRemove();

    cy.intercept('DELETE', 'v1/networking.k8s.io.networkpolicies/**').as('deleteNetworkPolicy');
    promptRemove.remove();
    cy.wait('@deleteNetworkPolicy');
    networkPolicyPage.waitForPage();
    cy.contains(customNetworkPolicyName).should('not.exist');
  });

  after(() => {
    if (removeNetworkPolicy) {
      // delete gitrepo
      networkPolicyToDelete.forEach((r) => cy.deleteRancherResource('v1', 'networking.k8s.io.networkpolicies', r, false));
    }
  });
});
