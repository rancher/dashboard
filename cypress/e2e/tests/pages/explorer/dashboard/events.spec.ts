import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import { EventsPagePo } from '@/cypress/e2e/po/pages/explorer/events.po';
import { generateEventsDataSmall } from '@/cypress/e2e/blueprints/explorer/cluster/events';
import LoadingPo from '@/cypress/e2e/po/components/loading.po';

const clusterDashboard = new ClusterDashboardPagePo('local');
const events = new EventsPagePo('local');

describe('Events', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    const uniquePod = 'aaa-e2e-test-pod-name';
    const podNamesList = [];
    let nsName1: string;
    let nsName2: string;

    before('set up', () => {
      cy.updateNamespaceFilter('local', 'none', '{\"local\":[]}');

      cy.createE2EResourceName('ns1').then((ns1) => {
        nsName1 = ns1;
        // create namespace
        cy.createNamespace(nsName1);

        // create pods
        let i = 0;

        while (i < 125) {
          const podName = `e2e-${ Cypress._.uniqueId(Date.now().toString()) }`;

          cy.createPod(nsName1, podName, 'nginx:latest', false).then(() => {
            podNamesList.push(`pod-${ podName }`);
          });

          i++;
        }
      });

      cy.createE2EResourceName('ns2').then((ns2) => {
        nsName2 = ns2;

        // create namespace
        cy.createNamespace(nsName2);

        // create unique pod for filtering/sorting test
        cy.createPod(nsName2, uniquePod, 'nginx:latest');
      });
    });

    it('pagination is visible and user is able to navigate through events data', () => {
      ClusterDashboardPagePo.navTo();
      clusterDashboard.waitForPage(undefined, 'cluster-events');
      EventsPagePo.navTo();
      events.waitForPage();

      const count = 500;

      // pagination is visible
      events.sortableTable().pagination().checkVisible();

      const loadingPo = new LoadingPo('.title .resource-loading-indicator');

      loadingPo.checkNotExists();

      // basic checks on navigation buttons
      events.sortableTable().pagination().beginningButton().isDisabled();
      events.sortableTable().pagination().leftButton().isDisabled();
      events.sortableTable().pagination().rightButton().isEnabled();
      events.sortableTable().pagination().endButton().isEnabled();

      // check text before navigation
      events.sortableTable().pagination().paginationText().then((el) => {
        expect(el.trim()).to.eq(`1 - 100 of ${ count } Events`);
      });

      // navigate to next page - right button
      events.sortableTable().pagination().rightButton().click();

      // check text and buttons after navigation
      events.sortableTable().pagination().paginationText().then((el) => {
        expect(el.trim()).to.eq(`101 - 200 of ${ count } Events`);
      });
      events.sortableTable().pagination().beginningButton().isEnabled();
      events.sortableTable().pagination().leftButton().isEnabled();

      // navigate to first page - left button
      events.sortableTable().pagination().leftButton().click();

      // check text and buttons after navigation
      events.sortableTable().pagination().paginationText().then((el) => {
        expect(el.trim()).to.eq(`1 - 100 of ${ count } Events`);
      });
      events.sortableTable().pagination().beginningButton().isDisabled();
      events.sortableTable().pagination().leftButton().isDisabled();

      // navigate to last page - end button
      events.sortableTable().pagination().endButton().click();

      // check row count on last page
      events.sortableTable().checkRowCount(false, 100);

      // check text after navigation
      events.sortableTable().pagination().paginationText().then((el) => {
        expect(el.trim()).to.eq(`401 - ${ count } of ${ count } Events`);
      });

      // navigate to first page - beginning button
      events.sortableTable().pagination().beginningButton().click();

      // check text and buttons after navigation
      events.sortableTable().pagination().paginationText().then((el) => {
        expect(el.trim()).to.eq(`1 - 100 of ${ count } Events`);
      });
      events.sortableTable().pagination().beginningButton().isDisabled();
      events.sortableTable().pagination().leftButton().isDisabled();
    });

    it('filter events', () => {
      ClusterDashboardPagePo.navTo();
      clusterDashboard.waitForPage(undefined, 'cluster-events');
      EventsPagePo.navTo();
      events.waitForPage();

      events.sortableTable().checkVisible();
      events.sortableTable().checkLoadingIndicatorNotVisible();
      events.sortableTable().checkRowCount(false, 100);

      // filter by namespace
      events.sortableTable().filter(nsName2);
      events.waitForPage(`q=${ nsName2 }`);
      events.eventslist().resourceTable().sortableTable().rowElementWithPartialName(uniquePod)
        .should('have.length.lte', 5);
      events.sortableTable().rowElementWithPartialName(uniquePod).should('be.visible');

      // filter by name
      events.sortableTable().filter(uniquePod);
      events.waitForPage(`q=${ uniquePod }`);
      events.eventslist().resourceTable().sortableTable().rowElementWithPartialName(uniquePod)
        .should('have.length.lte', 5);
      events.sortableTable().rowElementWithPartialName(uniquePod).should('be.visible');

      events.sortableTable().resetFilter();
    });

    it('sorting changes the order of paginated events data', () => {
      EventsPagePo.navTo();
      events.waitForPage();

      // check table is sorted by `last seen` in ASC order by default
      events.sortableTable().tableHeaderRow().checkSortOrder(2, 'down');

      // sort by name in ASC order
      events.sortableTable().sort(11).click();
      events.sortableTable().tableHeaderRow().checkSortOrder(11, 'down');

      // event name should be visible on first page (sorted in ASC order)
      events.sortableTable().rowElementWithPartialName(uniquePod).scrollIntoView().should('be.visible');

      // sort by name in DESC order
      events.sortableTable().sort(11).click();
      events.sortableTable().tableHeaderRow().checkSortOrder(11, 'up');

      // event name should be NOT visible on first page (sorted in DESC order)
      events.sortableTable().rowElementWithPartialName(uniquePod).should('not.exist');

      // navigate to last page
      events.sortableTable().pagination().endButton().click();

      // event name should be visible on last page (sorted in DESC order)
      events.sortableTable().rowElementWithPartialName(uniquePod).scrollIntoView().should('be.visible');
    });

    it('pagination is hidden', () => {
      // generate small set of events data
      generateEventsDataSmall();
      events.goTo();
      events.waitForPage();
      cy.wait('@eventsDataSmall');

      events.sortableTable().checkVisible();
      events.sortableTable().checkLoadingIndicatorNotVisible();
      events.sortableTable().checkRowCount(false, 3);
      events.sortableTable().pagination().checkNotExists();
    });

    after('clean up', () => {
      cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');

      // delete namespace (this will also delete all pods in it)
      cy.deleteRancherResource('v1', 'namespaces', nsName1);
      cy.deleteRancherResource('v1', 'namespaces', nsName2);
    });
  });
});
