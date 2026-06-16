import { NetworkPolicyCreateEditPagePo, NetworkPolicyListPagePo } from '@/cypress/e2e/po/pages/explorer/network-policy.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

const networkPolicyPage = new NetworkPolicyListPagePo('local');
const customNetworkPolicyName = 'custom-network-policy';
const networkPolicyDescription = 'Custom Network Policy Description';
const namespace = 'default';
let networkPolicyName = '';
let removeNetworkPolicy = false;
const networkPolicyToDelete = [];
const portValue = 8080;

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
    NetworkPolicyListPagePo.goTo('local');
    networkPolicyPage.waitForPage();
    // Go to Create Page
    networkPolicyPage.baseResourceList().masthead().create();

    const networkPolicyCreatePage = new NetworkPolicyCreateEditPagePo('local', namespace);

    networkPolicyCreatePage.waitForPage();

    // Enter name & description
    networkPolicyCreatePage.resourceDetail().createEditView().nameNsDescription().name()
      .set(customNetworkPolicyName);
    networkPolicyCreatePage.resourceDetail().createEditView().nameNsDescription().description()
      .set(networkPolicyDescription);
    networkPolicyCreatePage.resourceDetail().createEditView().nameNsDescription().selectNamespace(namespace);
    // Enable ingress checkbox
    networkPolicyCreatePage.enableIngressCheckbox().set();
    // Add a new rule without a key to match all the namespaces
    networkPolicyCreatePage.newNetworkPolicyRuleAddBtn().click();
    networkPolicyCreatePage.addAllowedTrafficSourceButton().click();
    networkPolicyCreatePage.policyRuleTargetSelect(0).toggle();
    networkPolicyCreatePage.policyRuleTargetSelect(0).clickOptionWithLabel('Namespace Label Selector');

    cy.getRancherResource('v1', 'namespaces').then((resp: Cypress.Response<any>) => {
      cy.wrap(resp.body.count).as('namespaceCount');
    });

    cy.get('@namespaceCount').then((count) => {
      networkPolicyCreatePage.matchingNamespacesMessage(0).shouldContainText(`Matches ${ count } of ${ count }`);
      // Add a second rule a key to match none of the namespaces
      networkPolicyCreatePage.addAllowedTrafficSourceButton().click();
      networkPolicyCreatePage.policyRuleTargetSelect(1).toggle();
      networkPolicyCreatePage.policyRuleTargetSelect(1).clickOptionWithLabel('Namespace Label Selector');
      networkPolicyCreatePage.policyRuleKeyInput(1).focus().type('something-with-no-matching-namespaces');
      networkPolicyCreatePage.policyRuleTargetSelect(1).self().scrollIntoView();
      networkPolicyCreatePage.matchingNamespacesMessage(1).shouldContainText(`Matches 0 of ${ count }`);
      // Click on Create
      networkPolicyCreatePage.resourceDetail().cruResource().saveOrCreate().click();
      // Check if the NetworkPolicy is created successfully
      networkPolicyPage.waitForPage();
      networkPolicyPage.baseResourceList().resourceTable().sortableTable().filter(customNetworkPolicyName);
      networkPolicyPage.waitForPage(`q=${ customNetworkPolicyName }`);
      networkPolicyPage.baseResourceList().resourceTable().sortableTable().rowElementWithName(customNetworkPolicyName)
        .should('exist')
        .and('be.visible');
      // Navigate back to the edit page and check if the matching message is still correct
      networkPolicyPage.list().actionMenu(customNetworkPolicyName).getMenuItem('Edit Config').click();

      const networkPolicyEditPage = new NetworkPolicyCreateEditPagePo('local', namespace, customNetworkPolicyName);

      networkPolicyEditPage.waitForPage();
      networkPolicyEditPage.matchingNamespacesMessage(0).shouldContainText(`Matches ${ count } of ${ count }`);
      networkPolicyEditPage.matchingNamespacesMessage(1).shouldContainText(`Matches 0 of ${ count }`);
    });
  });

  it('can open "Edit as YAML"', () => {
    NetworkPolicyListPagePo.navTo();
    networkPolicyPage.waitForPage();
    networkPolicyPage.baseResourceList().masthead().create();

    const networkPolicyCreatePage = new NetworkPolicyCreateEditPagePo('local', namespace);

    networkPolicyCreatePage.waitForPage();
    networkPolicyCreatePage.resourceDetail().createEditView().editAsYaml();
    networkPolicyCreatePage.resourceDetail().resourceYaml().codeMirror().checkExists();
  });

  // testing https://github.com/rancher/dashboard/issues/11856
  it('port value is sent correctly in request payload', () => {
    cy.intercept('POST', 'v1/networking.k8s.io.networkpolicies').as('createNetworkPolicy');

    NetworkPolicyListPagePo.navTo();
    networkPolicyPage.waitForPage();
    networkPolicyPage.baseResourceList().masthead().create();

    const networkPolicyCreatePage = new NetworkPolicyCreateEditPagePo('local', namespace);

    networkPolicyCreatePage.waitForPage();

    networkPolicyCreatePage.resourceDetail().createEditView().nameNsDescription().name()
      .set(networkPolicyName);
    networkPolicyCreatePage.resourceDetail().createEditView().nameNsDescription().description()
      .set(networkPolicyDescription);
    networkPolicyCreatePage.resourceDetail().createEditView().nameNsDescription().selectNamespace(namespace);
    networkPolicyCreatePage.enableIngressCheckbox().set();
    networkPolicyCreatePage.newNetworkPolicyRuleAddBtn().click();
    networkPolicyCreatePage.addAllowedPortButton().click();
    networkPolicyCreatePage.ingressRuleItemPortInput(0).type(portValue.toString());
    networkPolicyCreatePage.resourceDetail().cruResource().saveOrCreate().click();

    // check request payload
    cy.wait('@createNetworkPolicy').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(201);
      removeNetworkPolicy = true;
      networkPolicyToDelete.push(`${ namespace }/${ networkPolicyName }`);
      expect(request?.body.spec.ingress).to.deep.include({ ports: [{ port: portValue }] });
    });
    networkPolicyPage.waitForPage();
    networkPolicyPage.baseResourceList().resourceTable().sortableTable().filter(networkPolicyName);
    networkPolicyPage.waitForPage(`q=${ networkPolicyName }`);
    networkPolicyPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
    networkPolicyPage.list().resourceTable().sortableTable().checkRowCount(false, 1);
    networkPolicyPage.list().actionMenu(networkPolicyName).getMenuItem('Edit Config').click();
    const networkPolicyEditPage = new NetworkPolicyCreateEditPagePo('local', namespace, networkPolicyName);

    networkPolicyEditPage.waitForPage(`mode=edit#rule-ingress0`);
    // check elements value property
    networkPolicyEditPage.ingressRuleItemPortInput(0).should('have.value', portValue.toString());
  });

  it('can delete a network policy', () => {
    NetworkPolicyListPagePo.navTo();
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
