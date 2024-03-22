
import { FeatureFlagsPagePo } from '@/cypress/e2e/po/pages/global-settings/feature-flags.po';
import { ConfigMapPagePo } from '@/cypress/e2e/po/pages/explorer/config-map.po';
import { NamespaceFilterPo } from '@/cypress/e2e/po/components/namespace-filter.po';

const featureFlagsPage = new FeatureFlagsPagePo();
let disableLegacyFlag = false;

describe('Legacy: Projects', { tags: ['@explorer', '@adminUser', '@standardUser'] }, () => {
  before(() => {
    cy.login();

    featureFlagsPage.getFeatureFlag('legacy').then((body: any) => {
      if (!body.spec.value) {
        return featureFlagsPage.setFeatureFlag('legacy', true).then(() => {
          disableLegacyFlag = true;
        });
      }
    });
  });

  it('Ensure legacy: projects is visible and defaults to embedded Apps page', () => {
    const configMapPage = new ConfigMapPagePo('local');

    configMapPage.goTo();

    const namespacePicker = new NamespaceFilterPo();

    namespacePicker.toggle();
    namespacePicker.clickOptionByLabel('All Namespaces');
    namespacePicker.clickOptionByLabel('Project: Default');
    namespacePicker.closeDropdown();

    configMapPage.navToSideMenuGroupByLabel('Legacy');
    configMapPage.productNav().navToSideMenuGroupByLabelExistence('Project', 'exist');
    configMapPage.navToSideMenuGroupByLabel('Project');
    configMapPage.navToSideMenuEntryByLabel('Apps');

    cy.iFrame().contains('.header h1', 'Apps');
  });

  after(() => {
    if (disableLegacyFlag) {
      featureFlagsPage.setFeatureFlag('legacy', false);
    }
  });
});
