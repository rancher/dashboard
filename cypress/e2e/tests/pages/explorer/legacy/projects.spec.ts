
import { FeatureFlagsPagePo } from '@/cypress/e2e/po/pages/global-settings/feature-flags.po';
import { ConfigMapPagePo } from '@/cypress/e2e/po/pages/explorer/config-map.po';

const featureFlagsPage = new FeatureFlagsPagePo();

let disableLegacyFlag = false;

describe('Legacy: Projects', { tags: ['@explorer', '@adminUser', '@ember'], testIsolation: 'off' }, () => {
  before(() => {
    cy.login();

    featureFlagsPage.getFeatureFlag('legacy').then((body: any) => {
      if (!body.spec.value) {
        return featureFlagsPage.setFeatureFlag('legacy', true).then(() => {
          disableLegacyFlag = true;
        });
      }
    });

    cy.getRancherResource('v1', 'management.cattle.io.projects').then((resp: Cypress.Response<any>) => {
      resp.body.data.forEach((item: any) => {
        if (item.spec.displayName === 'Default') {
          const id = item.metadata.name;

          cy.updateNamespaceFilter('local', 'none', `{"local":["project://${ id }"]}`);
        }
      });
    });
  });

  it('Ensure legacy: projects is visible and can nav to child entry', () => {
    const configMapPage = new ConfigMapPagePo('local');

    configMapPage.goTo();
    configMapPage.waitForPage();

    configMapPage.navToSideMenuGroupByLabel('Legacy');

    configMapPage.productNav().navToSideMenuGroupByLabelExistence('Project', 'exist');

    configMapPage.navToSideMenuGroupByLabel('Project');
    cy.url().should('include', '/legacy/project');

    configMapPage.navToSideMenuEntryByLabel('Config Maps');
    cy.url().should('include', '/legacy/project/config-maps');

    cy.iFrame().contains('.header h1', 'Config Maps');
  });

  after(() => {
    if (disableLegacyFlag) {
      featureFlagsPage.setFeatureFlag('legacy', false);
    }

    cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
  });
});
