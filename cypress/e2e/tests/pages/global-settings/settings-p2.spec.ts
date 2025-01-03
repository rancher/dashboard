import { SettingsPagePo } from '@/cypress/e2e/po/pages/global-settings/settings.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ClusterManagerCreateRke2CustomPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-custom.po';
import AccountPagePo from '@/cypress/e2e/po/pages/account-api-keys.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import {
  settings, serverUrlLocalhostCases, urlWithTrailingForwardSlash, httpUrl, nonUrlCases
} from '@/cypress/e2e/blueprints/global_settings/settings-data';

const settingsPage = new SettingsPagePo('local');
const homePage = new HomePagePo();
const accountPage = new AccountPagePo();
const clusterList = new ClusterManagerListPagePo();
const burgerMenu = new BurgerMenuPo();
const settingsOrginal = [];
const removeServerUrl = false;

describe('Settings', { testIsolation: 'off' }, () => {
  before(() => {
    cy.login();
    HomePagePo.goTo();

    // get settings server-url response data
    cy.getRancherResource('v1', 'management.cattle.io.settings', 'server-url', null).then((resp: Cypress.Response<any>) => {
      const body = resp.body;

      settingsOrginal.push(body);
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

      const settingsEdit = settingsPage.editSettings('local', 'server-url');

      settingsEdit.waitForPage();
      settingsEdit.title().contains('Setting: server-url').should('be.visible');
      settingsEdit.saveAndWait('server-url').then(() => {
        removeServerUrl = true;
      });
      settingsPage.waitForPage();
      settingsPage.settingsValue('server-url').contains(value);

      // Check Account and API Keys page
      AccountPagePo.navTo();
      accountPage.waitForPage();
      accountPage.isCurrentPage();
      cy.contains(value).should('be.visible');

      // Check reset button disabled
      SettingsPagePo.navTo();
      settingsPage.waitForPage();
      settingsPage.editSettingsByLabel('server-url');

      settingsEdit.waitForPage();
      settingsEdit.title().contains('Setting: server-url').should('be.visible');
      settingsEdit.useDefaultButton().should('be.visible');
      settingsEdit.useDefaultButton().should('be.disabled');
    });
  });

  it('can validate server-url', { tags: ['@globalSettings', '@adminUser'] }, () => {
    SettingsPagePo.navTo();

    settingsPage.editSettingsByLabel('server-url');

    const settingsEdit = settingsPage.editSettings('local', 'server-url');

    settingsEdit.waitForPage();
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
    settingsPage.settingsValue('ui-index').invoke('text').then((originalValue:any) => {
      settingsPage.editSettingsByLabel('ui-index');

      const settingsEdit = settingsPage.editSettings('local', 'ui-index');

      settingsEdit.waitForPage();
      settingsEdit.title().contains('Setting: ui-index').should('be.visible');
      settingsEdit.settingsInput().set(settings['ui-index'].new);
      settingsEdit.saveAndWait('ui-index', settings['ui-index'].new).then(({ request, response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(request.body).to.have.property('value', settings['ui-index'].new);
        expect(response?.body).to.have.property('value', settings['ui-index'].new);
      });
      settingsPage.waitForPage();
      settingsPage.settingsValue('ui-index').contains(settings['ui-index'].new);

      // Reset
      SettingsPagePo.navTo();
      settingsPage.waitForPage();
      settingsPage.editSettingsByLabel('ui-index');

      settingsEdit.waitForPage();
      settingsEdit.title().contains('Setting: ui-index').should('be.visible');
      settingsEdit.useDefaultButton().click();
      settingsEdit.saveAndWait('ui-index', originalValue).then(({ request, response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(request.body).to.have.property('value', originalValue);
        expect(response?.body).to.have.property('value', originalValue);
      });

      settingsPage.waitForPage();
      settingsPage.settingsValue('ui-index').contains(originalValue);
    });
  });

  it('can update ui-dashboard-index', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.settingsValue('ui-dashboard-index').invoke('text').then((originalValue:any) => {
      settingsPage.editSettingsByLabel('ui-dashboard-index');

      const settingsEdit = settingsPage.editSettings('local', 'ui-dashboard-index');

      settingsEdit.waitForPage();
      settingsEdit.title().contains('Setting: ui-dashboard-index').should('be.visible');
      settingsEdit.settingsInput().set(settings['ui-dashboard-index'].new);
      settingsEdit.saveAndWait('ui-dashboard-index', settings['ui-dashboard-index'].new).then(({ request, response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(request.body).to.have.property('value', settings['ui-dashboard-index'].new);
        expect(response?.body).to.have.property('value', settings['ui-dashboard-index'].new);
      });
      settingsPage.waitForPage();
      settingsPage.settingsValue('ui-dashboard-index').contains(settings['ui-dashboard-index'].new);

      // Reset
      SettingsPagePo.navTo();
      settingsPage.waitForPage();
      settingsPage.editSettingsByLabel('ui-dashboard-index');

      settingsEdit.waitForPage();
      settingsEdit.title().contains('Setting: ui-dashboard-index').should('be.visible');
      settingsEdit.useDefaultButton().click();
      settingsEdit.saveAndWait('ui-dashboard-index', originalValue).then(({ request, response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(request.body).to.have.property('value', originalValue);
        expect(response?.body).to.have.property('value', originalValue);
      });

      settingsPage.waitForPage();
      settingsPage.settingsValue('ui-dashboard-index').contains(originalValue);
    });
  });

  it('can update ui-offline-preferred', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting: Local
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('ui-offline-preferred');

    const settingsEdit = settingsPage.editSettings('local', 'ui-offline-preferred');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: ui-offline-preferred').should('be.visible');
    settingsEdit.selectSettingsByLabel('Local');
    settingsEdit.saveAndWait('ui-offline-preferred', 'Local').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', 'true');
      expect(response?.body).to.have.property('value', 'true');
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('ui-offline-preferred').contains(settings['ui-offline-preferred'].new);

    // Update settings: Remote
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('ui-offline-preferred');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: ui-offline-preferred').should('be.visible');
    settingsEdit.selectSettingsByLabel('Remote');
    settingsEdit.saveAndWait('ui-offline-preferred', 'Remote').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', 'false');
      expect(response?.body).to.have.property('value', 'false');
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('ui-offline-preferred').contains(settings['ui-offline-preferred'].new2);

    // Reset: Dynamic
    SettingsPagePo.navTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('ui-offline-preferred');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: ui-offline-preferred').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('ui-offline-preferred', 'dynamic').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', 'dynamic');
      expect(response?.body).to.have.property('value', 'dynamic');
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('ui-offline-preferred').contains(settings['ui-offline-preferred'].original);
  });

  it('can update ui-brand', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // We probably want a better way to distinguish between rancher and suse logos. I'm doing this as part of the vue3 migration and trying to keep things as similar as possible.
    const rancherLogoWidth = 142;
    const suseRancherLogoWidth = 82;

    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('ui-brand');

    const settingsEdit = settingsPage.editSettings('local', 'ui-brand');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: ui-brand').should('be.visible');
    settingsEdit.settingsInput().set(settings['ui-brand'].new);
    settingsEdit.saveAndWait('ui-brand');
    settingsPage.waitForPage();
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
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('ui-brand');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: ui-brand').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('ui-brand');

    settingsPage.waitForPage();
    settingsPage.settingsValue('ui-brand').contains(settings['ui-brand'].original);

    // Check logos in top-level navigation header for updated logo
    HomePagePo.navTo();
    burgerMenu.headerBrandLogoImage().should('be.visible').invoke('outerWidth').then((str) => parseInt(str))
      .should('eq', rancherLogoWidth);

    BurgerMenuPo.toggle();
    burgerMenu.brandLogoImage().should('be.visible').invoke('outerWidth').then((str) => parseInt(str))
      .should('eq', rancherLogoWidth);
  });

  it('can update cluster-template-enforcement', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('cluster-template-enforcement');

    const settingsEdit = settingsPage.editSettings('local', 'cluster-template-enforcement');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: cluster-template-enforcement').should('be.visible');
    settingsEdit.settingsRadioBtn().set(0);
    settingsEdit.saveAndWait('cluster-template-enforcement').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['cluster-template-enforcement'].new);
      expect(response?.body).to.have.property('value', settings['cluster-template-enforcement'].new);
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('cluster-template-enforcement').contains(settings['cluster-template-enforcement'].new);

    // Reset
    SettingsPagePo.navTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('cluster-template-enforcement');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: cluster-template-enforcement').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('cluster-template-enforcement').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['cluster-template-enforcement'].original);
      expect(response?.body).to.have.property('value', settings['cluster-template-enforcement'].original);
    });

    settingsPage.waitForPage();
    settingsPage.settingsValue('cluster-template-enforcement').contains(settings['cluster-template-enforcement'].original);
  });

  it('can update hide-local-cluster', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('hide-local-cluster');

    const settingsEdit = settingsPage.editSettings('local', 'hide-local-cluster');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: hide-local-cluster').should('be.visible');
    settingsEdit.settingsRadioBtn().set(0);
    settingsEdit.saveAndWait('hide-local-cluster');
    settingsPage.waitForPage();
    settingsPage.settingsValue('hide-local-cluster').contains(settings['hide-local-cluster'].new);

    // Check home page for local cluster
    HomePagePo.navTo();
    homePage.waitForPage();
    cy.contains('local').should('not.exist');

    // Reset
    SettingsPagePo.navTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('hide-local-cluster');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: hide-local-cluster').should('be.visible');
    settingsEdit.settingsRadioBtn().set(1);
    settingsEdit.saveAndWait('hide-local-cluster');

    settingsPage.waitForPage();
    settingsPage.settingsValue('hide-local-cluster').contains(settings['hide-local-cluster'].original);
  });

  it('can update k3s-based-upgrader-uninstall-concurrency', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('k3s-based-upgrader-uninstall-concurrency');

    const settingsEdit = settingsPage.editSettings('local', 'k3s-based-upgrader-uninstall-concurrency');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: k3s-based-upgrader-uninstall-concurrency').should('be.visible');
    settingsEdit.settingsInput().set(settings['k3s-based-upgrader-uninstall-concurrency'].new);
    settingsEdit.saveAndWait('k3s-based-upgrader-uninstall-concurrency').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['k3s-based-upgrader-uninstall-concurrency'].new);
      expect(response?.body).to.have.property('value', settings['k3s-based-upgrader-uninstall-concurrency'].new);
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('k3s-based-upgrader-uninstall-concurrency').contains(settings['k3s-based-upgrader-uninstall-concurrency'].new);

    // Reset
    SettingsPagePo.navTo();
    settingsPage.waitForPage();
    settingsPage.editSettingsByLabel('k3s-based-upgrader-uninstall-concurrency');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: k3s-based-upgrader-uninstall-concurrency').should('be.visible');
    settingsEdit.useDefaultButton().click();
    settingsEdit.saveAndWait('k3s-based-upgrader-uninstall-concurrency').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', settings['k3s-based-upgrader-uninstall-concurrency'].original);
      expect(response?.body).to.have.property('value', settings['k3s-based-upgrader-uninstall-concurrency'].original);
    });

    settingsPage.waitForPage();
    settingsPage.settingsValue('k3s-based-upgrader-uninstall-concurrency').contains(settings['k3s-based-upgrader-uninstall-concurrency'].original);
  });

  it('can update system-default-registry', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Update setting
    SettingsPagePo.navTo();
    settingsPage.editSettingsByLabel('system-default-registry');

    const settingsEdit = settingsPage.editSettings('local', 'system-default-registry');

    settingsEdit.waitForPage();
    settingsEdit.title().contains('Setting: system-default-registry').should('be.visible');
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
    createRKE2ClusterPage.clusterConfigurationTabs().clickTabWithSelector('[data-testid="btn-rke2-calico"]');
    cy.contains(settings['system-default-registry'].new).should('exist'); // Note - this doesn't test anything. docker.io exists in the chart in all worlds, system-default-registry value does not

    const settingsPageBlank = new SettingsPagePo();
    const settingsEditBlank = settingsPageBlank.editSettings(undefined, 'system-default-registry');

    // Reset
    SettingsPagePo.navTo();
    settingsPageBlank.waitForPage();
    settingsPageBlank.editSettingsByLabel('system-default-registry');

    settingsEditBlank.waitForPage();
    settingsEditBlank.title().contains('Setting: system-default-registry').should('be.visible');
    settingsEditBlank.settingsInput().clear();
    settingsEditBlank.saveAndWait('system-default-registry');

    settingsPageBlank.waitForPage();
    settingsPageBlank.settingsValue('system-default-registry').contains(settings['system-default-registry'].original);
  });

  it('standard user has only read access to Settings page', { tags: ['@globalSettings', '@standardUser'] }, () => {
    // verify action buttons are hidden for standard user
    SettingsPagePo.navTo();
    settingsPage.actionButtonByLabel('engine-install-url').should('not.exist');
    settingsPage.actionButtonByLabel('password-min-length').should('not.exist');
  });

  after(() => {
    // get most updated version of server-url response data
    if (removeServerUrl) {
      cy.getRancherResource('v1', 'management.cattle.io.settings', 'server-url', null).then((resp: Cypress.Response<any>) => {
        const response = resp.body.metadata;

        // update original response data before sending request
        settingsOrginal[0].metadata.resourceVersion = response.resourceVersion;
        cy.setRancherResource('v1', 'management.cattle.io.settings', 'server-url', settingsOrginal[0]);
      });
    }
  });
});
