import { SettingsPagePo } from '@/cypress/e2e/po/pages/global-settings/settings.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import CreateKeyPagePo from '@/cypress/e2e/po/pages/account-api-keys-create_key.po';
import AccountPagePo from '@/cypress/e2e/po/pages/account-api-keys.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import { settings } from '@/cypress/e2e/blueprints/global_settings/settings-data';
import UserMenuPo from '@/cypress/e2e/po/side-bars/user-menu.po';

// If there's more than one cluster the currentCluster used in links can be different to `local`
const settingsClusterId = '_';
const settingsPage = new SettingsPagePo(settingsClusterId);
const accountPage = new AccountPagePo();
const createKeyPage = new CreateKeyPagePo();
const clusterList = new ClusterManagerListPagePo();
const userMenu = new UserMenuPo();
const BANNER_TEXT = "Typical users will not need to change these. Proceed with caution, incorrect values can break your Explorer installation. Settings which have been customized from default settings are tagged 'Modified'.";
const settingsOriginal = {};
const resetSettings = [];

describe('Settings', { testIsolation: 'off' }, () => {
  before(() => {
    cy.login();
    HomePagePo.goTo();

    // get settings server-url response data
    cy.getRancherResource('v1', 'management.cattle.io.settings', undefined, null).then((resp: Cypress.Response<any>) => {
      const body = resp.body;

      body.data.forEach((s: any) => {
        settingsOriginal[s.id] = s;
      });
    });
  });

  it('Inactivity ::: can update the setting "auth-user-session-idle-ttl-minutes" and should show the the inactivity modal', { tags: ['@globalSettings', '@adminUser'] }, () => {
    let callCountGet = 0;
    let callCountPut = 0;

    // Prepare for the update of the UserActivity after the update of "auth-user-session-idle-ttl-minutes" setting
    // Let's increment the curr ISO date in 30 seconds so that we can test the feature in a timely manner
    // we need to give it 30 seconds so that the timer on the modal doesn't go out too quickly
    // not giving enough time to assert the contents of the modal
    // but it needs to be a "fixed" date so that when backend inactivity checks are done, dates are the same
    // and there's no backend change
    const now = new Date();

    now.setSeconds(now.getSeconds() + 30);
    const updatedIsoDateFixed = now.toISOString();

    // we intercept the GET to UserActivity that runs on every setting update
    cy.intercept('GET', `/v1/ext.cattle.io.useractivities/*`, (req) => {
      callCountGet++;

      // we need to intercept the 1st request - findAll (first check of setting)
      // we intercept the 2nd request because it's re-checking if the user is active before showing the modal
      if (callCountGet <= 2) {
        req.continue((res) => {
          res.body.status.expiresAt = updatedIsoDateFixed;
          res.send(res.body);
        });
      } else {
        req.continue();
      }
    }).as('getUpdatedUserActivity');

    // we need to intercept the first request here because of the clicking around the user is considered active
    // so we need to make sure date doesn't change so that we can show the modal
    cy.intercept('PUT', `/v1/ext.cattle.io.useractivities/*`, (req) => {
      callCountPut++;

      if (callCountPut === 1) {
        req.continue((res) => {
          res.body.status.expiresAt = updatedIsoDateFixed;
          res.send(res.body);
        });
      } else {
        req.continue();
      }
    }).as('postUpdatedUserActivity');

    // Update setting "auth-user-session-idle-ttl-minutes" for the e2e test
    const sessionIdleSetting = 'auth-user-session-idle-ttl-minutes';
    const newSettingsPage = new SettingsPagePo(settingsClusterId);

    // Update setting
    SettingsPagePo.navTo();
    newSettingsPage.editSettingsByLabel(sessionIdleSetting);

    const settingsEdit = newSettingsPage.editSettings(settingsClusterId, sessionIdleSetting);

    settingsEdit.waitForPage();
    settingsEdit.title().contains(`Setting: ${ sessionIdleSetting }`).should('be.visible');
    settingsEdit.settingsInput().set(settings[sessionIdleSetting].new);

    settingsEdit.saveAndWait(sessionIdleSetting).then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings[sessionIdleSetting].new);
      expect(response?.body).to.have.property('value', settings[sessionIdleSetting].new);
    });
    newSettingsPage.waitForPage();
    newSettingsPage.settingsValue(sessionIdleSetting).contains(settings[sessionIdleSetting].new);

    cy.wait('@getUpdatedUserActivity', { timeout: 15000 });

    // this wait is a delicate balance with the 30 seconds of the intercept
    // we need to do this so that the timer on the modal doesn't go out too quickly
    // not giving enough time to assert the contents of the modal
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(12000);

    expect(newSettingsPage.inactivityModalCard().getModal().should('exist'));

    expect(newSettingsPage.inactivityModalCard().getCardTitle().should('exist'));
    expect(newSettingsPage.inactivityModalCard().getCardBody().should('exist'));
    expect(newSettingsPage.inactivityModalCard().getCardActions().should('exist'));

    expect(newSettingsPage.inactivityModalCard().getCardTitle().should('contain', 'Session expiring'));
    expect(newSettingsPage.inactivityModalCard().getCardBody().should('contain', 'Your session is about to expire due to inactivity. Any unsaved changes will be lost'));
    expect(newSettingsPage.inactivityModalCard().getCardBody().should('contain', 'Click “Resume Session” to keep the session in this browser active'));

    // Clicking the resume button should close the modal and reset the timer
    expect(newSettingsPage.inactivityModalCard().getCardActions().contains('Resume Session').click());
    expect(newSettingsPage.inactivityModalCard().shouldNotExist());

    // at this point the intercept for the XHR of resume session kicks in
    // let's check that the user being active doesn't really trigger the modal display
    // for that let's click on something in the UI
    AccountPagePo.navTo();

    // let's wait so that we could give time for the modal to appear
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(20000);

    // assert that the modal didn't appear
    expect(newSettingsPage.inactivityModalCard().shouldNotExist());

    // Reset setting value
    SettingsPagePo.navTo();
    newSettingsPage.waitForPage();
    newSettingsPage.editSettingsByLabel(sessionIdleSetting);

    settingsEdit.waitForPage();
    settingsEdit.title().contains(`Setting: ${ sessionIdleSetting }`).should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait(sessionIdleSetting).then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settingsOriginal[sessionIdleSetting].default);
      expect(response?.body).to.have.property('value', settingsOriginal[sessionIdleSetting].default);
    });

    newSettingsPage.waitForPage();
    newSettingsPage.settingsValue(sessionIdleSetting).contains(settingsOriginal[sessionIdleSetting].default);

    resetSettings.push(sessionIdleSetting);
  });

  it('has the correct title', { tags: ['@globalSettings', '@adminUser'] }, () => {
    SettingsPagePo.navTo();

    cy.title().should('eq', 'Rancher - Global Settings - Settings');
  });

  it('has the correct banner text', { tags: ['@globalSettings', '@adminUser'] }, () => {
    SettingsPagePo.navTo();

    settingsPage.settingBanner().banner().contains(BANNER_TEXT);
  });

  it('can update engine-iso-url', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('engine-iso-url');

    const settingsEdit = settingsPage.editSettings(settingsClusterId, 'engine-iso-url');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: engine-iso-url').should('be.visible');
    settingsEdit.settingsInput().set(settings['engine-iso-url'].new);
    settingsEdit.saveAndWait('engine-iso-url').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['engine-iso-url'].new);
      expect(response?.body).to.have.property('value', settings['engine-iso-url'].new);
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('engine-iso-url').contains(settings['engine-iso-url'].new);
    // Scroll to the setting
    cy.get('.main-layout').scrollTo('bottom');
    settingsPage.modifiedLabel('engine-iso-url').should('be.visible'); // modified label should display after update

    // Reset
    SettingsPagePo.navTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('engine-iso-url');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: engine-iso-url').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('engine-iso-url').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settingsOriginal['engine-iso-url'].default);
      expect(response?.body).to.have.property('value', settingsOriginal['engine-iso-url'].default);
    });

    settingsPage.waitForPage();
    settingsPage.settingsValue('engine-iso-url').contains(settingsOriginal['engine-iso-url'].default);
    settingsPage.modifiedLabel('engine-iso-url').should('not.exist'); // modified label should not display after reset

    resetSettings.push('engine-iso-url');
  });

  it('can update password-min-length', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('password-min-length');

    const settingsEdit = settingsPage.editSettings(settingsClusterId, 'password-min-length');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: password-min-length').should('be.visible');
    settingsEdit.settingsInput().set(settings['password-min-length'].new);
    settingsEdit.saveAndWait('password-min-length');
    settingsPage.waitForPage();
    settingsPage.settingsValue('password-min-length').contains(settings['password-min-length'].new);

    // this just causes problems
    // Check new password requirement
    // const banner = new BannersPo('.text-error');

    // accountPage.waitForRequests();
    // accountPage.changePassword();
    // accountPage.currentPassword().set(Cypress.env('password'));
    // accountPage.newPassword().set('NewPassword1');
    // accountPage.confirmPassword().set('NewPassword1');

    // // Note: For some odd reason, when running this test in CI,
    // // the expected network error is not thrown
    // // so we need to stub status code and body here to force the error
    // // to prevent the user from updating the password.
    // // To be clear, this is not a bug, the issue is specific to Cypress automation
    // // cy.intercept('POST', '/v3/users?action=changepassword', {
    // //   statusCode: 422,
    // //   body:       { message: `Password must be at least ${ settings['password-min-length'].new } characters` }
    // // }).as('changePwError');
    // cy.intercept('POST', '/v3/users?action=changepassword').as('changePwError');

    // accountPage.apply();
    // cy.wait('@changePwError');
    // banner.banner().contains(`Password must be at least ${ settings['password-min-length'].new } characters`).should('be.visible');
    // Reset
    SettingsPagePo.navTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('password-min-length');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: password-min-length').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('password-min-length');

    settingsPage.waitForPage();
    settingsPage.settingsValue('password-min-length').contains(settingsOriginal['password-min-length'].default);

    resetSettings.push('password-min-length');
  });

  it('can update ingress-ip-domain', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('ingress-ip-domain');

    const settingsEdit = settingsPage.editSettings(settingsClusterId, 'ingress-ip-domain');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: ingress-ip-domain').should('be.visible');
    settingsEdit.settingsInput().set(settings['ingress-ip-domain'].new);
    settingsEdit.saveAndWait('ingress-ip-domain').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['ingress-ip-domain'].new);
      expect(response?.body).to.have.property('value', settings['ingress-ip-domain'].new);
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('ingress-ip-domain').contains(settings['ingress-ip-domain'].new);

    // Reset
    SettingsPagePo.navTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('ingress-ip-domain');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: ingress-ip-domain').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('ingress-ip-domain').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settingsOriginal['ingress-ip-domain'].default);
      expect(response?.body).to.have.property('value', settingsOriginal['ingress-ip-domain'].default);
    });

    settingsPage.waitForPage();
    settingsPage.settingsValue('ingress-ip-domain').contains(settingsOriginal['ingress-ip-domain'].default);

    resetSettings.push('ingress-ip-domain');
  });

  it('can update auth-user-info-max-age-seconds', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('auth-user-info-max-age-seconds');

    const settingsEdit = settingsPage.editSettings(settingsClusterId, 'auth-user-info-max-age-seconds');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: auth-user-info-max-age-seconds').should('be.visible');
    settingsEdit.settingsInput().set(settings['auth-user-info-max-age-seconds'].new);
    settingsEdit.saveAndWait('auth-user-info-max-age-seconds').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['auth-user-info-max-age-seconds'].new);
      expect(response?.body).to.have.property('value', settings['auth-user-info-max-age-seconds'].new);
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('auth-user-info-max-age-seconds').contains(settings['auth-user-info-max-age-seconds'].new);

    // Reset
    SettingsPagePo.navTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('auth-user-info-max-age-seconds');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: auth-user-info-max-age-seconds').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('auth-user-info-max-age-seconds').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settingsOriginal['auth-user-info-max-age-seconds'].default);
      expect(response?.body).to.have.property('value', settingsOriginal['auth-user-info-max-age-seconds'].default);
    });

    settingsPage.waitForPage();
    settingsPage.settingsValue('auth-user-info-max-age-seconds').contains(settingsOriginal['auth-user-info-max-age-seconds'].default);

    resetSettings.push('auth-user-info-max-age-seconds');
  });

  it('can update auth-user-session-ttl-minutes', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('auth-user-session-ttl-minutes');

    const settingsEdit = settingsPage.editSettings(settingsClusterId, 'auth-user-session-ttl-minutes');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: auth-user-session-ttl-minutes').should('be.visible');
    settingsEdit.settingsInput().set(settings['auth-user-session-ttl-minutes'].new);
    settingsEdit.saveAndWait('auth-user-session-ttl-minutes').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['auth-user-session-ttl-minutes'].new);
      expect(response?.body).to.have.property('value', settings['auth-user-session-ttl-minutes'].new);
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('auth-user-session-ttl-minutes').contains(settings['auth-user-session-ttl-minutes'].new);

    // Reset
    SettingsPagePo.navTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('auth-user-session-ttl-minutes');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: auth-user-session-ttl-minutes').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('auth-user-session-ttl-minutes').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settingsOriginal['auth-user-session-ttl-minutes'].default);
      expect(response?.body).to.have.property('value', settingsOriginal['auth-user-session-ttl-minutes'].default);
    });

    settingsPage.waitForPage();
    settingsPage.settingsValue('auth-user-session-ttl-minutes').contains(settingsOriginal['auth-user-session-ttl-minutes'].default);

    resetSettings.push('auth-user-session-ttl-minutes');
  });

  it('can update auth-token-max-ttl-minutes', { tags: ['@globalSettings', '@adminUser'] }, () => {
    userMenu.getMenuItem('Account & API Keys').should('be.visible'); // Flaky test. Check required menu item visible (and not hidden later on due to content of test)
    userMenu.self().click();

    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('auth-token-max-ttl-minutes');

    const settingsEdit = settingsPage.editSettings(settingsClusterId, 'auth-token-max-ttl-minutes');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: auth-token-max-ttl-minutes').should('be.visible');
    settingsEdit.settingsInput().set(settings['auth-token-max-ttl-minutes'].new);
    settingsEdit.saveAndWait('auth-token-max-ttl-minutes');
    settingsPage.waitForPage();
    settingsPage.settingsValue('auth-token-max-ttl-minutes').contains(settings['auth-token-max-ttl-minutes'].new);

    // Check api keys expiry options
    AccountPagePo.navTo();
    accountPage.create();
    createKeyPage.waitForPage();
    createKeyPage.isCurrentPage();
    createKeyPage.expiryOptions().isChecked(0);
    cy.contains('10 mins - Maximum allowed').should('be.visible');

    // Reset
    SettingsPagePo.navTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('auth-token-max-ttl-minutes');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: auth-token-max-ttl-minutes').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('auth-token-max-ttl-minutes');

    settingsPage.waitForPage();
    settingsPage.settingsValue('auth-token-max-ttl-minutes').contains(settingsOriginal['auth-token-max-ttl-minutes'].default);

    resetSettings.push('auth-token-max-ttl-minutes');
  });

  it('can update agent-tls-mode', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('agent-tls-mode');

    const settingsEdit = settingsPage.editSettings(settingsClusterId, 'agent-tls-mode');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: agent-tls-mode').should('be.visible');
    settingsEdit.selectSettingsByLabel('System Store');
    settingsEdit.saveAndWait('agent-tls-mode');
    settingsPage.waitForPage();
    settingsPage.settingsValue('agent-tls-mode').contains('System Store');

    // Reset
    SettingsPagePo.navTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('agent-tls-mode');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: agent-tls-mode').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('agent-tls-mode');

    settingsPage.waitForPage();
    settingsPage.settingsValue('agent-tls-mode').contains('Strict');

    resetSettings.push('agent-tls-mode');
  });

  it('can update kubeconfig-default-token-ttl-minutes', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('kubeconfig-default-token-ttl-minutes');

    const settingsEdit = settingsPage.editSettings(settingsClusterId, 'kubeconfig-default-token-ttl-minutes');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: kubeconfig-default-token-ttl-minutes').should('be.visible');
    settingsEdit.settingsInput().set(settings['kubeconfig-default-token-ttl-minutes'].new);
    settingsEdit.saveAndWait('kubeconfig-default-token-ttl-minutes').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['kubeconfig-default-token-ttl-minutes'].new);
      expect(response?.body).to.have.property('value', settings['kubeconfig-default-token-ttl-minutes'].new);
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('kubeconfig-default-token-ttl-minutes').contains(settings['kubeconfig-default-token-ttl-minutes'].new);

    // Reset
    SettingsPagePo.navTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('kubeconfig-default-token-ttl-minutes');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: kubeconfig-default-token-ttl-minutes').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('kubeconfig-default-token-ttl-minutes').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settingsOriginal['kubeconfig-default-token-ttl-minutes'].default);
      expect(response?.body).to.have.property('value', settingsOriginal['kubeconfig-default-token-ttl-minutes'].default);
    });

    settingsPage.waitForPage();
    settingsPage.settingsValue('kubeconfig-default-token-ttl-minutes').contains(settingsOriginal['kubeconfig-default-token-ttl-minutes'].default);

    resetSettings.push('kubeconfig-default-token-ttl-minutes');
  });

  it('can update auth-user-info-resync-cron', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('auth-user-info-resync-cron');

    const settingsEdit = settingsPage.editSettings(settingsClusterId, 'auth-user-info-resync-cron');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: auth-user-info-resync-cron').should('be.visible');
    settingsEdit.settingsInput().set(settings['auth-user-info-resync-cron'].new);
    settingsEdit.saveAndWait('auth-user-info-resync-cron').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['auth-user-info-resync-cron'].new);
      expect(response?.body).to.have.property('value', settings['auth-user-info-resync-cron'].new);
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('auth-user-info-resync-cron').contains(settings['auth-user-info-resync-cron'].new);

    // Reset
    SettingsPagePo.navTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('auth-user-info-resync-cron');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: auth-user-info-resync-cron').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('auth-user-info-resync-cron').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settingsOriginal['auth-user-info-resync-cron'].default);
      expect(response?.body).to.have.property('value', settingsOriginal['auth-user-info-resync-cron'].default);
    });

    settingsPage.waitForPage();
    settingsPage.settingsValue('auth-user-info-resync-cron').contains(settingsOriginal['auth-user-info-resync-cron'].default);

    resetSettings.push('auth-user-info-resync-cron');
  });

  it('can update kubeconfig-generate-token', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('kubeconfig-generate-token');

    const settingsEdit = settingsPage.editSettings(settingsClusterId, 'kubeconfig-generate-token');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: kubeconfig-generate-token').should('be.visible');
    settingsEdit.settingsRadioBtn().set(1);
    settingsEdit.saveAndWait('kubeconfig-generate-token');
    settingsPage.waitForPage();
    settingsPage.settingsValue('kubeconfig-generate-token').contains(settings['kubeconfig-generate-token'].new);

    // Reset
    SettingsPagePo.navTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('kubeconfig-generate-token');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: kubeconfig-generate-token').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('kubeconfig-generate-token');

    settingsPage.waitForPage();
    settingsPage.settingsValue('kubeconfig-generate-token').contains(settingsOriginal['kubeconfig-generate-token'].default);

    // Check kubeconfig file
    const downloadsFolder = Cypress.config('downloadsFolder');

    clusterList.goTo();
    clusterList.list().actionMenu('local').getMenuItem('Download KubeConfig').click();

    const downloadedFilename = path.join(downloadsFolder, 'local.yaml');

    cy.readFile(downloadedFilename).then((buffer) => {
      const obj: any = jsyaml.load(buffer);

      // checks on the downloaded YAML
      expect(obj.clusters.length).to.equal(1);
      expect(obj.clusters[0].name).to.equal('local');
      expect(obj.users[0].user.token).to.have.length.gt(0);
      expect(obj.apiVersion).to.equal('v1');
      expect(obj.kind).to.equal('Config');
    });

    resetSettings.push('kubeconfig-generate-token');
  });

  after(() => {
    // Revert all settings to their original, but don't spam the backend with settings changes
    cy.loopProcessWait({
      iterables: resetSettings,
      process:   ({ entry: s }) => {
        const resource = settingsOriginal[s];

        return cy.getRancherResource('v1', 'management.cattle.io.settings', s).then((res) => {
          resource.metadata.resourceVersion = res.body.metadata.resourceVersion;

          return cy.setRancherResource('v1', 'management.cattle.io.settings', s, resource );
        });
      },
    });
  });
});
