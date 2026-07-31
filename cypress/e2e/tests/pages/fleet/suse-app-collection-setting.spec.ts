import { FleetApplicationCreatePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.application.po';

const SETTING_TYPE = 'management.cattle.io.settings';
const SETTING_ID = 'ui-suse-app-collection';

/**
 * Create or update the `ui-suse-app-collection` setting with the given value.
 * The setting may not exist yet (it's optional), so create it when missing.
 */
const upsertAppCollectionSetting = (value: string) => {
  cy.getRancherResource('v1', SETTING_TYPE, SETTING_ID, null).then((resp: Cypress.Response<any>) => {
    if (resp.status === 200) {
      const body = resp.body;

      body.value = value;
      cy.setRancherResource('v1', SETTING_TYPE, SETTING_ID, body);
    } else {
      cy.createRancherResource('v1', SETTING_TYPE, {
        type:     'management.cattle.io.setting',
        metadata: { name: SETTING_ID },
        value,
        default:  '',
      });
    }
  });
};

describe('Fleet - SUSE Application Collection wizard setting', { testIsolation: 'off', tags: ['@fleet', '@adminUser'] }, () => {
  const createPage = new FleetApplicationCreatePo();

  let settingExisted = false;
  let originalSetting: any = null;

  before(() => {
    cy.login();

    // Capture the original setting (if any) so it can be restored afterwards
    cy.getRancherResource('v1', SETTING_TYPE, SETTING_ID, null).then((resp: Cypress.Response<any>) => {
      if (resp.status === 200) {
        settingExisted = true;
        originalSetting = resp.body;
      }
    });
  });

  after(() => {
    if (settingExisted && originalSetting) {
      // Restore the original value, refreshing the resourceVersion first to avoid a conflict
      cy.getRancherResource('v1', SETTING_TYPE, SETTING_ID, null).then((resp: Cypress.Response<any>) => {
        if (resp.status === 200) {
          originalSetting.metadata.resourceVersion = resp.body.metadata.resourceVersion;
          cy.setRancherResource('v1', SETTING_TYPE, SETTING_ID, originalSetting);
        }
      });
    } else {
      // The setting was created by this spec - remove it
      cy.deleteRancherResource('v1', SETTING_TYPE, SETTING_ID, false);
    }
  });

  it('hides the SUSE Application Collection subtype when the setting is disabled', () => {
    upsertAppCollectionSetting('false');

    createPage.goTo();
    createPage.waitForPage();

    createPage.suseAppCollectionSubtype().should('not.exist');
  });

  it('shows the SUSE Application Collection subtype when the setting is enabled (Rancher Prime only)', () => {
    upsertAppCollectionSetting('true');

    cy.getRancherVersion().then((version: any) => {
      const isPrime = version.RancherPrime === 'true';

      createPage.goTo();
      createPage.waitForPage();

      if (isPrime) {
        // On Prime the subtype should be shown once the setting is enabled
        createPage.suseAppCollectionSubtype().should('be.visible');
      } else {
        // The SUSE Application Collection integration is Prime-only, so it stays hidden regardless
        createPage.suseAppCollectionSubtype().should('not.exist');
      }
    });
  });
});
