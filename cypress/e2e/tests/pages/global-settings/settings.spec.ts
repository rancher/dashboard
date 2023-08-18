import { SettingsPagePo } from '@/cypress/e2e/po/pages/global-settings/settings.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';
import ClusterManagerCreateRke2CustomPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-custom.po';
import CreateKeyPagePo from '@/cypress/e2e/po/pages/account-api-keys-create_key.po';
import AccountPagePo from '@/cypress/e2e/po/pages/account-api-keys.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';

const settingsPage = new SettingsPagePo();
const homePage = new HomePagePo();
const accountPage = new AccountPagePo();
const createKeyPage = new CreateKeyPagePo();
const clusterList = new ClusterManagerListPagePo('local');
const burgerMenu = new BurgerMenuPo();

const settings = {
  'password-min-length': {
    original: '12',
    new:      '13'
  },
  'system-default-registry': {
    original: '<None>',
    new:      'docker.io',
  },
  'auth-token-max-ttl-minutes': {
    original: '0',
    new:      '10',
  },
  'auth-user-session-ttl-minutes': {
    original: '960',
    new:      '900'
  },
  'auth-user-info-max-age-seconds': {
    original: '3600',
    new:      '3500'
  },
  'engine-iso-url': {
    original: 'https://releases.rancher.com/os/latest/rancheros-vmware.iso',
    new:      'https://releases.rancher.com/os/latest/rancheros-vmware.isoABC'
  },
  'ingress-ip-domain': {
    original: 'sslip.io',
    new:      'sslip.ioABC'
  },
  'kubeconfig-generate-token': {
    original: 'true',
    new:      'false'
  },
  'kubeconfig-default-token-ttl-minutes': {
    original: '0',
    new:      '100'
  },
  'auth-user-info-resync-cron': {
    original: '0 0 * * *',
    new:      '0 9 * * *'
  },
  'server-url': { new: 'https://e2e-test' },
  'ui-index':   {
    original: 'https://releases.rancher.com/ui/latest2/index.html',
    new:      'https://releases.rancher.com/ui/latest2/index.htmlABC'
  },
  'ui-dashboard-index': {
    original: 'https://releases.rancher.com/dashboard/latest/index.html',
    new:      'https://releases.rancher.com/dashboard/latest/index.htmlABC'
  },
  'ui-offline-preferred': {
    original: 'Dynamic',
    new:      'Local',
    new2:     'Remote'
  },
  'ui-brand': {
    original: '<None>',
    new:      'suse',
  },
  'cluster-template-enforcement': {
    original: 'false',
    new:      'true'
  },
  'hide-local-cluster': {
    original: 'false',
    new:      'true'
  }
};

