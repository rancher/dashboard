import { ConfigMapPagePo } from '@/cypress/e2e/po/pages/explorer/config-map.po';
import ConfigMapPo from '@/cypress/e2e/po/components/storage/config-map.po';

const configMapPage = new ConfigMapPagePo('local');

describe('ConfigMap', { testIsolation: 'off', tags: ['@explorer2', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('has the correct title', () => {
    configMapPage.goTo();
    configMapPage.title().should('include', `ConfigMaps`);

    cy.title().should('eq', 'Rancher - local - ConfigMaps');
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
    ConfigMapPagePo.navTo();

    // Click on Create
    configMapPage.clickCreate();

    // Enter ConfigMap name
    // Enter ConfigMap key
    // Enter ConfigMap value
    // Enter ConfigMap description
    const configMapPo = new ConfigMapPo();

    // we need to add a variable resource name otherwise future
    // runs of the pipeline will fail because the resource already exists
    const runTimestamp = +new Date();
    const runPrefix = `e2e-test-${ runTimestamp }`;
    const configMapName = `${ runPrefix }-custom-config-map`;

    configMapPo.nameInput().set(configMapName);
    configMapPo.keyInput().set('managerApiConfiguration.properties');
    configMapPo.valueInput().set(expectedValue);
    configMapPo.descriptionInput().set('Custom Config Map Description');

    // Click on Create
    configMapPo.saveCreateForm().click();

    // Check if the ConfigMap is created successfully
    configMapPage.waitForPage();
    configMapPage.searchForConfigMap(configMapName);
    configMapPage.listElementWithName(configMapName).should('exist');

    // Navigate back to the edit page
    configMapPage.list().actionMenu(configMapName).getMenuItem('Edit Config').click();

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);

    // Assert the current value yaml dumps will append a newline at the end
    configMapPo.valueInput().value().should('eq', `${ expectedValue }\n`);
  });

  it('should show an error banner if the api call sends back an error', () => {
    // Navigate to Service Discovery => ConfigMaps
    ConfigMapPagePo.navTo();
    // Click on Create
    configMapPage.clickCreate();
    // Enter ConfigMap name
    const configMapPo = new ConfigMapPo();

    // Enter an invalid name so the api call fails
    configMapPo.nameInput().set('$^$^"£%');
    // Click on Create
    configMapPo.saveCreateForm().click();
    // Error banner should be displayed
    configMapPo.errorBanner().should('exist').and('be.visible');
  });
});
