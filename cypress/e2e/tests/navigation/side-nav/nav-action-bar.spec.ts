import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { ConfigMapListPagePo } from '@/cypress/e2e/po/pages/explorer/config-map.po';
import { WorkloadsDeploymentsListPagePo } from '@/cypress/e2e/po/pages/explorer/workloads/workloads-deployments.po';

const clusterDashboard = new ClusterDashboardPagePo('local');

/**
 * The toolbar above the side nav, which replaces the resource search dialog: the
 * jump-to search, the collapse-all control, and the expanded state that is now
 * persisted per cluster rather than reset on every navigation.
 */
describe('Side navigation: action bar', { tags: ['@navigation', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();

    clusterDashboard.goTo();
    clusterDashboard.waitForPage();
  });

  it('Offers a default list of sections before anything is searched', () => {
    const actionBar = new ProductNavPo().actionBar();

    actionBar.openJumpTo();

    actionBar.jumpToResults().should('have.length.gt', 0);
  });

  it('Can find a section by label and navigate to it', () => {
    const actionBar = new ProductNavPo().actionBar();

    actionBar.openJumpTo();
    actionBar.searchJumpTo('ConfigMap');

    actionBar.jumpToResultLabels().should('contain.text', 'ConfigMaps');
    actionBar.jumpToResultLabels().contains('ConfigMaps').click();

    const configMapPage = new ConfigMapListPagePo('local');

    configMapPage.waitForPage();
    actionBar.jumpToDropdown().should('not.exist');
  });

  it('Can find a section by its type name, as the search dialog it replaces did', () => {
    const actionBar = new ProductNavPo().actionBar();

    actionBar.openJumpTo();
    // Not a substring of the "Deployments" label, so this only matches via the
    // type name (`apps.deployment`), the way an API group search used to
    actionBar.searchJumpTo('apps.deploy');

    actionBar.jumpToResultLabels().should('contain.text', 'Deployments');
    actionBar.jumpToResultLabels().contains('Deployments').click();

    new WorkloadsDeploymentsListPagePo('local').waitForPage();
  });

  it('Shows an empty state when nothing matches', () => {
    const actionBar = new ProductNavPo().actionBar();

    actionBar.openJumpTo();
    actionBar.searchJumpTo('zzzznotasection');

    actionBar.jumpToResults().should('have.length', 0);
    actionBar.jumpToDropdown().find('.jump-to-empty').should('be.visible');
  });

  it('Collapses every group at once, and offers the control only while one is expanded', () => {
    const productNav = new ProductNavPo();
    const actionBar = productNav.actionBar();

    // Make sure at least one group is expanded before collapsing
    productNav.groups().not('.expanded').eq(0)
      .should('be.visible')
      .click();
    productNav.expandedGroup().should('have.length.gte', 1);

    actionBar.collapseAllButton().should('be.visible').click();

    productNav.expandedGroup().should('have.length', 0);
    // With nothing left expanded there is nothing to collapse
    actionBar.collapseAllButton().should('not.exist');
  });

  it('Keeps a group expanded after a reload', () => {
    const productNav = new ProductNavPo();

    productNav.groups().not('.expanded').eq(0)
      .find('.header h6')
      .first()
      .invoke('text')
      .then((text) => {
        const label = text.trim();

        productNav.groupByLabel(label).click();
        productNav.groupByLabel(label).should('have.class', 'expanded');

        // The expanded state is persisted per cluster, so it outlives the page
        cy.reload();
        productNav.self().should('be.visible');

        productNav.groupByLabel(label).should('have.class', 'expanded');
      });
  });
});