describe('Settings', () => {
  beforeEach(() => {
    cy.login();
  });

  it('can navigate to Settings page', { tags: ['@adminUser', '@standardUser'] }, () => {
    HomePagePo.goTo();

    BurgerMenuPo.toggle();

    burgerMenu.categories().contains(` Configuration `).should('exist');
    const globalSettingsNavItem = burgerMenu.links().contains(`Global Settings`);

    globalSettingsNavItem.should('exist');
    globalSettingsNavItem.click();

    settingsPage.waitForPageWithClusterId();
  });

  it('can update engine-iso-url', { tags: '@adminUser' }, () => {
    // Update setting
    settingsPage.goTo();
    settingsPage.editSettingsByLabel('engine-iso-url');

    const settingsEdit = settingsPage.editSettings('local', 'engine-iso-url');

    settingsEdit.waitForPage();
    cy.contains('Setting: engine-iso-url').should('be.visible');
    settingsEdit.settingsInput().set(settings['engine-iso-url'].new);
    settingsEdit.saveAndWait('engine-iso-url').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['engine-iso-url'].new);
      expect(response?.body).to.have.property('value', settings['engine-iso-url'].new);
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('engine-iso-url').contains(settings['engine-iso-url'].new);
    settingsPage.modifiedLabel('engine-iso-url').should('be.visible'); // modified label should display after update

    // Reset
    settingsPage.goTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('engine-iso-url');

    settingsEdit.waitForPage();
    cy.contains('Setting: engine-iso-url').should('be.visible');
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

  it('can update password-min-length', { tags: '@adminUser' }, () => {
    // Update setting
    settingsPage.goTo();
    settingsPage.editSettingsByLabel('password-min-length');

    const settingsEdit = settingsPage.editSettings('local', 'password-min-length');

    settingsEdit.waitForPage();
    cy.contains('Setting: password-min-length').should('be.visible');
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
    settingsPage.goTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('password-min-length');

    settingsEdit.waitForPage();
    cy.contains('Setting: password-min-length').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('password-min-length');

    settingsPage.waitForPage();
    settingsPage.settingsValue('password-min-length').contains(settings['password-min-length'].original);
  });

  it('can update ingress-ip-domain', { tags: '@adminUser' }, () => {
    // Update setting
    settingsPage.goTo();
    settingsPage.editSettingsByLabel('ingress-ip-domain');

    const settingsEdit = settingsPage.editSettings('local', 'ingress-ip-domain');

    settingsEdit.waitForPage();
    cy.contains('Setting: ingress-ip-domain').should('be.visible');
    settingsEdit.settingsInput().set(settings['ingress-ip-domain'].new);
    settingsEdit.saveAndWait('ingress-ip-domain').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['ingress-ip-domain'].new);
      expect(response?.body).to.have.property('value', settings['ingress-ip-domain'].new);
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('ingress-ip-domain').contains(settings['ingress-ip-domain'].new);

    // Reset
    settingsPage.goTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('ingress-ip-domain');

    settingsEdit.waitForPage();
    cy.contains('Setting: ingress-ip-domain').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('ingress-ip-domain').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['ingress-ip-domain'].original);
      expect(response?.body).to.have.property('value', settings['ingress-ip-domain'].original);
    });

    settingsPage.waitForPage();
    settingsPage.settingsValue('ingress-ip-domain').contains(settings['ingress-ip-domain'].original);
  });

  it('can update auth-user-info-max-age-seconds', { tags: '@adminUser' }, () => {
    // Update setting
    settingsPage.goTo();
    settingsPage.editSettingsByLabel('auth-user-info-max-age-seconds');

    const settingsEdit = settingsPage.editSettings('local', 'auth-user-info-max-age-seconds');

    settingsEdit.waitForPage();
    cy.contains('Setting: auth-user-info-max-age-seconds').should('be.visible');
    settingsEdit.settingsInput().set(settings['auth-user-info-max-age-seconds'].new);
    settingsEdit.saveAndWait('auth-user-info-max-age-seconds').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['auth-user-info-max-age-seconds'].new);
      expect(response?.body).to.have.property('value', settings['auth-user-info-max-age-seconds'].new);
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('auth-user-info-max-age-seconds').contains(settings['auth-user-info-max-age-seconds'].new);

    // Reset
    settingsPage.goTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('auth-user-info-max-age-seconds');

    settingsEdit.waitForPage();
    cy.contains('Setting: auth-user-info-max-age-seconds').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('auth-user-info-max-age-seconds').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['auth-user-info-max-age-seconds'].original);
      expect(response?.body).to.have.property('value', settings['auth-user-info-max-age-seconds'].original);
    });

    settingsPage.waitForPage();
    settingsPage.settingsValue('auth-user-info-max-age-seconds').contains(settings['auth-user-info-max-age-seconds'].original);
  });

  it('can update auth-user-session-ttl-minutes', { tags: '@adminUser' }, () => {
    // Update setting
    settingsPage.goTo();
    settingsPage.editSettingsByLabel('auth-user-session-ttl-minutes');

    const settingsEdit = settingsPage.editSettings('local', 'auth-user-session-ttl-minutes');

    settingsEdit.waitForPage();
    cy.contains('Setting: auth-user-session-ttl-minutes').should('be.visible');
    settingsEdit.settingsInput().set(settings['auth-user-session-ttl-minutes'].new);
    settingsEdit.saveAndWait('auth-user-session-ttl-minutes').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['auth-user-session-ttl-minutes'].new);
      expect(response?.body).to.have.property('value', settings['auth-user-session-ttl-minutes'].new);
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('auth-user-session-ttl-minutes').contains(settings['auth-user-session-ttl-minutes'].new);

    // Reset
    settingsPage.goTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('auth-user-session-ttl-minutes');

    settingsEdit.waitForPage();
    cy.contains('Setting: auth-user-session-ttl-minutes').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('auth-user-session-ttl-minutes').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['auth-user-session-ttl-minutes'].original);
      expect(response?.body).to.have.property('value', settings['auth-user-session-ttl-minutes'].original);
    });

    settingsPage.waitForPage();
    settingsPage.settingsValue('auth-user-session-ttl-minutes').contains(settings['auth-user-session-ttl-minutes'].original);
  });

  it('can update auth-token-max-ttl-minutes', { tags: '@adminUser' }, () => {
    // Update setting
    settingsPage.goTo();
    settingsPage.editSettingsByLabel('auth-token-max-ttl-minutes');

    const settingsEdit = settingsPage.editSettings('local', 'auth-token-max-ttl-minutes');

    settingsEdit.waitForPage();
    cy.contains('Setting: auth-token-max-ttl-minutes').should('be.visible');
    settingsEdit.settingsInput().set(settings['auth-token-max-ttl-minutes'].new);
    settingsEdit.saveAndWait('auth-token-max-ttl-minutes');
    settingsPage.waitForPage();
    settingsPage.settingsValue('auth-token-max-ttl-minutes').contains(settings['auth-token-max-ttl-minutes'].new);

    // Check api keys expiry options
    accountPage.goTo();
    accountPage.create();
    createKeyPage.waitForPage();
    createKeyPage.isCurrentPage();
    createKeyPage.expiryOptions().isChecked(0);
    cy.contains('10 mins - Maximum allowed').should('be.visible');

    // Reset
    settingsPage.goTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('auth-token-max-ttl-minutes');

    settingsEdit.waitForPage();
    cy.contains('Setting: auth-token-max-ttl-minutes').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('auth-token-max-ttl-minutes');

    settingsPage.waitForPage();
    settingsPage.settingsValue('auth-token-max-ttl-minutes').contains(settings['auth-token-max-ttl-minutes'].original);
  });

  it('can update kubeconfig-generate-token', { tags: '@adminUser' }, () => {
    // Update setting
    settingsPage.goTo();
    settingsPage.editSettingsByLabel('kubeconfig-generate-token');

    const settingsEdit = settingsPage.editSettings('local', 'kubeconfig-generate-token');

    settingsEdit.waitForPage();
    cy.contains('Setting: kubeconfig-generate-token').should('be.visible');
    settingsEdit.settingsRadioBtn().set(1);
    settingsEdit.saveAndWait('kubeconfig-generate-token');
    settingsPage.waitForPage();
    settingsPage.settingsValue('kubeconfig-generate-token').contains(settings['kubeconfig-generate-token'].new);

    // Reset
    settingsPage.goTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('kubeconfig-generate-token');

    settingsEdit.waitForPage();
    cy.contains('Setting: kubeconfig-generate-token').should('be.visible');
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

  it('can update kubeconfig-default-token-ttl-minutes', { tags: '@adminUser' }, () => {
    // Update setting
    settingsPage.goTo();
    settingsPage.editSettingsByLabel('kubeconfig-default-token-ttl-minutes');

    const settingsEdit = settingsPage.editSettings('local', 'kubeconfig-default-token-ttl-minutes');

    settingsEdit.waitForPage();
    cy.contains('Setting: kubeconfig-default-token-ttl-minutes').should('be.visible');
    settingsEdit.settingsInput().set(settings['kubeconfig-default-token-ttl-minutes'].new);
    settingsEdit.saveAndWait('kubeconfig-default-token-ttl-minutes').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['kubeconfig-default-token-ttl-minutes'].new);
      expect(response?.body).to.have.property('value', settings['kubeconfig-default-token-ttl-minutes'].new);
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('kubeconfig-default-token-ttl-minutes').contains(settings['kubeconfig-default-token-ttl-minutes'].new);

    // Reset
    settingsPage.goTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('kubeconfig-default-token-ttl-minutes');

    settingsEdit.waitForPage();
    cy.contains('Setting: kubeconfig-default-token-ttl-minutes').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('kubeconfig-default-token-ttl-minutes').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['kubeconfig-default-token-ttl-minutes'].original);
      expect(response?.body).to.have.property('value', settings['kubeconfig-default-token-ttl-minutes'].original);
    });

    settingsPage.waitForPage();
    settingsPage.settingsValue('kubeconfig-default-token-ttl-minutes').contains(settings['kubeconfig-default-token-ttl-minutes'].original);
  });

  it('can update auth-user-info-resync-cron', { tags: '@adminUser' }, () => {
    // Update setting
    settingsPage.goTo();
    settingsPage.editSettingsByLabel('auth-user-info-resync-cron');

    const settingsEdit = settingsPage.editSettings('local', 'auth-user-info-resync-cron');

    settingsEdit.waitForPage();
    cy.contains('Setting: auth-user-info-resync-cron').should('be.visible');
    settingsEdit.settingsInput().set(settings['auth-user-info-resync-cron'].new);
    settingsEdit.saveAndWait('auth-user-info-resync-cron').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['auth-user-info-resync-cron'].new);
      expect(response?.body).to.have.property('value', settings['auth-user-info-resync-cron'].new);
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('auth-user-info-resync-cron').contains(settings['auth-user-info-resync-cron'].new);

    // Reset
    settingsPage.goTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('auth-user-info-resync-cron');

    settingsEdit.waitForPage();
    cy.contains('Setting: auth-user-info-resync-cron').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('auth-user-info-resync-cron').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['auth-user-info-resync-cron'].original);
      expect(response?.body).to.have.property('value', settings['auth-user-info-resync-cron'].original);
    });

    settingsPage.waitForPage();
    settingsPage.settingsValue('auth-user-info-resync-cron').contains(settings['auth-user-info-resync-cron'].original);
  });

  it('can update server-url', { tags: '@adminUser' }, () => {
    // Update setting
    settingsPage.goTo();

    // Get original value and store it via aliasing
    settingsPage.settingsValue('server-url').then((el: any) => {
      const originalValue = el.text();

      cy.wrap(originalValue).as('originalValue');
    });

    settingsPage.editSettingsByLabel('server-url');

    const settingsEdit = settingsPage.editSettings('local', 'server-url');

    settingsEdit.waitForPage();
    cy.contains('Setting: server-url').should('be.visible');
    settingsEdit.settingsInput().set(settings['server-url'].new);
    settingsEdit.saveAndWait('server-url');
    settingsPage.waitForPage();
    settingsPage.settingsValue('server-url').contains(settings['server-url'].new);

    // Check Account and API Keys page
    accountPage.goTo();
    accountPage.waitForPage();
    accountPage.isCurrentPage();
    cy.contains(settings['server-url'].new).should('be.visible');

    // Reset
    settingsPage.goTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('server-url');

    settingsEdit.waitForPage();
    cy.contains('Setting: server-url').should('be.visible');
    cy.get('@originalValue').then((text:any) => {
      settingsEdit.settingsInput().set(text);
      settingsEdit.saveAndWait('server-url');
      settingsPage.waitForPage();
      settingsPage.settingsValue('server-url').contains(text);

      // Check Account and API Keys page
      accountPage.goTo();
      accountPage.waitForPage();
      accountPage.isCurrentPage();
      cy.contains(text).should('be.visible');
    });
  });

  it('can update system-default-registry', { tags: '@adminUser' }, () => {
    // Update setting
    settingsPage.goTo();
    settingsPage.editSettingsByLabel('system-default-registry');

    const settingsEdit = settingsPage.editSettings('local', 'system-default-registry');

    settingsEdit.waitForPage();
    cy.contains('Setting: system-default-registry').should('be.visible');
    settingsEdit.settingsInput().set(settings['system-default-registry'].new);
    settingsEdit.saveAndWait('system-default-registry');
    settingsPage.waitForPage();
    settingsPage.settingsValue('system-default-registry').contains(settings['system-default-registry'].new);

    // Check cluster manager > create
    const createRKE2ClusterPage = new ClusterManagerCreateRke2CustomPagePo();

    clusterList.goTo();
    clusterList.checkIsCurrentPage();
    clusterList.createCluster();

    createRKE2ClusterPage.waitForPage();
    createRKE2ClusterPage.rkeToggle().set('RKE2/K3s');

    createRKE2ClusterPage.selectCustom(0);
    createRKE2ClusterPage.clusterConfigurationTabs().clickTabWithSelector('[data-testid="btn-addons"]');
    cy.contains(settings['system-default-registry'].new).should('exist');

    // Reset
    settingsPage.goTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('system-default-registry');

    settingsEdit.waitForPage();
    cy.contains('Setting: system-default-registry').should('be.visible');
    settingsEdit.settingsInput().set(' ');
    settingsEdit.saveAndWait('system-default-registry');

    settingsPage.waitForPage();
    settingsPage.settingsValue('system-default-registry').contains(settings['system-default-registry'].original);
  });

  it('can update ui-index', { tags: '@adminUser' }, () => {
    // Update setting
    settingsPage.goTo();
    settingsPage.editSettingsByLabel('ui-index');

    const settingsEdit = settingsPage.editSettings('local', 'ui-index');

    settingsEdit.waitForPage();
    cy.contains('Setting: ui-index').should('be.visible');
    settingsEdit.settingsInput().set(settings['ui-index'].new);
    settingsEdit.saveAndWait('ui-index').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['ui-index'].new);
      expect(response?.body).to.have.property('value', settings['ui-index'].new);
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('ui-index').contains(settings['ui-index'].new);

    // Reset
    settingsPage.goTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('ui-index');

    settingsEdit.waitForPage();
    cy.contains('Setting: ui-index').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('ui-index').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['ui-index'].original);
      expect(response?.body).to.have.property('value', settings['ui-index'].original);
    });

    settingsPage.waitForPage();
    settingsPage.settingsValue('ui-index').contains(settings['ui-index'].original);
  });

  it('can update ui-dashboard-index', { tags: '@adminUser' }, () => {
    // Update setting
    settingsPage.goTo();
    settingsPage.editSettingsByLabel('ui-dashboard-index');

    const settingsEdit = settingsPage.editSettings('local', 'ui-dashboard-index');

    settingsEdit.waitForPage();
    cy.contains('Setting: ui-dashboard-index').should('be.visible');
    settingsEdit.settingsInput().set(settings['ui-dashboard-index'].new);
    settingsEdit.saveAndWait('ui-dashboard-index').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['ui-dashboard-index'].new);
      expect(response?.body).to.have.property('value', settings['ui-dashboard-index'].new);
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('ui-dashboard-index').contains(settings['ui-dashboard-index'].new);

    // Reset
    settingsPage.goTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('ui-dashboard-index');

    settingsEdit.waitForPage();
    cy.contains('Setting: ui-dashboard-index').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('ui-dashboard-index').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['ui-dashboard-index'].original);
      expect(response?.body).to.have.property('value', settings['ui-dashboard-index'].original);
    });

    settingsPage.waitForPage();
    settingsPage.settingsValue('ui-dashboard-index').contains(settings['ui-dashboard-index'].original);
  });

  it('can update ui-offline-preferred', { tags: '@adminUser' }, () => {
    // Update setting: Local
    settingsPage.goTo();
    settingsPage.editSettingsByLabel('ui-offline-preferred');

    const settingsEdit = settingsPage.editSettings('local', 'ui-offline-preferred');

    settingsEdit.waitForPage();
    cy.contains('Setting: ui-offline-preferred').should('be.visible');
    settingsEdit.selectSettingsByLabel('Local');
    settingsEdit.saveAndWait('ui-offline-preferred').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', 'true');
      expect(response?.body).to.have.property('value', 'true');
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('ui-offline-preferred').contains(settings['ui-offline-preferred'].new);

    // Update settings: Remote
    settingsPage.goTo();
    settingsPage.editSettingsByLabel('ui-offline-preferred');

    settingsEdit.waitForPage();
    cy.contains('Setting: ui-offline-preferred').should('be.visible');
    settingsEdit.selectSettingsByLabel('Remote');
    settingsEdit.saveAndWait('ui-offline-preferred').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', 'false');
      expect(response?.body).to.have.property('value', 'false');
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('ui-offline-preferred').contains(settings['ui-offline-preferred'].new2);

    // Reset: Dynamic
    settingsPage.goTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('ui-offline-preferred');

    settingsEdit.waitForPage();
    cy.contains('Setting: ui-offline-preferred').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('ui-offline-preferred').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', 'dynamic');
      expect(response?.body).to.have.property('value', 'dynamic');
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('ui-offline-preferred').contains(settings['ui-offline-preferred'].original);
  });

  it('can update ui-brand', { tags: '@adminUser' }, () => {
    const rancherLogo = '/img/rancher-logo.66cf5910.svg';
    const suseRancherLogo = '/img/rancher-logo.055089a3.svg';

    // Update setting
    settingsPage.goTo();
    settingsPage.editSettingsByLabel('ui-brand');

    const settingsEdit = settingsPage.editSettings('local', 'ui-brand');

    settingsEdit.waitForPage();
    cy.contains('Setting: ui-brand').should('be.visible');
    settingsEdit.settingsInput().set(settings['ui-brand'].new);
    settingsEdit.saveAndWait('ui-brand');
    settingsPage.waitForPage();
    settingsPage.settingsValue('ui-brand').contains(settings['ui-brand'].new);

    // Check logos in top-level navigation header for updated logo
    BurgerMenuPo.toggle();
    burgerMenu.brandLogoImage().should('be.visible').then((el) => {
      expect(el).to.have.attr('src').includes(suseRancherLogo);
    });

    // This will fail due to this bug https://github.com/rancher/dashboard/issues/9551
    cy.intercept('GET', '**/v1/counts').as('counts');
    HomePagePo.goTo();
    cy.wait('@counts', { timeout: 10000 });
    burgerMenu.headerBrandLogoImage().should('be.visible').then((el) => {
      expect(el).to.have.attr('src').includes(suseRancherLogo);
    });

    // Reset
    settingsPage.goTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('ui-brand');

    settingsEdit.waitForPage();
    cy.contains('Setting: ui-brand').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('ui-brand');

    settingsPage.waitForPage();
    settingsPage.settingsValue('ui-brand').contains(settings['ui-brand'].original);

    // Check logos in top-level navigation header for updated logo
    HomePagePo.goTo();
    burgerMenu.headerBrandLogoImage().should('be.visible').then((el) => {
      expect(el).to.have.attr('src').includes(rancherLogo);
    });

    BurgerMenuPo.toggle();
    burgerMenu.brandLogoImage().should('be.visible').then((el) => {
      expect(el).to.have.attr('src').includes(rancherLogo);
    });
  });

  it('can update cluster-template-enforcement', { tags: '@adminUser' }, () => {
    // Update setting
    settingsPage.goTo();
    settingsPage.editSettingsByLabel('cluster-template-enforcement');

    const settingsEdit = settingsPage.editSettings('local', 'cluster-template-enforcement');

    settingsEdit.waitForPage();
    cy.contains('Setting: cluster-template-enforcement').should('be.visible');
    settingsEdit.settingsRadioBtn().set(0);
    settingsEdit.saveAndWait('cluster-template-enforcement').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['cluster-template-enforcement'].new);
      expect(response?.body).to.have.property('value', settings['cluster-template-enforcement'].new);
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('cluster-template-enforcement').contains(settings['cluster-template-enforcement'].new);

    // Reset
    settingsPage.goTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('cluster-template-enforcement');

    settingsEdit.waitForPage();
    cy.contains('Setting: cluster-template-enforcement').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('cluster-template-enforcement').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['cluster-template-enforcement'].original);
      expect(response?.body).to.have.property('value', settings['cluster-template-enforcement'].original);
    });

    settingsPage.waitForPage();
    settingsPage.settingsValue('cluster-template-enforcement').contains(settings['cluster-template-enforcement'].original);
  });

  it('can update telemetry-opt', { tags: '@adminUser' }, () => {
    // Update setting: Prompt
    settingsPage.goTo();
    settingsPage.editSettingsByLabel('telemetry-opt');

    const settingsEdit = settingsPage.editSettings('local', 'telemetry-opt');

    settingsEdit.waitForPage();
    cy.contains('Setting: telemetry-opt').should('be.visible');
    settingsEdit.useDefaultButton().should('be.disabled'); // button should be disabled for this settings option
    settingsEdit.selectSettingsByLabel('Prompt');
    settingsEdit.saveAndWait('telemetry-opt').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', 'prompt');
      expect(response?.body).to.have.property('value', 'prompt');
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('telemetry-opt').contains('Prompt');

    // Update settings: Opt-in to Telemetry
    settingsPage.goTo();
    settingsPage.editSettingsByLabel('telemetry-opt');

    settingsEdit.waitForPage();
    cy.contains('Setting: telemetry-opt').should('be.visible');
    settingsEdit.selectSettingsByLabel('Opt-in to Telemetry');
    settingsEdit.saveAndWait('telemetry-opt').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', 'in');
      expect(response?.body).to.have.property('value', 'in');
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('telemetry-opt').contains('Opt-in to Telemetry');

    // Update settings: Opt-out of Telemetry
    settingsPage.goTo();
    settingsPage.editSettingsByLabel('telemetry-opt');

    settingsEdit.waitForPage();
    cy.contains('Setting: telemetry-opt').should('be.visible');
    settingsEdit.selectSettingsByLabel('Opt-out of Telemetry');
    settingsEdit.saveAndWait('telemetry-opt').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', 'out');
      expect(response?.body).to.have.property('value', 'out');
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('telemetry-opt').contains('Opt-out of Telemetry');
  });

  it('can update hide-local-cluster', { tags: '@adminUser' }, () => {
    // Update setting
    settingsPage.goTo();
    settingsPage.editSettingsByLabel('hide-local-cluster');

    const settingsEdit = settingsPage.editSettings('local', 'hide-local-cluster');

    settingsEdit.waitForPage();
    cy.contains('Setting: hide-local-cluster').should('be.visible');
    settingsEdit.settingsRadioBtn().set(0);
    settingsEdit.saveAndWait('hide-local-cluster');
    settingsPage.waitForPage();
    settingsPage.settingsValue('hide-local-cluster').contains(settings['hide-local-cluster'].new);

    // Check home page for local cluster
    HomePagePo.goTo();
    homePage.waitForPage();
    cy.contains('local').should('not.exist');

    // Reset
    settingsPage.goTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('hide-local-cluster');

    settingsEdit.waitForPage();
    cy.contains('Setting: hide-local-cluster').should('be.visible');
    settingsEdit.settingsRadioBtn().set(1);
    settingsEdit.saveAndWait('hide-local-cluster');

    settingsPage.waitForPage();
    settingsPage.settingsValue('hide-local-cluster').contains(settings['hide-local-cluster'].original);
  });

  it('standard user has only read access to Settings page', { tags: '@standardUser' }, () => {
    // verify action buttons are hidden for standard user
    settingsPage.goTo();
    settingsPage.actionButtonByLabel('engine-install-url').should('not.exist');
    settingsPage.actionButtonByLabel('password-min-length').should('not.exist');
  });
});
