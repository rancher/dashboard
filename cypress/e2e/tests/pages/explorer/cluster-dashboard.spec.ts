import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
// import ClusterToolsPagePo from '@/cypress/e2e/po/pages/explorer/cluster-tools.po';
import CardPo from '@/cypress/e2e/po/components/card.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import SimpleBoxPo from '@/cypress/e2e/po/components/simple-box.po';
import { WorkloadsDeploymentsListPagePo } from '@/cypress/e2e/po/pages/explorer/workloads/workloads-deployments.po';
import { EventsPagePo } from '~/cypress/e2e/po/pages/explorer/events.po';

const clusterDashboard = new ClusterDashboardPagePo('local');
const simpleBox = new SimpleBoxPo();
const header = new HeaderPo();
// const clusterTools = new ClusterToolsPagePo('local');

describe('Cluster Dashboard', { tags: '@adminUser' }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('can navigate to cluster dashboard', () => {
    const clusterList = new ClusterManagerListPagePo('local');

    clusterList.goTo();
    clusterList.waitForPage();
    clusterList.list().explore('local').click();

    clusterDashboard.waitForPage(undefined, 'cluster-events');
  });

  it('can install monitoring', () => {
    clusterDashboard.goTo();
    clusterDashboard.installMonitoring().click();

    /**
     * TODO: update to use the following code when https://github.com/rancher/dashboard/pull/9749 is merged
     * clusterTools.waitForPage()
     * clusterTools.featureChartCards().eq(0).should('contain', 'Alerting Drivers');
    */
    cy.contains('Alerting Drivers');
  });

  it('can add cluster badge', () => {
    const settings = {
      description: {
        original: 'Example Text',
        new:      'E2E Test'
      },
      iconText: {
        original: 'EX',
        new:      'E2'
      },
      backgroundColor: {
        original: '#ff0000',
        new:      '#f80dd8',
        newRGB:   'rgb(248, 13, 216)'
      }
    };

    clusterDashboard.goTo();

    // Add Badge
    clusterDashboard.addClusterBadge('Add Cluster Badge').click();

    const customClusterCard = new CardPo();

    customClusterCard.getTitle().contains('Custom Cluster Badge');

    // update badge
    clusterDashboard.clusterBadge().selectCheckbox('Show badge for this cluster').set();
    clusterDashboard.clusterBadge().badgeCustomDescription().set(settings.description.new);

    // update color
    clusterDashboard.clusterBadge().colorPicker().value().should('not.eq', settings.backgroundColor.new);
    clusterDashboard.clusterBadge().colorPicker().set(settings.backgroundColor.new);
    clusterDashboard.clusterBadge().colorPicker().previewColor().should('eq', settings.backgroundColor.newRGB);

    // update icon
    clusterDashboard.clusterBadge().clusterIcon().children().should('have.class', 'cluster-local-logo');
    clusterDashboard.clusterBadge().selectCheckbox('Customize cluster icon').set();
    clusterDashboard.clusterBadge().clusterIcon().children().should('not.have.class', 'cluster-local-logo');
    clusterDashboard.clusterBadge().clusterIcon().contains(settings.iconText.original);
    clusterDashboard.clusterBadge().iconText().set(settings.iconText.new);
    clusterDashboard.clusterBadge().clusterIcon().contains(settings.iconText.new);

    // Apply Changes
    clusterDashboard.clusterBadge().applyAndWait('/v3/clusters/local');

    // check header and side nav for update

    header.clusterIcon().children().should('have.class', 'cluster-badge-logo');
    header.clusterName().should('contain', 'local');
    header.clusterBadge().should('contain', settings.description.new);
    const burgerMenu = new BurgerMenuPo();

    burgerMenu.clusters().first().find('span').should('contain', settings.iconText.new);

    // Reset
    clusterDashboard.addClusterBadge('Edit Cluster Badge').click();
    clusterDashboard.clusterBadge().selectCheckbox('Customize cluster icon').set();
    clusterDashboard.clusterBadge().selectCheckbox('Show badge for this cluster').set();

    // Apply Changes
    clusterDashboard.clusterBadge().applyAndWait('/v3/clusters/local');

    // check header and side nav for update
    header.clusterIcon().children().should('have.class', 'cluster-local-logo');
    header.clusterName().should('contain', 'local');
    header.clusterBadge().should('not.exist');
    burgerMenu.clusters().first().find('svg').should('have.class', 'cluster-local-logo');
  });

  it('can view deployments', () => {
    clusterDashboard.goTo();
    cy.getRancherResource('v1', '/apps.deployments', '?exclude=metadata.managedFields').then((resp: Cypress.Response<any>) => {
      const count = resp.body['count'];

      simpleBox.simpleBox().eq(2).should('contain.text', count).and('contain.text', 'Deployments');
    }).then((el: any) => {
      el.click();

      const workloadDeployments = new WorkloadsDeploymentsListPagePo('local', 'apps.deployment');

      workloadDeployments.waitForPage();
    });
  });

  it('can view nodes', () => {
    clusterDashboard.goTo();
    cy.getRancherResource('v1', '/nodes', '?exclude=metadata.managedFields').then((resp: Cypress.Response<any>) => {
      const count = resp.body['count'];

      simpleBox.simpleBox().eq(1).should('contain.text', count).and('contain.text', 'Nodes');
    }).then((el: any) => {
      el.click();

      const workloadNodes = new WorkloadsDeploymentsListPagePo('local', 'node');

      workloadNodes.waitForPage();
    });
  });

  it('can view events', () => {
    clusterDashboard.goTo();

    // Install monitoring to trigger events

    /**
     * TODO: update to use the following code when https://github.com/rancher/dashboard/pull/9749 is merged
     * clusterDashboard.installMonitoring().click();
     * clusterTools.waitForPage()
     * clusterTools.goToInstall(0);
     * installCharts.waitForPage();
     * installCharts.nextPage();
     *
     * cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?action=install').as('chartInstall');
     * installCharts.installChart().click();
     * cy.wait('@chartInstall').its('response.statusCode').should('eq', 201);
     * clusterTools.waitForPage();
     * cy.contains('Connected');
    */

    // Check events
    clusterDashboard.eventslist().resourceTable().sortableTable().rowElements()
      .should('have.length.gte', 1);

    clusterDashboard.fullEventsLink().click();

    const events = new EventsPagePo('local');

    events.waitForPage();
  });
});
