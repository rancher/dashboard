import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';

const clusterDashboard = new ClusterDashboardPagePo('local');
const STARRED = 'Starred';

/**
 * The starred group holds the types the user picked, so it starts expanded
 * rather than collapsed like the other groups, until the user collapses it.
 */
describe('Side navigation: starred group', { tags: ['@navigation', '@adminUser'] }, () => {
  before(() => {
    cy.login();
    cy.setUserPreference({ 'fav-type': '["configmap"]' }, true);
  });

  beforeEach(() => {
    cy.login();

    clusterDashboard.goTo();
    clusterDashboard.waitForPage();

    // Start every test as a first visit, with no expand state saved for the cluster
    cy.clearLocalStorage('local:nav-group-state');
    cy.reload();
    clusterDashboard.waitForPage();
  });

  it('Is expanded by default', () => {
    const productNav = new ProductNavPo();

    productNav.groupByLabel(STARRED).should('have.class', 'expanded');
    productNav.groupByLabel(STARRED).find('li.nav-type').should('contain.text', 'ConfigMaps');
  });

  it('Stays collapsed after a reload once the user has collapsed it', () => {
    const productNav = new ProductNavPo();

    productNav.groupByLabel(STARRED).find('i.toggle-accordion').first().click();
    productNav.groupByLabel(STARRED).should('not.have.class', 'expanded');

    cy.reload();
    productNav.self().should('be.visible');

    productNav.groupByLabel(STARRED).should('not.have.class', 'expanded');
  });

  it('Stays collapsed after a reload once every group is collapsed', () => {
    const productNav = new ProductNavPo();

    productNav.groupByLabel(STARRED).should('have.class', 'expanded');
    productNav.actionBar().collapseAllButton().click();
    productNav.expandedGroup().should('have.length', 0);

    cy.reload();
    productNav.self().should('be.visible');

    productNav.groupByLabel(STARRED).should('not.have.class', 'expanded');
  });

  after(() => {
    cy.setUserPreference({ 'fav-type': '[]' });
  });
});
