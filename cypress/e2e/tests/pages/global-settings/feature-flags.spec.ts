import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { FeatureFlagsPagePo } from '@/cypress/e2e/po/pages/global-settings/feature-flags.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';

const featureFlagsPage = new FeatureFlagsPagePo();
const burgerMenu = new BurgerMenuPo();

describe.skip('Feature Flags', { testIsolation: 'off' }, () => {
  before(() => {
    cy.login();
    HomePagePo.goTo();
  });

  it('can toggle harvester feature flag', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Check Current State: should be active by default
    FeatureFlagsPagePo.navTo();
    featureFlagsPage.list().details('harvester', 0).should('include.text', 'Active');

    // Deactivate
    featureFlagsPage.list().clickRowActionMenuItem('harvester', 'Deactivate');
    featureFlagsPage.clickCardActionButtonAndWait('Deactivate', 'harvester', false);

    // Check Updated State: should be disabled
    featureFlagsPage.list().details('harvester', 0).should('include.text', 'Disabled');

    // Check side nav
    BurgerMenuPo.toggle();
    const virtualizationMgmtNavItem = burgerMenu.links().contains('Virtualization Management');

    virtualizationMgmtNavItem.should('not.exist');

    // Activate
    BurgerMenuPo.toggle();
    featureFlagsPage.list().clickRowActionMenuItem('harvester', 'Activate');
    featureFlagsPage.clickCardActionButtonAndWait('Activate', 'harvester', true);

    // Check Updated State: should be active
    featureFlagsPage.list().details('harvester', 0).should('include.text', 'Active');

    // we now need to reload the page in order to catch the update of the product on the side-nav
    cy.reload();

    // Check side nav
    BurgerMenuPo.toggle();
    const newVirtualizationMgmtNavItem = burgerMenu.links().contains('Virtualization Management');

    newVirtualizationMgmtNavItem.should('be.visible');
  });

  it('can toggle harvester-baremetal-container-workload feature flag', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Check Current State: should be disabled by default
    FeatureFlagsPagePo.navTo();
    featureFlagsPage.list().details('harvester-baremetal-container-workload', 0).should('include.text', 'Disabled');

    // Activate
    featureFlagsPage.list().clickRowActionMenuItem('harvester-baremetal-container-workload', 'Activate');
    featureFlagsPage.clickCardActionButtonAndWait('Activate', 'harvester-baremetal-container-workload', true);

    // Check Updated State: should be active
    featureFlagsPage.list().details('harvester-baremetal-container-workload', 0).should('include.text', 'Active');

    // Deactivate
    featureFlagsPage.list().clickRowActionMenuItem('harvester-baremetal-container-workload', 'Deactivate');
    featureFlagsPage.clickCardActionButtonAndWait('Deactivate', 'harvester-baremetal-container-workload', false);

    // Check Updated State: should be disabled
    featureFlagsPage.list().details('harvester-baremetal-container-workload', 0).should('include.text', 'Disabled');
  });

  it('can toggle istio-virtual-service-ui feature flag', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Check Current State: should be active by default
    FeatureFlagsPagePo.navTo();
    featureFlagsPage.list().details('istio-virtual-service-ui', 0).should('include.text', 'Active');

    // Deactivate
    featureFlagsPage.list().clickRowActionMenuItem('istio-virtual-service-ui', 'Deactivate');
    featureFlagsPage.clickCardActionButtonAndWait('Deactivate', 'istio-virtual-service-ui', false);

    // Check Updated State: should be disabled
    featureFlagsPage.list().details('istio-virtual-service-ui', 0).should('include.text', 'Disabled');

    // Activate
    featureFlagsPage.list().clickRowActionMenuItem('istio-virtual-service-ui', 'Activate');
    featureFlagsPage.clickCardActionButtonAndWait('Activate', 'istio-virtual-service-ui', true);

    // Check Updated State: should be active
    featureFlagsPage.list().details('istio-virtual-service-ui', 0).should('include.text', 'Active');
  });

  it('can toggle rke1-custom-node-cleanup feature flag', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Check Current State: should be active by default
    FeatureFlagsPagePo.navTo();
    featureFlagsPage.list().details('rke1-custom-node-cleanup', 0).should('include.text', 'Active');

    // Deactivate
    featureFlagsPage.list().clickRowActionMenuItem('rke1-custom-node-cleanup', 'Deactivate');
    featureFlagsPage.clickCardActionButtonAndWait('Deactivate', 'rke1-custom-node-cleanup', false);

    // Check Updated State: should be disabled
    featureFlagsPage.list().details('rke1-custom-node-cleanup', 0).should('include.text', 'Disabled');

    // Activate
    featureFlagsPage.list().clickRowActionMenuItem('rke1-custom-node-cleanup', 'Activate');
    featureFlagsPage.clickCardActionButtonAndWait('Activate', 'rke1-custom-node-cleanup', true);

    // Check Updated State: should be active
    featureFlagsPage.list().details('rke1-custom-node-cleanup', 0).should('include.text', 'Active');
  });

  it('can toggle token-hashing feature flag', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Check Current State: should be disabled by default
    FeatureFlagsPagePo.navTo();
    featureFlagsPage.list().details('token-hashing', 0).should('include.text', 'Disabled');

    // Activate
    featureFlagsPage.list().clickRowActionMenuItem('token-hashing', 'Activate');
    featureFlagsPage.clickCardActionButtonAndWait('Activate', 'token-hashing', true);

    // Check Updated State: should be active
    featureFlagsPage.list().details('token-hashing', 0).should('include.text', 'Active');

    // Check - No actions available
    cy.reload();
    featureFlagsPage.list().getRowActionMenuItem('token-hashing', 'No actions available');
    featureFlagsPage.list().details('token-hashing', 1).find('i.icon-lock').should('be.visible');
  });

  it('can toggle unsupported-storage-drivers feature flag', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Check Current State: should be disabled by default
    FeatureFlagsPagePo.navTo();
    featureFlagsPage.list().details('unsupported-storage-drivers', 0).should('include.text', 'Disabled');

    // Activate
    featureFlagsPage.list().elementWithName('unsupported-storage-drivers').scrollIntoView().should('be.visible');
    featureFlagsPage.list().clickRowActionMenuItem('unsupported-storage-drivers', 'Activate');
    featureFlagsPage.clickCardActionButtonAndWait('Activate', 'unsupported-storage-drivers', true);

    // Check Updated State: should be active
    featureFlagsPage.list().details('unsupported-storage-drivers', 0).should('include.text', 'Active');

    // Deactivate
    FeatureFlagsPagePo.navTo();

    featureFlagsPage.list().elementWithName('unsupported-storage-drivers').scrollIntoView().should('be.visible');
    featureFlagsPage.list().clickRowActionMenuItem('unsupported-storage-drivers', 'Deactivate');
    featureFlagsPage.clickCardActionButtonAndWait('Deactivate', 'unsupported-storage-drivers', false);

    // Check Updated State: should be disabled
    featureFlagsPage.list().details('unsupported-storage-drivers', 0).should('include.text', 'Disabled');
  });

  it('can toggle legacy feature flag', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Check Current State: should be disabled by default
    FeatureFlagsPagePo.navTo();
    featureFlagsPage.list().details('legacy', 0).should('include.text', 'Disabled');

    // Activate
    featureFlagsPage.list().clickRowActionMenuItem('legacy', 'Activate');
    featureFlagsPage.clickCardActionButtonAndWait('Activate', 'legacy', true);

    // Check Updated State: should be active
    featureFlagsPage.list().details('legacy', 0).should('include.text', 'Active');

    // Check cluster dashboard
    const clusterDashboard = new ClusterDashboardPagePo('local');
    const sideNav = new ProductNavPo();

    clusterDashboard.goTo();
    sideNav.groups().contains('Legacy').should('be.visible');

    sideNav.navToSideMenuGroupByLabel('Legacy');
    // Ensuring deprecated items are removed from the side navigation
    sideNav.visibleNavTypes().should('not.contain', 'Alerts');
    sideNav.visibleNavTypes().should('not.contain', 'Notifiers');
    sideNav.visibleNavTypes().should('not.contain', 'Catalogs');
    // Project item should exist
    sideNav.visibleNavTypes().should('contain', 'Project');

    // Deactivate
    FeatureFlagsPagePo.navTo();
    featureFlagsPage.list().clickRowActionMenuItem('legacy', 'Deactivate');
    featureFlagsPage.clickCardActionButtonAndWait('Deactivate', 'legacy', false);

    // Check Updated State: should be disabled
    featureFlagsPage.list().details('legacy', 0).should('include.text', 'Disabled');

    // Check cluster dashboard
    clusterDashboard.goTo();
    sideNav.groups().contains('Legacy').should('not.exist');
  });

  it('error when toggling a feature flag is handled correctly', { tags: ['@globalSettings', '@adminUser'] }, () => {
    // Check Current State: should be disabled by default
    FeatureFlagsPagePo.navTo();
    featureFlagsPage.list().details('unsupported-storage-drivers', 0).should('include.text', 'Disabled');

    // Intercept the request to change the feature flag and return an error - 403, permission denied
    cy.intercept({
      method:   'PUT',
      pathname: '/v1/management.cattle.io.features/unsupported-storage-drivers',
      times:    1,
    }, {
      statusCode: 403,
      body:       {
        type:    'error',
        links:   {},
        code:    'Forbidden',
        message: 'User does not have permission'
      }
    }).as('updateFeatureFlag');

    // Activate
    featureFlagsPage.list().elementWithName('unsupported-storage-drivers').scrollIntoView().should('be.visible');
    featureFlagsPage.list().clickRowActionMenuItem('unsupported-storage-drivers', 'Activate');
    featureFlagsPage.cardActionButton('Activate').click();

    cy.wait(`@updateFeatureFlag`).its('response.statusCode').should('eq', 403);

    // Check Updated State: should be active
    featureFlagsPage.list().details('unsupported-storage-drivers', 0).should('include.text', 'Disabled');

    // Check error message is displayed
    featureFlagsPage.cardActionError('User does not have permission');

    // Press cancel
    featureFlagsPage.cardActionButton('Cancel').click();
  });

  it('standard user has only read access to Feature Flag page', { tags: ['@globalSettings', '@standardUser'] }, () => {
    // verify action menus are hidden for standard user

    const featureFlags = [
      'continuous-delivery',
      'Install Fleet when starting Rancher',
      'harvester',
      'harvester-baremetal-container-workload',
      'istio-virtual-service-ui',
      'legacy',
      'multi-cluster-management',
      'rke1-custom-node-cleanup',
      'rke2',
      'token-hashing',
      'unsupported-storage-drivers'
    ];

    FeatureFlagsPagePo.navTo();

    featureFlags.forEach((featureFlags) => {
      featureFlagsPage.list().details(featureFlags, 4).should('not.exist');
    });
  });

  describe('List', { tags: ['@vai', '@globalSettings', '@adminUser', '@standardUser'] }, () => {
    it('validate feature flags table header content', () => {
      FeatureFlagsPagePo.navTo();
      // check table headers are visible
      const expectedHeaders = ['State', 'Name', 'Description', 'Restart Rancher'];

      featureFlagsPage.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      featureFlagsPage.list().resourceTable().sortableTable().checkVisible();
      featureFlagsPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      featureFlagsPage.list().resourceTable().sortableTable().noRowsShouldNotExist();
      cy.getRancherResource('v1', 'management.cattle.io.features').then((resp: Cypress.Response<any>) => {
        const featureCount = resp.body.count;

        featureFlagsPage.list().resourceTable().sortableTable().checkRowCount(false, featureCount);
      });
    });
  });
});
