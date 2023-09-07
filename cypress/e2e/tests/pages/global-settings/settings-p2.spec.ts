import { SettingsPagePo } from '@/cypress/e2e/po/pages/global-settings/settings.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ClusterManagerCreateRke2CustomPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-custom.po';
import AccountPagePo from '@/cypress/e2e/po/pages/account-api-keys.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import { settings } from '@/cypress/e2e/blueprints/global_settings/settigns-data';

const settingsPage = new SettingsPagePo();
const homePage = new HomePagePo();
const accountPage = new AccountPagePo();
const clusterList = new ClusterManagerListPagePo('local');
const burgerMenu = new BurgerMenuPo();

describe('Settings', () => {
  beforeEach(() => {
    cy.login();
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

    const settingsEdit = settingsPage.editSettings('_', 'server-url');

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

    const settingsEdit = settingsPage.editSettings('_', 'system-default-registry');

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
    settingsEdit.settingsInput().clear();
    settingsEdit.saveAndWait('system-default-registry');

    settingsPage.waitForPage();
    settingsPage.settingsValue('system-default-registry').contains(settings['system-default-registry'].original);
  });

  it('can update ui-index', { tags: '@adminUser' }, () => {
    // Update setting
    settingsPage.goTo();
    settingsPage.editSettingsByLabel('ui-index');

    const settingsEdit = settingsPage.editSettings('_', 'ui-index');

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

    const settingsEdit = settingsPage.editSettings('_', 'ui-dashboard-index');

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

    const settingsEdit = settingsPage.editSettings('_', 'ui-offline-preferred');

    settingsEdit.waitForPage();
    cy.contains('Setting: ui-offline-preferred').should('be.visible');
    settingsEdit.selectSettingsByLabel('Local');
    settingsEdit.saveAndWait('ui-offline-preferred', 'Local').then(({ request, response }) => {
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
    settingsEdit.saveAndWait('ui-offline-preferred', 'Remote').then(({ request, response }) => {
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
    settingsEdit.saveAndWait('ui-offline-preferred', 'dynamic').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.have.property('value', 'dynamic');
      expect(response?.body).to.have.property('value', 'dynamic');
    });
    settingsPage.waitForPage();
    settingsPage.settingsValue('ui-offline-preferred').contains(settings['ui-offline-preferred'].original);
  });

  it.skip('can update ui-brand', { tags: '@adminUser' }, () => {
    // Note: this test fails sometimes due to https://github.com/rancher/dashboard/issues/9551
    // skipping this test until issue is resolved
    const rancherLogo = '/img/rancher-logo.66cf5910.svg';
    const suseRancherLogo = '/img/rancher-logo.055089a3.svg';

    // Update setting
    settingsPage.goTo();
    settingsPage.editSettingsByLabel('ui-brand');

    const settingsEdit = settingsPage.editSettings('_', 'ui-brand');

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

    const settingsEdit = settingsPage.editSettings('_', 'cluster-template-enforcement');

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

    const settingsEdit = settingsPage.editSettings('_', 'telemetry-opt');

    settingsEdit.waitForPage();
    cy.contains('Setting: telemetry-opt').should('be.visible');
    settingsEdit.useDefaultButton().should('be.disabled'); // button should be disabled for this settings option
    settingsEdit.selectSettingsByLabel('Prompt');
    settingsEdit.saveAndWait('telemetry-opt', 'prompt').then(({ request, response }) => {
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
    settingsEdit.saveAndWait('telemetry-opt', 'in').then(({ request, response }) => {
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
    settingsEdit.saveAndWait('telemetry-opt', 'out').then(({ request, response }) => {
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

    const settingsEdit = settingsPage.editSettings('_', 'hide-local-cluster');

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
