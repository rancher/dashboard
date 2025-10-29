import { SettingsPagePo } from '@/cypress/e2e/po/pages/global-settings/settings.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ClusterManagerCreateRke2CustomPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-custom.po';
import AccountPagePo from '@/cypress/e2e/po/pages/account-api-keys.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import {
  settings, serverUrlLocalhostCases, urlWithTrailingForwardSlash, httpUrl, nonUrlCases
} from '@/cypress/e2e/blueprints/global_settings/settings-data';

// If there's more than one cluster the currentCluster used in links can be different to `local`
const settingsClusterId = '_';
const settingsPage = new SettingsPagePo(settingsClusterId);
const homePage = new HomePagePo();
const accountPage = new AccountPagePo();
const clusterList = new ClusterManagerListPagePo();
const burgerMenu = new BurgerMenuPo();
const settingsOriginal = {};
let removeServerUrl = false;
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

  it('can update but not reset server-url', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // The server-url can not be reset as there is no default -
    // so we're not updating the value of the server-url -
    // only checking that the api request is sent and that the reset button is disabled

    SettingsPagePo.navTo();
    settingsPage.settingsValue('server-url').then((el: any) => {
      const value = el.text();

      settingsPage.editSettingsByLabel('server-url');

      const settingsEdit = settingsPage.editSettings(settingsClusterId, 'server-url');

      settingsEdit.waitForUrlPathWithoutContext();
      settingsEdit.title().contains('Setting: server-url').should('be.visible');
      settingsEdit.saveAndWait('server-url').then(() => {
        removeServerUrl = true;
      });
      settingsPage.waitForUrlPathWithoutContext();
      settingsPage.settingsValue('server-url').contains(value);

      // Check Account and API Keys page
      AccountPagePo.navTo();
      accountPage.waitForUrlPathWithoutContext();
      accountPage.isCurrentPage();
      cy.contains(value).should('be.visible');

      // Check reset button disabled
      SettingsPagePo.navTo();
      settingsPage.waitForUrlPathWithoutContext();
      settingsPage.editSettingsByLabel('server-url');

      settingsEdit.waitForUrlPathWithoutContext();
      settingsEdit.title().contains('Setting: server-url').should('be.visible');
      settingsEdit.useDefaultButton().should('be.visible');
      settingsEdit.useDefaultButton().should('be.disabled');
    });
  });

  it('can validate server-url', { tags: ['@globalSettings', '@adminUser'] }, () => {
    SettingsPagePo.navTo();

    settingsPage.editSettingsByLabel('server-url');

    const settingsEdit = settingsPage.editSettings(settingsClusterId, 'server-url');

    settingsEdit.waitForUrlPathWithoutContext();
    settingsEdit.title().contains('Setting: server-url').should('be.visible');

    // Check showing localhost warning banner
    serverUrlLocalhostCases.forEach((url) => {
      settingsEdit.settingsInput().set(url);
      settingsEdit.serverUrlLocalhostWarningBanner().banner().should('exist').and('be.visible');
    });
    // Check showing error banner when the urls has trailing forward slash
    settingsEdit.settingsInput().set(urlWithTrailingForwardSlash);
    settingsEdit.errorBannerContent('Server URL should not have a trailing forward slash.').should('exist').and('be.visible');
    // Check showing error banner when the url is not HTTPS
    settingsEdit.settingsInput().set(httpUrl);
    settingsEdit.errorBannerContent('Server URL must be https.').should('exist').and('be.visible');
    // // Check showing error banner when the input value is not a url
    nonUrlCases.forEach((inputValue) => {
      settingsEdit.settingsInput().set(inputValue);
      settingsEdit.errorBannerContent('Server URL must be an URL.').should('exist').and('be.visible');
      // A non-url is also a non-https
      settingsEdit.errorBannerContent('Server URL must be https.').should('exist').and('be.visible');
    });
  });

  it('can update ui-index', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('ui-index');

    const settingsEdit = settingsPage.editSettings(settingsClusterId, 'ui-index');

    settingsEdit.waitForUrlPathWithoutContext();
    settingsEdit.title().contains('Setting: ui-index').should('be.visible');
    settingsEdit.settingsInput().set(settings['ui-index'].new);
    settingsEdit.saveAndWait('ui-index', settings['ui-index'].new).then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['ui-index'].new);
      expect(response?.body).to.have.property('value', settings['ui-index'].new);
    });
    settingsPage.waitForUrlPathWithoutContext();
    settingsPage.settingsValue('ui-index').contains(settings['ui-index'].new);

    // Reset
    SettingsPagePo.navTo();
    settingsPage.waitForUrlPathWithoutContext();
    settingsPage.editSettingsByLabel('ui-index');

    settingsEdit.waitForUrlPathWithoutContext();
    settingsEdit.title().contains('Setting: ui-index').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('ui-index', settingsOriginal['ui-index'].default).then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settingsOriginal['ui-index'].default);
      expect(response?.body).to.have.property('value', settingsOriginal['ui-index'].default);
    });

    settingsPage.waitForUrlPathWithoutContext();
    settingsPage.settingsValue('ui-index').contains(settingsOriginal['ui-index'].default);

    resetSettings.push('ui-index');
  });

  it('can update ui-dashboard-index', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('ui-dashboard-index');

    const settingsEdit = settingsPage.editSettings(settingsClusterId, 'ui-dashboard-index');

    settingsEdit.waitForUrlPathWithoutContext();
    settingsEdit.title().contains('Setting: ui-dashboard-index').should('be.visible');
    settingsEdit.settingsInput().set(settings['ui-dashboard-index'].new);
    settingsEdit.saveAndWait('ui-dashboard-index', settings['ui-dashboard-index'].new).then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['ui-dashboard-index'].new);
      expect(response?.body).to.have.property('value', settings['ui-dashboard-index'].new);
    });
    settingsPage.waitForUrlPathWithoutContext();
    settingsPage.settingsValue('ui-dashboard-index').contains(settings['ui-dashboard-index'].new);

    // Reset
    SettingsPagePo.navTo();
    settingsPage.waitForUrlPathWithoutContext();
    settingsPage.editSettingsByLabel('ui-dashboard-index');

    settingsEdit.waitForUrlPathWithoutContext();
    settingsEdit.title().contains('Setting: ui-dashboard-index').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('ui-dashboard-index', settingsOriginal['ui-dashboard-index'].default).then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settingsOriginal['ui-dashboard-index'].default);
      expect(response?.body).to.have.property('value', settingsOriginal['ui-dashboard-index'].default);
    });

    settingsPage.waitForUrlPathWithoutContext();
    settingsPage.settingsValue('ui-dashboard-index').contains(settingsOriginal['ui-dashboard-index'].default);

    resetSettings.push('ui-dashboard-index');
  });

  it('can update ui-offline-preferred', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting: Local
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('ui-offline-preferred');

    const settingsEdit = settingsPage.editSettings(settingsClusterId, 'ui-offline-preferred');

    settingsEdit.waitForUrlPathWithoutContext();
    settingsEdit.title().contains('Setting: ui-offline-preferred').should('be.visible');
    settingsEdit.selectSettingsByLabel(settings['ui-offline-preferred'].new);
    settingsEdit.saveAndWait('ui-offline-preferred', 'Local').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', 'true');
      expect(response?.body).to.have.property('value', 'true');
    });
    settingsPage.waitForUrlPathWithoutContext();
    settingsPage.settingsValue('ui-offline-preferred').contains(settings['ui-offline-preferred'].new);

    // Update settings: Remote
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('ui-offline-preferred');

    settingsEdit.waitForUrlPathWithoutContext();
    settingsEdit.title().contains('Setting: ui-offline-preferred').should('be.visible');
    settingsEdit.selectSettingsByLabel(settings['ui-offline-preferred'].new2);
    settingsEdit.saveAndWait('ui-offline-preferred', 'Remote').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', 'false');
      expect(response?.body).to.have.property('value', 'false');
    });
    settingsPage.waitForUrlPathWithoutContext();
    settingsPage.settingsValue('ui-offline-preferred').contains(settings['ui-offline-preferred'].new2);

    // Update settings: Dynamic
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('ui-offline-preferred');

    settingsEdit.waitForUrlPathWithoutContext();
    settingsEdit.title().contains('Setting: ui-offline-preferred').should('be.visible');
    settingsEdit.selectSettingsByLabel(settings['ui-offline-preferred'].new3);
    settingsEdit.saveAndWait('ui-offline-preferred', 'dynamic').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', 'dynamic');
      expect(response?.body).to.have.property('value', 'dynamic');
    });
    settingsPage.waitForUrlPathWithoutContext();
    settingsPage.settingsValue('ui-offline-preferred').contains(settings['ui-offline-preferred'].new3);

    // Reset
    SettingsPagePo.navTo();
    settingsPage.waitForUrlPathWithoutContext();
    settingsPage.editSettingsByLabel('ui-offline-preferred');

    settingsEdit.waitForUrlPathWithoutContext();
    settingsEdit.title().contains('Setting: ui-offline-preferred').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('ui-offline-preferred', settingsOriginal['ui-offline-preferred'].default).then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settingsOriginal['ui-offline-preferred'].default);
      expect(response?.body).to.have.property('value', settingsOriginal['ui-offline-preferred'].default);
    });
    settingsPage.waitForUrlPathWithoutContext();

    // This should be used above...
    let visualDefault = 'Dynamic';

    switch (settingsOriginal['ui-offline-preferred'].default) {
    case 'true':
      visualDefault = 'Local';
      break;
    case 'false':
      visualDefault = 'Remote';
      break;
    }
    settingsPage.settingsValue('ui-offline-preferred').contains(visualDefault);

    resetSettings.push('ui-offline-preferred');
  });

  it('can update ui-brand', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // We probably want a better way to distinguish between rancher and suse logos. I'm doing this as part of the vue3 migration and trying to keep things as similar as possible.
    const rancherLogoWidth = 167;
    const suseRancherLogoWidth = 200;

    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('ui-brand');

    const settingsEdit = settingsPage.editSettings(settingsClusterId, 'ui-brand');

    settingsEdit.waitForUrlPathWithoutContext();
    settingsEdit.title().contains('Setting: ui-brand').should('be.visible');
    settingsEdit.settingsInput().set(settings['ui-brand'].new);
    settingsEdit.saveAndWait('ui-brand');
    settingsPage.waitForUrlPathWithoutContext();
    settingsPage.settingsValue('ui-brand').contains(settings['ui-brand'].new);

    // Check logos in top-level navigation header for updated logo
    BurgerMenuPo.toggle();
    burgerMenu.brandLogoImage()
      .should('be.visible')
      .invoke('outerWidth').then((str) => parseInt(str))
      .should('eq', suseRancherLogoWidth);
    BurgerMenuPo.toggle();

    HomePagePo.navTo();
    burgerMenu.headerBrandLogoImage()
      .should('be.visible')
      .invoke('outerWidth').then((str) => parseInt(str))
      .should('eq', suseRancherLogoWidth);
    BurgerMenuPo.toggle();

    // Reset
    SettingsPagePo.navTo();
    settingsPage.waitForUrlPathWithoutContext();
    settingsPage.editSettingsByLabel('ui-brand');

    settingsEdit.waitForUrlPathWithoutContext();
    settingsEdit.title().contains('Setting: ui-brand').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('ui-brand');

    settingsPage.waitForUrlPathWithoutContext();
    settingsPage.settingsValue('ui-brand').should('not.contain', settings['ui-brand'].new);

    // Check logos in top-level navigation header for updated logo
    HomePagePo.navTo();
    burgerMenu.headerBrandLogoImage().should('be.visible').invoke('outerWidth').then((str) => parseInt(str))
      .should('eq', rancherLogoWidth);

    BurgerMenuPo.toggle();
    burgerMenu.brandLogoImage().should('be.visible').invoke('outerWidth').then((str) => parseInt(str))
      .should('eq', rancherLogoWidth);

    resetSettings.push('ui-brand');
  });

  it('can update hide-local-cluster', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('hide-local-cluster');

    const settingsEdit = settingsPage.editSettings(settingsClusterId, 'hide-local-cluster');

    settingsEdit.waitForUrlPathWithoutContext();
    settingsEdit.title().contains('Setting: hide-local-cluster').should('be.visible');
    settingsEdit.settingsRadioBtn().set(0);
    settingsEdit.saveAndWait('hide-local-cluster');
    settingsPage.waitForUrlPathWithoutContext();
    settingsPage.settingsValue('hide-local-cluster').contains(settings['hide-local-cluster'].new);

    // Check home page for local cluster
    HomePagePo.navTo();
    homePage.waitForUrlPathWithoutContext();
    cy.contains('local').should('not.exist');

    // Reset
    SettingsPagePo.navTo();
    settingsPage.waitForUrlPathWithoutContext();
    settingsPage.editSettingsByLabel('hide-local-cluster');

    settingsEdit.waitForUrlPathWithoutContext();
    settingsEdit.title().contains('Setting: hide-local-cluster').should('be.visible');
    settingsEdit.settingsRadioBtn().set(1);
    settingsEdit.saveAndWait('hide-local-cluster');

    settingsPage.waitForUrlPathWithoutContext();
    settingsPage.settingsValue('hide-local-cluster').contains(settingsOriginal['hide-local-cluster'].default);

    resetSettings.push('hide-local-cluster');
  });

  it('can update k3s-based-upgrader-uninstall-concurrency', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('k3s-based-upgrader-uninstall-concurrency');

    const settingsEdit = settingsPage.editSettings(settingsClusterId, 'k3s-based-upgrader-uninstall-concurrency');

    settingsEdit.waitForUrlPathWithoutContext();
    settingsEdit.title().contains('Setting: k3s-based-upgrader-uninstall-concurrency').should('be.visible');
    settingsEdit.settingsInput().set(settings['k3s-based-upgrader-uninstall-concurrency'].new);
    settingsEdit.saveAndWait('k3s-based-upgrader-uninstall-concurrency').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['k3s-based-upgrader-uninstall-concurrency'].new);
      expect(response?.body).to.have.property('value', settings['k3s-based-upgrader-uninstall-concurrency'].new);
    });
    settingsPage.waitForUrlPathWithoutContext();
    settingsPage.settingsValue('k3s-based-upgrader-uninstall-concurrency').contains(settings['k3s-based-upgrader-uninstall-concurrency'].new);

    // Reset
    SettingsPagePo.navTo();
    settingsPage.waitForUrlPathWithoutContext();
    settingsPage.editSettingsByLabel('k3s-based-upgrader-uninstall-concurrency');

    settingsEdit.waitForUrlPathWithoutContext();
    settingsEdit.title().contains('Setting: k3s-based-upgrader-uninstall-concurrency').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('k3s-based-upgrader-uninstall-concurrency').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settingsOriginal['k3s-based-upgrader-uninstall-concurrency'].default);
      expect(response?.body).to.have.property('value', settingsOriginal['k3s-based-upgrader-uninstall-concurrency'].default);
    });

    settingsPage.waitForUrlPathWithoutContext();
    settingsPage.settingsValue('k3s-based-upgrader-uninstall-concurrency').contains(settingsOriginal['k3s-based-upgrader-uninstall-concurrency'].default);

    resetSettings.push('k3s-based-upgrader-uninstall-concurrency');
  });

  it('can update system-agent-upgrader-install-concurrency', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('system-agent-upgrader-install-concurrency');

    const settingsEdit = settingsPage.editSettings(settingsClusterId, 'system-agent-upgrader-install-concurrency');

    settingsEdit.waitForUrlPathWithoutContext();
    settingsEdit.title().contains('Setting: system-agent-upgrader-install-concurrency').should('be.visible');
    settingsEdit.settingsInput().set(settings['system-agent-upgrader-install-concurrency'].new);
    settingsEdit.saveAndWait('system-agent-upgrader-install-concurrency').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['system-agent-upgrader-install-concurrency'].new);
      expect(response?.body).to.have.property('value', settings['system-agent-upgrader-install-concurrency'].new);
    });
    settingsPage.waitForUrlPathWithoutContext();
    settingsPage.settingsValue('system-agent-upgrader-install-concurrency').contains(settings['system-agent-upgrader-install-concurrency'].new);

    // Reset
    resetSettings.push('system-agent-upgrader-install-concurrency');
  });

  it('can update system-default-registry', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('system-default-registry');

    const settingsEdit = settingsPage.editSettings(settingsClusterId, 'system-default-registry');

    settingsEdit.waitForUrlPathWithoutContext();
    settingsEdit.title().contains('Setting: system-default-registry').should('be.visible');
    settingsEdit.settingsInput().set(settings['system-default-registry'].new);
    settingsEdit.saveAndWait('system-default-registry');
    settingsPage.waitForUrlPathWithoutContext();
    settingsPage.settingsValue('system-default-registry').contains(settings['system-default-registry'].new);

    // Check cluster manager > create
    const createRKE2ClusterPage = new ClusterManagerCreateRke2CustomPagePo();

    clusterList.goTo();
    clusterList.checkIsCurrentPage();
    clusterList.createCluster();

    createRKE2ClusterPage.waitForUrlPathWithoutContext();

    createRKE2ClusterPage.selectCustom(0);
    createRKE2ClusterPage.clusterConfigurationTabs().clickTabWithSelector('[data-testid="btn-rke2-calico"]');
    cy.contains(settings['system-default-registry'].new).should('exist'); // Note - this doesn't test anything. docker.io exists in the chart in all worlds, system-default-registry value does not

    const settingsPageBlank = new SettingsPagePo();
    const settingsEditBlank = settingsPageBlank.editSettings(undefined, 'system-default-registry');

    // Reset
    SettingsPagePo.navTo();
    settingsPageBlank.waitForUrlPathWithoutContext();
    settingsPageBlank.editSettingsByLabel('system-default-registry');

    settingsEditBlank.waitForUrlPathWithoutContext();
    settingsEditBlank.title().contains('Setting: system-default-registry').should('be.visible');
    settingsEditBlank.settingsInput().clear();
    settingsEditBlank.saveAndWait('system-default-registry');

    settingsPageBlank.waitForUrlPathWithoutContext();
    // settingsPageBlank.settingsValue('system-default-registry').contains(settingsOriginal['system-default-registry'].default); // .. empty value

    resetSettings.push('system-default-registry');
  });

  it('standard user has only read access to Settings page', { tags: ['@globalSettings', '@standardUser'] }, () => {
    // verify action buttons are hidden for standard user
    SettingsPagePo.navTo();
    settingsPage.actionButtonByLabel('password-min-length').should('not.exist');
  });

  after(() => {
    // get most updated version of server-url response data
    if (removeServerUrl) {
      cy.getRancherResource('v1', 'management.cattle.io.settings', 'server-url', null).then((resp: Cypress.Response<any>) => {
        const response = resp.body.metadata;

        // update original response data before sending request
        settingsOriginal['server-url'].metadata.resourceVersion = response.resourceVersion;
        cy.setRancherResource('v1', 'management.cattle.io.settings', 'server-url', settingsOriginal['server-url']);
      });
    }

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
