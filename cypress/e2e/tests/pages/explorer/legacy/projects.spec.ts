
import { FeatureFlagsPagePo } from '@/cypress/e2e/po/pages/global-settings/feature-flags.po';
import { ConfigMapPagePo } from '@/cypress/e2e/po/pages/explorer/config-map.po';
import { NamespaceFilterPo } from '@/cypress/e2e/po/components/namespace-filter.po';

const featureFlagsPage = new FeatureFlagsPagePo();
const namespacePicker = new NamespaceFilterPo();

let disableLegacyFlag = false;

describe('Legacy: Projects', { tags: ['@explorer', '@adminUser'], testIsolation: 'off' }, () => {
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

  it('Ensure legacy: projects is visible and can nav to child entry', () => {
    const configMapPage = new ConfigMapPagePo('local');

    configMapPage.goTo();

    namespacePicker.toggle();
    namespacePicker.clickOptionByLabel('All Namespaces');
    namespacePicker.clickOptionByLabel('Project: Default');
    namespacePicker.closeDropdown();

    configMapPage.navToSideMenuGroupByLabel('Legacy');
    configMapPage.productNav().navToSideMenuGroupByLabelExistence('Project', 'exist');
    configMapPage.navToSideMenuGroupByLabel('Project');
    configMapPage.navToSideMenuEntryByLabel('Config Maps');

    cy.iFrame().contains('.header h1', 'Config Maps');
  });

  after(() => {
    if (disableLegacyFlag) {
      featureFlagsPage.setFeatureFlag('legacy', false);
    }

    namespacePicker.toggle();
    namespacePicker.clickOptionByLabel('Only User Namespaces'); // This is the default
  });
});
