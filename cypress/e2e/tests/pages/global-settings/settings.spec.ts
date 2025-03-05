import { SettingsPagePo } from '@/cypress/e2e/po/pages/global-settings/settings.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';
import CreateKeyPagePo from '@/cypress/e2e/po/pages/account-api-keys-create_key.po';
import AccountPagePo from '@/cypress/e2e/po/pages/account-api-keys.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import { settings } from '@/cypress/e2e/blueprints/global_settings/settings-data';
import UserMenuPo from '@/cypress/e2e/po/side-bars/user-menu.po';

const settingsPage = new SettingsPagePo('local');
const accountPage = new AccountPagePo();
const createKeyPage = new CreateKeyPagePo();
const clusterList = new ClusterManagerListPagePo();
const userMenu = new UserMenuPo();
const BANNER_TEXT = "Typical users will not need to change these. Proceed with caution, incorrect values can break your Explorer installation. Settings which have been customized from default settings are tagged 'Modified'.";

describe('Settings', { testIsolation: 'off' }, () => {
  before(() => {
    cy.login();
    HomePagePo.goTo();
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

    const settingsEdit = settingsPage.editSettings('local', 'engine-iso-url');

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
      expect(request.body).to.have.property('value', settings['engine-iso-url'].original);
      expect(response?.body).to.have.property('value', settings['engine-iso-url'].original);
    });

    settingsPage.waitForPage();
    settingsPage.settingsValue('engine-iso-url').contains(settings['engine-iso-url'].original);
    settingsPage.modifiedLabel('engine-iso-url').should('not.exist'); // modified label should not display after reset
  });

  it('can update password-min-length', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('password-min-length');

    const settingsEdit = settingsPage.editSettings('local', 'password-min-length');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: password-min-length').should('be.visible');
    settingsEdit.settingsInput().set(settings['password-min-length'].new);
    settingsEdit.saveAndWait('password-min-length');
    settingsPage.waitForPage();
    settingsPage.settingsValue('password-min-length').contains(settings['password-min-length'].new);

    // Check new password requirement
    const banner = new BannersPo('.text-error');

    accountPage.waitForRequests();
    accountPage.changePassword();
    accountPage.currentPassword().set(Cypress.env('password'));
    accountPage.newPassword().set('NewPassword1');
    accountPage.confirmPassword().set('NewPassword1');

    // Note: For some odd reason, when running this test in CI,
    // the expected network error is not thrown
    // so we need to stub status code and body here to force the error
    // to prevent the user from updating the password.
    // To be clear, this is not a bug, the issue is specific to Cypress automation
    cy.intercept('POST', '/v3/users?action=changepassword', {
      statusCode: 422,
      body:       { message: `Password must be at least ${ settings['password-min-length'].new } characters` }
    }).as('changePwError');

    accountPage.apply();
    cy.wait('@changePwError');
    banner.banner().contains(`Password must be at least ${ settings['password-min-length'].new } characters`).should('be.visible');

    // Reset
    SettingsPagePo.navTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('password-min-length');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: password-min-length').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('password-min-length');

    settingsPage.waitForPage();
    settingsPage.settingsValue('password-min-length').contains(settings['password-min-length'].original);
  });

  it('can update ingress-ip-domain', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('ingress-ip-domain');

    const settingsEdit = settingsPage.editSettings('local', 'ingress-ip-domain');

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
      expect(request.body).to.have.property('value', settings['ingress-ip-domain'].original);
      expect(response?.body).to.have.property('value', settings['ingress-ip-domain'].original);
    });

    settingsPage.waitForPage();
    settingsPage.settingsValue('ingress-ip-domain').contains(settings['ingress-ip-domain'].original);
  });

  it('can update auth-user-info-max-age-seconds', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('auth-user-info-max-age-seconds');

    const settingsEdit = settingsPage.editSettings('local', 'auth-user-info-max-age-seconds');

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
      expect(request.body).to.have.property('value', settings['auth-user-info-max-age-seconds'].original);
      expect(response?.body).to.have.property('value', settings['auth-user-info-max-age-seconds'].original);
    });

    settingsPage.waitForPage();
    settingsPage.settingsValue('auth-user-info-max-age-seconds').contains(settings['auth-user-info-max-age-seconds'].original);
  });

  it('can update auth-user-session-ttl-minutes', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('auth-user-session-ttl-minutes');

    const settingsEdit = settingsPage.editSettings('local', 'auth-user-session-ttl-minutes');

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
      expect(request.body).to.have.property('value', settings['auth-user-session-ttl-minutes'].original);
      expect(response?.body).to.have.property('value', settings['auth-user-session-ttl-minutes'].original);
    });

    settingsPage.waitForPage();
    settingsPage.settingsValue('auth-user-session-ttl-minutes').contains(settings['auth-user-session-ttl-minutes'].original);
  });

  it('can update auth-token-max-ttl-minutes', { tags: ['@globalSettings', '@adminUser'] }, () => {
    userMenu.getMenuItem('Account & API Keys').should('be.visible'); // Flaky test. Check required menu item visible (and not hidden later on due to content of test)
    userMenu.self().click();

    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('auth-token-max-ttl-minutes');

    const settingsEdit = settingsPage.editSettings('local', 'auth-token-max-ttl-minutes');

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
    settingsPage.settingsValue('auth-token-max-ttl-minutes').contains(settings['auth-token-max-ttl-minutes'].original);
  });

  it('can update agent-tls-mode', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('agent-tls-mode');

    const settingsEdit = settingsPage.editSettings('local', 'agent-tls-mode');

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
  });

  it('can update kubeconfig-default-token-ttl-minutes', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('kubeconfig-default-token-ttl-minutes');

    const settingsEdit = settingsPage.editSettings('local', 'kubeconfig-default-token-ttl-minutes');

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
      expect(request.body).to.have.property('value', settings['kubeconfig-default-token-ttl-minutes'].original);
      expect(response?.body).to.have.property('value', settings['kubeconfig-default-token-ttl-minutes'].original);
    });

    settingsPage.waitForPage();
    settingsPage.settingsValue('kubeconfig-default-token-ttl-minutes').contains(settings['kubeconfig-default-token-ttl-minutes'].original);
  });

  it('can update auth-user-info-resync-cron', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('auth-user-info-resync-cron');

    const settingsEdit = settingsPage.editSettings('local', 'auth-user-info-resync-cron');

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
      expect(request.body).to.have.property('value', settings['auth-user-info-resync-cron'].original);
      expect(response?.body).to.have.property('value', settings['auth-user-info-resync-cron'].original);
    });

    settingsPage.waitForPage();
    settingsPage.settingsValue('auth-user-info-resync-cron').contains(settings['auth-user-info-resync-cron'].original);
  });

  it('can update kubeconfig-generate-token', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('kubeconfig-generate-token');

    const settingsEdit = settingsPage.editSettings('local', 'kubeconfig-generate-token');

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
    settingsPage.settingsValue('kubeconfig-generate-token').contains(settings['kubeconfig-generate-token'].original);

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
  });
});
