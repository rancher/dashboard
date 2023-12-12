import { ConfigMapPagePo } from '@/cypress/e2e/po/pages/explorer/config-map.po';
import ConfigMapPo from '@/cypress/e2e/po/components/storage/config-map.po';

describe('ConfigMap', () => {
  beforeEach(() => {
    cy.login();
  });

  it('creates a configmap and displays it in the list', () => {
    const expectedValue = `# Sample XPlanManagerAPI Configuration (if this comment is longer than 80 characters, the output should remain the same)

apiUrl=https://example.com/xplan-api-manager
contactEmailAddress=contact@example.com
termsOfServiceUrl=https://example.com/terms
documentationUrl=https://example.com/docs
wmsUrl=https://example.com/xplan-wms/services
skipSemantic=false
skipGeometric=true`;

    // Visit the main menu and select the 'local' cluster
    // Navigate to Service Discovery => ConfigMaps
    const configMapPage = new ConfigMapPagePo('local');

    configMapPage.goTo();

    // Click on Create
    configMapPage.clickCreate();

    // Enter ConfigMap name
    // Enter ConfigMap key
    // Enter ConfigMap value
    // Enter ConfigMap description
    const configMapPo = new ConfigMapPo();

    configMapPo.nameInput().set('custom-config-map');
    configMapPo.keyInput().set('managerApiConfiguration.properties');
    configMapPo.valueInput().set(expectedValue);
    configMapPo.descriptionInput().set('Custom Config Map Description');

    // Click on Create
    configMapPo.saveCreateForm().click();

    // Check if the ConfigMap is created successfully
    configMapPage.listElementWithName('custom-config-map').should('exist');

    // Navigate back to the edit page
    configMapPage.listElementWithName('custom-config-map')
      .find(`button[data-testid="sortable-table-0-action-button"]`)
      .click()
      .get(`li[data-testid="action-menu-0-item"]`)
      .click();

    // Assert the current value yaml dumps will append a newline at the end
    configMapPo.valueInput().value().should('eq', `${ expectedValue }\n`);
  });
});
